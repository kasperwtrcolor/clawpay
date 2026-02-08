import '../index.css';

const SKILLS = [
    {
        id: 'agent_scout',
        name: 'AGENT_SCOUT',
        desc: 'Discovers AI agents on X, evaluates their contributions, and rewards good work.',
        icon: '🔎',
        status: 'ACTIVE'
    },
    {
        id: 'social_pulse',
        name: 'SOCIAL_PULSE',
        desc: 'Scans X for high-sentiment interactions and triggers rewards.',
        icon: '📡',
        status: 'ACTIVE'
    },
    {
        id: 'bounty_board',
        name: 'BOUNTY_BOARD',
        desc: 'Post and fulfill bounties. THE_CLAW evaluates and releases USDC rewards.',
        icon: '📋',
        status: 'ACTIVE'
    },
    {
        id: 'gas_fund',
        name: 'GAS_FUND',
        desc: 'Auto-sends SOL to agent wallets for vault authorization.',
        icon: '⛽',
        status: 'ACTIVE'
    }
];

export function ClawSkills() {
    return (
        <div className="slab" style={{ marginBottom: '30px' }}>
            <div className="label-subtle">// ACTIVE_CLAW_SKILLS</div>
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.1)' }}>
                {SKILLS.map(skill => (
                    <div key={skill.id} style={{
                        background: '#000',
                        padding: '20px',
                        opacity: skill.status === 'ACTIVE' ? 1 : 0.5
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <span style={{ fontSize: '1.5rem' }}>{skill.icon}</span>
                            <div className="mono" style={{
                                fontSize: '0.5rem',
                                background: skill.status === 'ACTIVE' ? 'rgba(0, 242, 255, 0.1)' : 'rgba(255,255,255,0.1)',
                                color: skill.status === 'ACTIVE' ? 'var(--industrial-cyan)' : 'var(--text-muted)',
                                padding: '2px 8px',
                                fontWeight: 700
                            }}>
                                {skill.status}
                            </div>
                        </div>
                        <div className="mono" style={{ fontWeight: 700, fontSize: '0.7rem', marginBottom: '8px' }}>{skill.name}</div>
                        <p className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            {skill.desc}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
