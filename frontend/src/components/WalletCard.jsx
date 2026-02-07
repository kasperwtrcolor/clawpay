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
            <div className="glass-panel" style={{ padding: '30px', marginBottom: '20px' }}>
                <div className="mono label-subtle" style={{ marginBottom: '15px' }}>// WALLET_STATUS</div>
                <div className="inset-panel" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="tx-spinner" style={{ margin: '0 auto 15px' }}></div>
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>INITIALIZING_SECURE_VAULT...</div>
                    <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                        Loading your embedded Solana wallet...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel wallet-card" style={{ padding: '30px', marginBottom: '20px' }}>
            <div className="mono label-subtle" style={{ marginBottom: '20px' }}>// WALLET_STATUS</div>

            {/* Balance Display */}
            <div className="inset-panel" style={{ marginBottom: '25px' }}>
                <div className="mono label-subtle" style={{ marginBottom: '8px', fontSize: '0.6rem' }}>CONNECTED_BALANCE</div>
                <div className="mono" style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    ${walletBalance.toFixed(2)}
                    <span className="text-muted" style={{ fontSize: '1rem', marginLeft: '10px' }}>USDC</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }} className="mono">
                    <span>{walletBalance.toFixed(4)} USDC_NATIVE</span>
                    <span style={{ color: needsGas ? 'var(--error)' : 'var(--text-muted)' }}>GAS: {solBalance.toFixed(4)} SOL</span>
                </div>
            </div>

            {/* SOL Gas Warning */}
            {needsGas && (
                <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--error)', padding: '15px', marginBottom: '20px', borderRadius: '16px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--error)', marginBottom: '4px' }} className="mono">⚠ LOW_FEE_VAULT</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        You need ~0.005 SOL for transaction fees.
                    </div>
                </div>
            )}

            {/* Address */}
            <div style={{ marginBottom: '25px' }}>
                <div className="mono label-subtle" style={{ marginBottom: '8px', fontSize: '0.6rem' }}>WALLET_ID</div>
                <div className="inset-panel" style={{ padding: '12px 15px', fontSize: '0.7rem' }}>
                    <span className="mono text-glow" style={{ wordBreak: 'break-all' }}>{solanaWallet.address}</span>
                </div>
            </div>

            {/* Authorization Section */}
            {isDelegated ? (
                <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--success)', padding: '20px', marginBottom: '20px', borderRadius: '20px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--success)', marginBottom: '8px' }} className="mono">✓ VAULT_AUTHORIZED</div>
                    <div style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
                        Limit: <span className="mono" style={{ fontWeight: '700' }}>${delegationAmount} USDC</span>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)', paddingTop: '15px' }}>
                        <div className="mono label-subtle" style={{ fontSize: '0.6rem', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                            UPDATE_SPENDING_LIMIT
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="number"
                                value={delegationAmount}
                                onChange={(e) => setDelegationAmount(parseFloat(e.target.value) || 0)}
                                className="mono"
                                style={{
                                    flex: 1,
                                    padding: '10px 15px',
                                    background: 'var(--bg-inset)',
                                    border: '1px solid var(--border-medium)',
                                    borderRadius: '12px',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button
                                onClick={() => onAuthorize(delegationAmount)}
                                disabled={isAuthorizing}
                                className="btn btn-primary"
                                style={{ padding: '0', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                title="Update Spending Limit"
                            >
                                {isAuthorizing ? (
                                    <div className="tx-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-panel" style={{ borderStyle: 'dashed', borderColor: 'var(--accent)', padding: '20px', marginBottom: '20px', borderRadius: '20px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '700', marginBottom: '15px' }} className="mono">
                        ⚠ LINK_AUTHORIZATION_REQUIRED
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label className="mono label-subtle" style={{ display: 'block', marginBottom: '8px', fontSize: '0.6rem' }}>
                            LIMIT_AMOUNT (USDC)
                        </label>
                        <input
                            type="number"
                            value={delegationAmount}
                            onChange={(e) => setDelegationAmount(parseFloat(e.target.value) || 0)}
                            className="mono"
                            style={{
                                width: '100%',
                                padding: '12px 15px',
                                background: 'var(--bg-inset)',
                                border: '1px solid var(--border-medium)',
                                borderRadius: '12px',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <button
                        onClick={() => onAuthorize(delegationAmount)}
                        disabled={isAuthorizing || solBalance === 0}
                        className="btn btn-accent"
                        style={{ width: '100%', borderRadius: '12px' }}
                    >
                        {isAuthorizing ? 'AUTHORIZING...' : (solBalance === 0 ? 'GAS REQUIRED' : 'AUTHORIZE VAULT')}
                    </button>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                <button onClick={onFundWallet} className="btn btn-accent" style={{ borderRadius: '12px' }}>
                    FUND
                </button>
                <a
                    href={`https://solscan.io/account/${solanaWallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ borderRadius: '12px', textDecoration: 'none' }}
                >
                    SOLSCAN ↗
                </a>
            </div>

            {onExportWallet && (
                <button onClick={onExportWallet} className="btn" style={{ width: '100%', marginTop: '12px', background: 'transparent', border: '1px solid var(--border-medium)', borderRadius: '12px', fontSize: '0.75rem' }}>
                    MANAGE WALLET
                </button>
            )}
        </div>
    );
}

