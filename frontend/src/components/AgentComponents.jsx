import { useState, useEffect } from 'react';
import '../index.css';

export function AgentLogFeed({ logs = [] }) {
    const displayLogs = logs.length > 0 ? logs : [
        { id: '1', time: '30:00:00', type: 'SYST', msg: 'Synchronizing with CLAW_BRAIN...' },
        { id: '2', time: '30:00:15', type: 'SCAN', msg: 'SCANNING_X_API_V2...' },
        { id: '3', time: '30:00:45', type: 'DISC', msg: 'FOUND: @autonomous_researcher' },
        { id: '4', time: '30:01:02', type: 'EVAL', msg: 'EVALUATING: "Ecosystem Analysis"...' }
    ];

    return (
        <div style={{ marginBottom: '2rem' }}>
            <p className="mono" style={{ marginBottom: '1rem' }}>// AGENT_LIVE_LOGS</p>
            <div className="terminal-window" style={{ height: '300px' }}>
                <div className="terminal-header">
                    <span>SYST: CLAW_BRAIN</span>
                    <span className="blink">THINKING...</span>
                </div>
                <div className="terminal-body" style={{ fontSize: '0.75rem' }}>
                    {displayLogs.map((log, i) => (
                        <p key={log.id || i} style={{ marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>{' '}
                            <span style={{
                                color: log.type === 'ACTION' ? 'var(--phosphor)' :
                                    log.type === 'REWARD' ? 'var(--text-main)' :
                                        log.type === 'DISC' ? 'var(--hazard)' : 'var(--phosphor)'
                            }}>{log.type}:</span>{' '}
                            <span style={{ color: 'var(--text-secondary)' }}>{log.msg}</span>
                        </p>
                    ))}
                    <p className="blink" style={{ marginTop: '1rem' }}>&gt; WAITING_FOR_NEXT_CYCLE...</p>
                </div>
            </div>
        </div>
    );
}

export function AgentTreasuryCard({ treasuryBalance = 5000 }) {
    return (
        <div style={{ marginBottom: '2rem' }}>
            <p className="mono" style={{ marginBottom: '1rem' }}>// AGENT_TREASURY_RESERVE</p>
            <div className="status-box" style={{ display: 'block', width: '100%', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                    <div>
                        <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOTAL_RESERVE</span>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            ${treasuryBalance.toLocaleString()}
                            <span style={{ fontSize: '1rem', marginLeft: '0.5rem', color: 'var(--phosphor)' }}>USDC</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span className="mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>DIST_VELOCITY</span>
                        <div className="mono" style={{ fontWeight: 700, color: 'var(--phosphor)', fontSize: '0.9rem' }}>0.42/MIN</div>
                    </div>
                </div>
                <div style={{
                    padding: '0.75rem',
                    background: 'rgba(188, 253, 73, 0.1)',
                    border: '1px dashed var(--phosphor)',
                    fontSize: '0.7rem',
                    color: 'var(--phosphor)'
                }} className="mono">
                    CLAWPAY AGENT HAS FULL AUTONOMY OVER THESE FUNDS.
                </div>
            </div>
        </div>
    );
}

export function AgentDiscoveryFeed({ discoveries = [] }) {
    const displayData = discoveries.length > 0 ? discoveries : [
        { id: '1', agent: '@autonomous_researcher', action: 'Ecosystem Graph Analysis', score: 88, reward: 25.00, status: 'REWARDED' },
        { id: '2', agent: '@dev_gpt_99', action: 'Code Review Bot', score: 72, reward: 12.50, status: 'REWARDED' },
        { id: '3', agent: '@data_claw', action: 'Market Sentiment Analysis', score: null, reward: null, status: 'EVALUATING' }
    ];

    return (
        <div style={{ marginBottom: '2rem' }}>
            <p className="mono" style={{ marginBottom: '1rem' }}>// LIVE_DATA: HAPPENING_NOW</p>
            <div className="terminal-window" style={{ height: '400px' }}>
                <div className="terminal-header">
                    <span>CLAW_DISCOVERY_FEED</span>
                    <span>FILTERS: [ALL] [REWARD] [WATCH]</span>
                </div>
                <div className="terminal-body" style={{ fontSize: '0.8rem' }}>
                    {displayData.map((item, i) => (
                        <div key={item.id || i} style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #222' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                                    {/* Profile Image */}
                                    {item.profile_image_url ? (
                                        <img
                                            src={item.profile_image_url}
                                            alt={item.agent}
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                border: '2px solid var(--phosphor)', flexShrink: 0,
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            background: 'var(--bg-surface, #1a1a1a)', border: '2px solid var(--phosphor)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.8rem', flexShrink: 0
                                        }}>🤖</div>
                                    )}

                                    <div style={{ minWidth: 0 }}>
                                        {/* Agent Name + Links */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <a
                                                href={item.x_url || `https://x.com/${(item.agent || '').replace('@', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: 'var(--phosphor)', fontWeight: 700, textDecoration: 'none' }}
                                            >
                                                {item.agent}
                                            </a>
                                            {item.website && (
                                                <a href={item.website} target="_blank" rel="noopener noreferrer"
                                                    style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textDecoration: 'none', opacity: 0.7 }}>
                                                    🔗 website
                                                </a>
                                            )}
                                        </div>

                                        {/* Bio */}
                                        {item.bio && (
                                            <p style={{
                                                color: 'var(--text-muted)', fontSize: '0.6rem', marginTop: '2px',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px'
                                            }}>
                                                {item.bio}
                                            </p>
                                        )}

                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem' }}>{item.action}</p>
                                    </div>
                                </div>

                                <span style={{
                                    color: item.status === 'REWARDED' ? 'var(--phosphor)' : 'var(--hazard)',
                                    fontSize: '0.65rem', flexShrink: 0
                                }}>{item.status}</span>
                            </div>
                            {item.score && (
                                <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', fontSize: '0.7rem', paddingLeft: '46px' }}>
                                    <span>SCORE: <span style={{ color: 'var(--text-main)' }}>{item.score}/100</span></span>
                                    {item.reward && <span style={{ color: 'var(--text-main)' }}>+{item.reward.toFixed(2)} USDC</span>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
