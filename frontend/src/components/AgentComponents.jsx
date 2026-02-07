import { useState, useEffect } from 'react';
import '../index.css';

export function AgentLogFeed() {
    const [logs, setLogs] = useState([
        { id: 1, time: '14:20:01', type: 'SCAN', msg: 'Analyzing @SolanaConf swarm engagement...' },
        { id: 2, time: '14:20:15', type: 'INTENT', msg: 'Detected high-vibe interaction from @cryptouser.' },
        { id: 3, time: '14:20:30', type: 'ACTION', msg: 'Attributing $5 reward to @cryptouser via SOCIAL_PULSE.' },
        { id: 4, time: '14:21:05', type: 'SYST', msg: 'Entropy levels nominal. Evolving sentiment weights.' },
    ]);

    // Simple simulation of live logs
    useEffect(() => {
        const interval = setInterval(() => {
            const types = ['SCAN', 'INTENT', 'ACTION', 'SYST'];
            const type = types[Math.floor(Math.random() * types.length)];
            const newLog = {
                id: Date.now(),
                time: new Date().toLocaleTimeString([], { hour12: false }),
                type,
                msg: `Autonomous process ${Math.random().toString(36).substring(7)} executed successfully.`
            };
            setLogs(prev => [newLog, ...prev.slice(0, 4)]);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-panel" style={{ marginBottom: '30px' }}>
            <div className="label-subtle" style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>// AGENT_LIVE_LOGS</div>
            <div className="inset-panel" style={{ marginTop: '20px', background: '#000', color: 'var(--accent-secondary)', padding: '15px' }}>
                <div style={{ maxHeight: '150px', overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {logs.map(log => (
                        <div key={log.id} className="mono" style={{ fontSize: '0.7rem', display: 'flex', gap: '10px' }}>
                            <span style={{ opacity: 0.5 }}>[{log.time}]</span>
                            <span style={{
                                color: log.type === 'ACTION' ? 'var(--success)' :
                                    log.type === 'INTENT' ? 'var(--accent)' : 'inherit',
                                fontWeight: 900
                            }}>{log.type}:</span>
                            <span style={{ color: '#fff' }}>{log.msg}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="tx-spinner" style={{ width: '12px', height: '12px' }}></div>
                <span className="mono" style={{ fontSize: '0.6rem', opacity: 0.7 }}>THINKING...</span>
            </div>
        </div>
    );
}

export function AgentTreasuryCard({ treasuryBalance = 5000 }) {
    return (
        <div className="glass-panel" style={{ marginBottom: '30px', background: 'var(--bg-secondary)', borderStyle: 'double' }}>
            <div className="label-subtle" style={{ background: 'var(--accent)', color: '#000' }}>// AGENT_TREASURY_RESERVE</div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div className="mono" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
                        ${treasuryBalance.toLocaleString()}
                        <span style={{ fontSize: '1rem', marginLeft: '5px' }}>USDC</span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="mono label-subtle" style={{ fontSize: '0.55rem' }}>DISTRIBUTION_VELOCITY</div>
                    <div className="mono" style={{ fontWeight: 800 }}>0.42/MIN</div>
                </div>
            </div>
            <div className="mono" style={{ fontSize: '0.65rem', marginTop: '15px', padding: '10px', background: 'rgba(255, 69, 0, 0.1)', border: '1px dashed var(--accent)', color: 'var(--accent)' }}>
                THE_CLAW HAS FULL AUTONOMY OVER THESE FUNDS.
            </div>
        </div>
    );
}
