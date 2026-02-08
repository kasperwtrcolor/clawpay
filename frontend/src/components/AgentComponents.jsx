import { useState, useEffect } from 'react';
import '../index.css';

export function AgentLogFeed({ logs = [] }) {
    const displayLogs = logs.length > 0 ? logs : [
        { id: 'initial', time: '...', type: 'SYST', msg: 'Synchronizing with CLAW_BRAIN...' }
    ];

    return (
        <div className="slab" style={{ marginBottom: '30px' }}>
            <div className="label-subtle" style={{ background: 'var(--industrial-yellow)', color: '#000' }}>// AGENT_LIVE_LOGS</div>
            <div style={{ marginTop: '20px', background: '#000', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                <div className="scan-line"></div>
                <div style={{ maxHeight: '150px', overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {displayLogs.map(log => (
                        <div key={log.id} className="mono" style={{ fontSize: '0.6rem', display: 'flex', gap: '10px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>
                            <span style={{
                                color: log.type === 'ACTION' ? 'var(--success)' :
                                    log.type === 'INTENT' ? 'var(--industrial-cyan)' :
                                        log.type === 'SOCIAL' ? 'var(--industrial-yellow)' : 'var(--text-muted)',
                                fontWeight: 700
                            }}>{log.type}:</span>
                            <span style={{ color: 'var(--text-primary)' }}>{log.msg}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="tx-spinner" style={{ width: '12px', height: '12px' }}></div>
                <span className="mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>THINKING...</span>
            </div>
        </div>
    );
}

export function AgentTreasuryCard({ treasuryBalance = 5000 }) {
    return (
        <div className="slab industrial-border" style={{ marginBottom: '30px', borderStyle: 'double', borderColor: 'var(--industrial-cyan)' }}>
            <div className="label-subtle">// AGENT_TREASURY_RESERVE</div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div className="mono" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                        ${treasuryBalance.toLocaleString()}
                        <span style={{ fontSize: '1rem', marginLeft: '8px', color: 'var(--text-muted)' }}>USDC</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginBottom: '4px' }}>DISTRIBUTION_VELOCITY</div>
                    <div className="mono" style={{ fontWeight: 700, color: 'var(--industrial-cyan)' }}>0.42/MIN</div>
                </div>
            </div>
            <div className="mono" style={{
                fontSize: '0.6rem',
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(0, 242, 255, 0.05)',
                border: '1px dashed var(--industrial-cyan)',
                color: 'var(--industrial-cyan)'
            }}>
                THE_CLAW HAS FULL AUTONOMY OVER THESE FUNDS.
            </div>
        </div>
    );
}
