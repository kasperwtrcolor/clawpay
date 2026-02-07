import '../index.css';

export function PaymentHistory({ payments, xUsername }) {
    return (
        <div className="plate" style={{ padding: '30px', marginBottom: '20px', position: 'relative' }}>
            <div className="engraved" style={{ marginBottom: '20px' }}>// TRANSACTION_HISTORY</div>

            {payments.length === 0 ? (
                <div className="inset-panel" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.3, color: 'var(--text-primary)' }}>$</div>
                    <div style={{ color: 'var(--text-muted)' }}>No transactions yet</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Make your first payment by posting on X
                    </div>
                </div>
            ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {payments.map((payment) => {
                        const isSent = payment.sender_username?.toLowerCase() === xUsername?.toLowerCase();
                        return (
                            <div
                                key={payment.id || payment.tweet_id}
                                style={{
                                    background: 'var(--bg-inset)',
                                    border: 'var(--border-subtle)',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    marginBottom: '10px'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '10px'
                                }}>
                                    <div>
                                        <div style={{
                                            fontWeight: '600',
                                            marginBottom: '5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <span style={{
                                                color: isSent ? 'var(--danger)' : 'var(--success)',
                                                fontSize: '0.7rem',
                                                padding: '3px 8px',
                                                background: isSent ? 'var(--bg-danger)' : 'var(--bg-success)',
                                                border: '1px solid var(--border-medium)',
                                                borderRadius: '4px'
                                            }}>
                                                {isSent ? '→ SENT' : '← RECEIVED'}
                                            </span>
                                            <span className="mono" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>${payment.amount}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {isSent ? (
                                                <>To: @{payment.recipient_username}</>
                                            ) : (
                                                <>From: @{payment.sender_username}</>
                                            )}
                                        </div>
                                        <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                                            {new Date(payment.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1.2rem' }}>
                                        {payment.status === 'completed' && <span style={{ color: 'var(--success)' }}>✓</span>}
                                        {payment.status === 'pending' && <span style={{ color: 'var(--warning)' }}>⏳</span>}
                                        {payment.status === 'failed' && <span style={{ color: 'var(--danger)' }}>✗</span>}
                                    </div>
                                </div>

                                {(payment.tx_signature || payment.tweet_url) && (
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '15px' }}>
                                        {payment.tx_signature && (
                                            <a
                                                href={`https://solscan.io/tx/${payment.tx_signature}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ fontSize: '0.65rem', color: 'var(--glow)', textDecoration: 'none' }}
                                            >
                                                View TX →
                                            </a>
                                        )}
                                        {payment.tweet_url && (
                                            <a
                                                href={payment.tweet_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textDecoration: 'none' }}
                                            >
                                                View Tweet →
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
