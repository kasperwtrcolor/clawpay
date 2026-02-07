import '../index.css';

export function PendingOutgoing({ payments, isDelegated, walletBalance }) {
    if (!payments || payments.length === 0) return null;

    const totalPending = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const hasSufficientFunds = isDelegated && walletBalance >= totalPending;

    return (
        <div className="plate" style={{
            padding: '30px',
            marginBottom: '20px',
            position: 'relative'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px'
            }}>
                <span style={{ fontSize: '1.5rem' }}>📤</span>
                <span className="engraved" style={{ color: hasSufficientFunds ? 'var(--success)' : 'var(--warning)', fontSize: '0.8rem' }}>
                    PENDING OUTGOING ({payments.length})
                </span>
            </div>

            {/* Status Banner */}
            {!hasSufficientFunds && (
                <div style={{
                    background: 'var(--bg-warning)',
                    border: 'var(--border-warning)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '15px',
                    fontSize: '0.8rem',
                    color: 'var(--text-on-status)'
                }}>
                    <span style={{ fontWeight: '700' }}>⚠</span> {!isDelegated
                        ? 'Authorize your wallet to process these payments'
                        : `Need $${totalPending.toFixed(2)} USDC to cover pending payments (Balance: $${walletBalance.toFixed(2)})`
                    }
                </div>
            )}

            {hasSufficientFunds && (
                <div style={{
                    background: 'var(--bg-success)',
                    border: 'var(--border-success)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '15px',
                    fontSize: '0.8rem',
                    color: 'var(--text-on-status)'
                }}>
                    <span style={{ fontWeight: '700' }}>✓</span> Wallet funded & authorized. Recipients can claim these payments.
                </div>
            )}

            {/* Payments List */}
            {payments.slice(0, 5).map((payment) => (
                <div key={payment.tweet_id} style={{
                    background: 'var(--bg-inset)',
                    border: 'var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '15px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'var(--text-primary)'
                }}>
                    <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            To: @{payment.recipient_username}
                        </div>
                        <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {new Date(payment.created_at).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="mono" style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                        ${payment.amount}
                    </div>
                </div>
            ))}

            {payments.length > 5 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '10px' }}>
                    +{payments.length - 5} more payments
                </div>
            )}

            <div style={{
                marginTop: '15px',
                padding: '15px',
                background: 'var(--bg-inset)',
                border: 'var(--border-subtle)',
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                <div className="engraved" style={{ fontSize: '0.6rem', marginBottom: '5px' }}>TOTAL PENDING</div>
                <div className="mono" style={{ fontSize: '1.5rem', fontWeight: '700' }}>${totalPending.toFixed(2)}</div>
            </div>
        </div>
    );
}
