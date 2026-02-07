import '../index.css';

export function PendingClaims({ claims, onClaim, loading }) {
    const hasClaims = claims && claims.length > 0;


    // Helper to determine sender fund status
    const getSenderStatus = (claim) => {
        // Check if sender fund info is available from backend (new enriched claims)
        if (claim.sender_can_pay === true) {
            return { ok: true, message: 'Sender is ready to pay' };
        }
        if (claim.sender_authorized === false) {
            return { ok: false, message: 'Sender needs to authorize vault' };
        }
        if (claim.sender_authorized === true && claim.sender_delegated_amount < claim.amount) {
            return { ok: false, message: `Sender authorized $${claim.sender_delegated_amount?.toFixed(2) || 0}, needs $${claim.amount}` };
        }
        if (claim.sender_balance !== undefined && claim.sender_balance < claim.amount) {
            return { ok: false, message: 'Sender has insufficient USDC balance' };
        }
        // Status unknown (backend doesn't provide this info yet or no wallet)
        if (claim.sender_wallet === null || claim.sender_wallet === undefined) {
            return { ok: false, message: 'Sender needs to log in and fund' };
        }
        return null;
    };

    return (
        <div className="glass-panel claims-card" style={{
            padding: '30px',
            marginBottom: '20px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
            }}>
                <span className="mono label-subtle" style={{ color: 'var(--accent)' }}>// PENDING_CLAIMS</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--accent)', color: '#000', padding: '2px 8px', borderRadius: '4px' }}>
                    {hasClaims ? claims.length : 0}
                </span>
            </div>

            {!hasClaims ? (
                <div className="inset-panel" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📭</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No pending claims yet. When someone sends you USDC via X, it will appear here!
                    </div>
                </div>
            ) : (
                claims.map((claim) => {
                    const senderStatus = getSenderStatus(claim);
                    const canClaim = !senderStatus || senderStatus.ok;

                    return (
                        <div key={claim.tweet_id} className="inset-panel" style={{ marginBottom: '15px', padding: '20px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '15px'
                            }}>
                                <div>
                                    <div className="amount-display" style={{ fontSize: '2rem' }}>
                                        ${claim.amount}
                                        <span className="currency">USDC</span>
                                    </div>
                                    <div className="handle-badge" style={{ marginTop: '10px' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                                        </svg>
                                        @{claim.sender || claim.sender_username}
                                    </div>

                                    {/* Sender Fund Status */}
                                    {senderStatus && (
                                        <div style={{
                                            marginTop: '12px',
                                            fontSize: '0.75rem',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            background: senderStatus.ok
                                                ? 'rgba(16, 185, 129, 0.1)'
                                                : 'rgba(245, 158, 11, 0.1)',
                                            border: '1px solid ' + (senderStatus.ok ? 'var(--success)' : 'var(--accent)'),
                                            color: senderStatus.ok ? 'var(--success)' : 'var(--accent)',
                                            fontWeight: 600
                                        }} className="mono">
                                            {senderStatus.ok ? '✓' : '⚠'} {senderStatus.message.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => onClaim(claim)}
                                    disabled={loading || !canClaim}
                                    className="btn btn-accent"
                                    style={{
                                        opacity: (loading || !canClaim) ? 0.7 : 1,
                                        borderRadius: '12px'
                                    }}
                                >
                                    {loading ? 'CLAIMING...' : (canClaim ? 'CLAIM NOW' : 'WAITING')}
                                </button>
                            </div>

                            {claim.tweet_id && (
                                <a
                                    href={`https://twitter.com/i/status/${claim.tweet_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-block',
                                        marginTop: '12px',
                                        fontSize: '0.7rem',
                                        color: 'var(--glow)',
                                        textDecoration: 'none'
                                    }}
                                >
                                    View source tweet →
                                </a>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

