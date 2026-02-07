import '../index.css';

export function WalletCard({
    solanaWallet,
    walletBalance,
    solBalance,
    isDelegated,
    delegationAmount,
    setDelegationAmount,
    isAuthorizing,
    onAuthorize,
    onFundWallet,
    onExportWallet,
}) {
    const needsGas = solBalance < 0.005;

    if (!solanaWallet) {
        return (
            <div className="glass-panel" style={{ marginBottom: '30px' }}>
                <div className="label-subtle">// VAULT_STATUS</div>
                <div className="inset-panel" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="tx-spinner" style={{ margin: '0 auto 15px' }}></div>
                    <div className="mono" style={{ fontWeight: 800 }}>INITIALIZING_SECURE_VAULT...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ marginBottom: '30px' }}>
            <div className="label-subtle">// VAULT_STATUS</div>

            <div className="inset-panel" style={{ marginBottom: '25px', background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                <div className="label-subtle" style={{ background: 'var(--accent)', color: '#000', fontSize: '0.6rem' }}>CONNECTED_BALANCE</div>
                <div className="mono" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
                    ${walletBalance.toFixed(2)}
                    <span style={{ fontSize: '1rem', marginLeft: '10px', opacity: 0.7 }}>USDC</span>
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }} className="mono">
                    <span>{walletBalance.toFixed(4)} NATIVE</span>
                    <span style={{ color: needsGas ? 'var(--error)' : 'inherit' }}>GAS: {solBalance.toFixed(4)} SOL</span>
                </div>
            </div>

            {needsGas && (
                <div className="inset-panel" style={{ background: 'rgba(255, 42, 109, 0.1)', border: '2px solid var(--error)', marginBottom: '25px' }}>
                    <div className="mono" style={{ fontWeight: 800, color: 'var(--error)' }}>⚠ LOW_GAS_WARNING</div>
                    <p className="mono" style={{ fontSize: '0.75rem', marginTop: '5px' }}>You need ~0.005 SOL to execute settlements.</p>
                </div>
            )}

            <div style={{ marginBottom: '25px' }}>
                <div className="label-subtle">VAULT_ADDRESS</div>
                <div className="inset-panel" style={{ padding: '12px', fontSize: '0.7rem' }}>
                    <span className="mono" style={{ wordBreak: 'break-all' }}>{solanaWallet.address}</span>
                </div>
            </div>

            <div className="inset-panel" style={{ marginBottom: '25px', background: isDelegated ? 'rgba(0, 255, 136, 0.05)' : 'transparent' }}>
                <div className="label-subtle" style={{ background: isDelegated ? 'var(--success)' : 'var(--accent)', color: '#000' }}>
                    {isDelegated ? '✓ DELEGATION_ACTIVE' : '⚠ AUTHORIZATION_PENDING'}
                </div>

                <div style={{ marginTop: '15px' }}>
                    <label className="mono" style={{ display: 'block', fontSize: '0.7rem', marginBottom: '8px', fontWeight: 800 }}>SPENDING_LIMIT (USDC)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="number"
                            value={delegationAmount}
                            onChange={(e) => setDelegationAmount(parseFloat(e.target.value) || 0)}
                            className="mono"
                            style={{
                                flex: 1,
                                padding: '12px',
                                border: 'var(--border)',
                                background: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontWeight: 800
                            }}
                        />
                        <button
                            onClick={() => onAuthorize(delegationAmount)}
                            disabled={isAuthorizing}
                            className="btn btn-primary"
                            style={{ padding: '0 20px', boxShadow: '2px 2px 0px #000' }}
                        >
                            {isAuthorizing ? '...' : 'SAVE'}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <button onClick={onFundWallet} className="btn btn-accent" style={{ fontWeight: 800 }}>FUND_VAULT</button>
                <a
                    href={`https://solscan.io/account/${solanaWallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{ fontWeight: 800, textDecoration: 'none', justifyContent: 'center' }}
                >
                    VIEW_SOLSCAN
                </a>
            </div>

            {onExportWallet && (
                <button onClick={onExportWallet} className="btn" style={{ width: '100%', marginTop: '15px', fontSize: '0.75rem' }}>MANAGE_KEYS</button>
            )}
        </div>
    );
}
