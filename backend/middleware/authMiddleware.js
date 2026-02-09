// middleware/authMiddleware.js
// OpenClaw Agent Authentication & Rate Limiting Middleware

/**
 * Security middleware for OpenClaw agent API endpoints.
 * 
 * Features:
 * - API key validation against Firestore 'agent_keys' collection
 * - Sliding window rate limiting (configurable, default 10 req/min)
 * - Audit logging to Firestore 'agent_audit_log' collection
 * - Input sanitization helpers
 */

// In-memory rate limit store (per API key)
const rateLimitStore = new Map();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = parseInt(process.env.OPENCLAW_RATE_LIMIT) || 10;

/**
 * Cleans up expired rate limit entries to prevent memory leaks.
 * Run periodically.
 */
function cleanupRateLimitStore() {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
        // Remove entries older than 5 minutes
        if (now - data.windowStart > 5 * 60 * 1000) {
            rateLimitStore.delete(key);
        }
    }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

/**
 * Check and update rate limit for an API key.
 * Uses sliding window algorithm.
 * @param {string} apiKey - The API key to check
 * @param {number} maxRequests - Maximum requests per window
 * @returns {{allowed: boolean, remaining: number, resetIn: number}}
 */
function checkRateLimit(apiKey, maxRequests = DEFAULT_MAX_REQUESTS) {
    const now = Date.now();
    let data = rateLimitStore.get(apiKey);

    if (!data || now - data.windowStart >= RATE_LIMIT_WINDOW_MS) {
        // Start new window
        data = { windowStart: now, count: 1 };
        rateLimitStore.set(apiKey, data);
        return { allowed: true, remaining: maxRequests - 1, resetIn: RATE_LIMIT_WINDOW_MS };
    }

    // Within window
    if (data.count >= maxRequests) {
        const resetIn = RATE_LIMIT_WINDOW_MS - (now - data.windowStart);
        return { allowed: false, remaining: 0, resetIn };
    }

    data.count++;
    return { allowed: true, remaining: maxRequests - data.count, resetIn: RATE_LIMIT_WINDOW_MS - (now - data.windowStart) };
}

/**
 * Validates an X handle format.
 * @param {string} handle - The handle to validate
 * @returns {boolean}
 */
function isValidHandle(handle) {
    if (!handle || typeof handle !== 'string') return false;
    // Alphanumeric + underscores, 1-50 chars
    return /^[a-zA-Z0-9_]{1,50}$/.test(handle);
}

/**
 * Validates a URL is HTTPS.
 * @param {string} url - The URL to validate
 * @returns {boolean}
 */
function isValidHttpsUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Validates a bounty ID format.
 * @param {string} id - The bounty ID to validate
 * @returns {boolean}
 */
function isValidBountyId(id) {
    if (!id || typeof id !== 'string') return false;
    // bounty_<timestamp> or bounty_<timestamp>_<username>
    return /^bounty_[a-zA-Z0-9_]+$/.test(id) && id.length <= 100;
}

/**
 * Sanitize a string for safe logging (remove control chars, limit length).
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
function sanitizeForLog(str, maxLength = 200) {
    if (!str || typeof str !== 'string') return '';
    // Remove control characters and limit length
    return str.replace(/[\x00-\x1F\x7F]/g, '').slice(0, maxLength);
}

/**
 * Creates the OpenClaw authentication middleware.
 * @param {FirebaseFirestore.Firestore} firestore - Firestore instance
 * @returns {Function} Express middleware
 */
function createOpenClawAuthMiddleware(firestore) {
    const agentKeysCollection = firestore.collection('agent_keys');
    const auditLogCollection = firestore.collection('agent_audit_log');

    return async function openClawAuth(req, res, next) {
        const startTime = Date.now();
        const apiKey = req.headers['x-openclaw-api-key'];
        const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';

        // Check for API key presence
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API key required',
                message: 'Include X-OpenClaw-API-Key header with your request'
            });
        }

        // Validate API key format (basic sanity check)
        if (typeof apiKey !== 'string' || apiKey.length < 8 || apiKey.length > 128) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key format'
            });
        }

        try {
            // Look up API key in Firestore
            const keyDoc = await agentKeysCollection.doc(apiKey).get();

            if (!keyDoc.exists) {
                // Log failed attempt
                await auditLogCollection.add({
                    type: 'auth_failed',
                    reason: 'key_not_found',
                    api_key_prefix: apiKey.slice(0, 8) + '...',
                    ip: clientIp,
                    path: req.path,
                    method: req.method,
                    timestamp: new Date()
                });

                return res.status(401).json({
                    success: false,
                    error: 'Invalid API key'
                });
            }

            const keyData = keyDoc.data();

            // Check if key is approved
            if (keyData.status !== 'approved') {
                await auditLogCollection.add({
                    type: 'auth_failed',
                    reason: 'key_not_approved',
                    status: keyData.status,
                    handle: keyData.handle,
                    ip: clientIp,
                    path: req.path,
                    method: req.method,
                    timestamp: new Date()
                });

                return res.status(403).json({
                    success: false,
                    error: 'API key not approved',
                    status: keyData.status,
                    message: keyData.status === 'pending'
                        ? 'Your API key is pending admin approval'
                        : 'Your API key has been revoked'
                });
            }

            // Check rate limit
            const rateLimit = checkRateLimit(apiKey, keyData.rate_limit || DEFAULT_MAX_REQUESTS);

            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', keyData.rate_limit || DEFAULT_MAX_REQUESTS);
            res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
            res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.resetIn / 1000));

            if (!rateLimit.allowed) {
                await auditLogCollection.add({
                    type: 'rate_limited',
                    handle: keyData.handle,
                    ip: clientIp,
                    path: req.path,
                    method: req.method,
                    timestamp: new Date()
                });

                res.setHeader('Retry-After', Math.ceil(rateLimit.resetIn / 1000));
                return res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded',
                    retry_after: Math.ceil(rateLimit.resetIn / 1000),
                    message: `Too many requests. Please wait ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`
                });
            }

            // Attach agent info to request for downstream handlers
            req.openClawAgent = {
                handle: keyData.handle,
                apiKey: apiKey,
                permissions: keyData.permissions || ['read'],
                createdAt: keyData.created_at
            };

            // Log successful request (async, don't block)
            auditLogCollection.add({
                type: 'request',
                handle: keyData.handle,
                ip: clientIp,
                path: req.path,
                method: req.method,
                duration_ms: Date.now() - startTime,
                timestamp: new Date()
            }).catch(err => console.error('Audit log error:', err));

            next();
        } catch (error) {
            console.error('OpenClaw auth middleware error:', error);
            return res.status(500).json({
                success: false,
                error: 'Authentication service error'
            });
        }
    };
}

export {
    createOpenClawAuthMiddleware,
    checkRateLimit,
    isValidHandle,
    isValidHttpsUrl,
    isValidBountyId,
    sanitizeForLog
};
