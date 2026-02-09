// skills/openclaw_connector/OpenClawConnector.js
/**
 * OpenClaw Connector Skill
 * 
 * Handles requests from OpenClaw agents to interact with ClawPay.
 * This connector translates OpenClaw commands to ClawPay API operations.
 * 
 * Security:
 * - All requests must be pre-authenticated via authMiddleware
 * - Inputs are validated and sanitized
 * - Only read operations + bounty submissions allowed
 * - No direct fund transfer capabilities
 */

import { isValidHandle, isValidHttpsUrl, isValidBountyId, sanitizeForLog } from '../../middleware/authMiddleware.js';

class OpenClawConnector {
    constructor(firestore) {
        this.firestore = firestore;
        this.usersCollection = firestore.collection('backend_users');
        this.paymentsCollection = firestore.collection('payments');
        this.bountiesCollection = firestore.collection('bounties');
        this.agentLogsCollection = firestore.collection('agent_logs');
    }

    /**
     * Get reputation and stats for an agent.
     * @param {string} handle - X handle to look up
     * @returns {Promise<{success: boolean, reputation?: object, error?: string}>}
     */
    async getReputation(handle) {
        // Validate handle
        const cleanHandle = this.normalizeHandle(handle);
        if (!isValidHandle(cleanHandle)) {
            return { success: false, error: 'Invalid handle format' };
        }

        try {
            const userDoc = await this.usersCollection.doc(cleanHandle).get();

            if (!userDoc.exists) {
                return {
                    success: true,
                    reputation: {
                        handle: cleanHandle,
                        exists: false,
                        score: 0,
                        total_earned: 0,
                        total_sent: 0,
                        bounties_completed: 0,
                        status: 'NEW'
                    }
                };
            }

            const userData = userDoc.data();

            // Calculate reputation score (simple formula)
            const totalEarned = userData.total_claimed || 0;
            const totalSent = userData.total_sent || 0;
            const bountiesCompleted = userData.bounties_completed || 0;

            // Score formula: base 20 + earned weight + sent weight + bounty bonus
            let score = 20;
            score += Math.min(40, totalEarned * 0.5); // Up to 40 points for earnings
            score += Math.min(20, totalSent * 0.3);   // Up to 20 points for sending
            score += Math.min(20, bountiesCompleted * 5); // 5 points per bounty, up to 20
            score = Math.min(100, Math.round(score));

            // Determine status
            let status = 'NEW';
            if (score >= 80) status = 'TRUSTED';
            else if (score >= 50) status = 'ESTABLISHED';
            else if (score >= 20) status = 'ACTIVE';

            return {
                success: true,
                reputation: {
                    handle: cleanHandle,
                    exists: true,
                    score,
                    total_earned: totalEarned,
                    total_sent: totalSent,
                    bounties_completed: bountiesCompleted,
                    status,
                    member_since: userData.created_at?.toDate?.()?.toISOString() || null
                }
            };
        } catch (error) {
            console.error('OpenClawConnector.getReputation error:', error);
            return { success: false, error: 'Failed to fetch reputation' };
        }
    }

    /**
     * List bounties available to an agent.
     * @param {string} agentHandle - The requesting agent's handle
     * @param {object} filters - Optional filters {status, limit}
     * @returns {Promise<{success: boolean, bounties?: array, error?: string}>}
     */
    async listBounties(agentHandle, filters = {}) {
        try {
            const limit = Math.min(filters.limit || 20, 50);
            const cleanHandle = this.normalizeHandle(agentHandle);

            // Get open bounties, optionally filtered by assignment
            let query = this.bountiesCollection
                .where('status', 'in', ['open', 'in_progress'])
                .orderBy('created_at', 'desc')
                .limit(limit);

            const snapshot = await query.get();
            const bounties = [];

            snapshot.forEach(doc => {
                const bounty = { id: doc.id, ...doc.data() };

                // Only include if not assigned, or assigned to this agent
                if (!bounty.assigned_to || bounty.assigned_to === cleanHandle) {
                    bounties.push({
                        id: bounty.id,
                        title: bounty.title,
                        description: bounty.description?.slice(0, 500) || '',
                        reward: bounty.reward,
                        tags: bounty.tags || [],
                        status: bounty.status,
                        assigned_to: bounty.assigned_to || null,
                        is_assigned_to_you: bounty.assigned_to === cleanHandle,
                        deadline: bounty.deadline || null,
                        created_at: bounty.created_at?.toDate?.()?.toISOString() || null
                    });
                }
            });

            return { success: true, bounties, count: bounties.length };
        } catch (error) {
            console.error('OpenClawConnector.listBounties error:', error);
            return { success: false, error: 'Failed to fetch bounties' };
        }
    }

    /**
     * Submit proof for a bounty.
     * @param {string} agentHandle - The submitting agent's handle
     * @param {string} bountyId - Bounty ID to submit for
     * @param {string} proofUrl - HTTPS URL with proof of work
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    async submitBountyProof(agentHandle, bountyId, proofUrl) {
        const cleanHandle = this.normalizeHandle(agentHandle);

        // Validate inputs
        if (!isValidHandle(cleanHandle)) {
            return { success: false, error: 'Invalid handle format' };
        }

        if (!isValidBountyId(bountyId)) {
            return { success: false, error: 'Invalid bounty ID format' };
        }

        if (!isValidHttpsUrl(proofUrl)) {
            return { success: false, error: 'Proof URL must be a valid HTTPS URL' };
        }

        try {
            const bountyRef = this.bountiesCollection.doc(bountyId);
            const bountyDoc = await bountyRef.get();

            if (!bountyDoc.exists) {
                return { success: false, error: 'Bounty not found' };
            }

            const bounty = bountyDoc.data();

            // Check if bounty is accepting submissions
            if (bounty.status !== 'open' && bounty.status !== 'in_progress') {
                return { success: false, error: 'Bounty is not accepting submissions' };
            }

            // Check if bounty is assigned to someone else
            if (bounty.assigned_to && bounty.assigned_to !== cleanHandle) {
                return {
                    success: false,
                    error: `This bounty is exclusively assigned to @${bounty.assigned_to}`
                };
            }

            // Check for duplicate submission from same agent
            const existingSubmissions = bounty.submissions || [];
            const alreadySubmitted = existingSubmissions.some(s => s.username === cleanHandle);
            if (alreadySubmitted) {
                return { success: false, error: 'You have already submitted for this bounty' };
            }

            // Add submission
            const submission = {
                username: cleanHandle,
                proof: proofUrl,
                submitted_at: new Date().toISOString(),
                status: 'pending',
                source: 'openclaw'
            };

            const { FieldValue } = await import('firebase-admin/firestore');
            await bountyRef.update({
                submissions: FieldValue.arrayUnion(submission),
                status: 'evaluating'
            });

            // Log the submission
            await this.agentLogsCollection.add({
                type: 'BOUNTY_SUBMISSION',
                agent: cleanHandle,
                bounty_id: bountyId,
                bounty_title: bounty.title,
                proof_url: proofUrl,
                source: 'openclaw',
                timestamp: new Date()
            });

            console.log(`📝 OpenClaw submission: @${cleanHandle} submitted for "${bounty.title}"`);

            return {
                success: true,
                message: 'Submission received successfully',
                bounty_title: bounty.title,
                reward: bounty.reward
            };
        } catch (error) {
            console.error('OpenClawConnector.submitBountyProof error:', error);
            return { success: false, error: 'Failed to submit proof' };
        }
    }

    /**
     * Get pending claims for an agent.
     * @param {string} agentHandle - The agent's handle
     * @returns {Promise<{success: boolean, claims?: array, error?: string}>}
     */
    async getPendingClaims(agentHandle) {
        const cleanHandle = this.normalizeHandle(agentHandle);

        if (!isValidHandle(cleanHandle)) {
            return { success: false, error: 'Invalid handle format' };
        }

        try {
            const claimsQuery = await this.paymentsCollection
                .where('recipient_username', '==', cleanHandle)
                .where('status', '==', 'pending')
                .orderBy('created_at', 'desc')
                .limit(20)
                .get();

            const claims = [];
            claimsQuery.forEach(doc => {
                const claim = doc.data();
                claims.push({
                    id: doc.id,
                    amount: claim.amount,
                    sender: claim.sender_username,
                    reason: claim.reason || 'Payment',
                    skill_id: claim.skill_id || null,
                    bounty_id: claim.bounty_id || null,
                    created_at: claim.created_at?.toDate?.()?.toISOString() || null,
                    claim_url: `https://clawpayagent.fun/claim/${doc.id}`
                });
            });

            return {
                success: true,
                claims,
                count: claims.length,
                total_pending: claims.reduce((sum, c) => sum + c.amount, 0)
            };
        } catch (error) {
            console.error('OpenClawConnector.getPendingClaims error:', error);
            return { success: false, error: 'Failed to fetch claims' };
        }
    }

    /**
     * Normalize an X handle (lowercase, remove @).
     * @param {string} handle 
     * @returns {string}
     */
    normalizeHandle(handle) {
        if (!handle) return '';
        return String(handle).replace(/^@/, '').toLowerCase().trim();
    }
}

export { OpenClawConnector };
