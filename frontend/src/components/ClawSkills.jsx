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
        id: 'agent_evaluator',
        name: 'AGENT_EVALUATOR',
        desc: 'AI-powered scoring engine that defines what "good work" means for the agent swarm.',
        icon: '🧠',
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
        id: 'gas_fund',
        name: 'GAS_FUND',
        desc: 'Auto-sends SOL to agent wallets for vault authorization.',
        icon: '⛽',
        status: 'ACTIVE'
    },
    {
        id: 'intent_parser',
        name: 'INTENT_PARSER',
        desc: 'NLP layer for parsing complex social settlement commands.',
        icon: '🗣️',
        status: 'ACTIVE'
    },
    {
        id: 'liquidity_claw',
        name: 'LIQUIDITY_CLAW',
        desc: 'Autonomously manages treasury distribution based on volume spikes.',
        icon: '🦀',
        status: 'STANDBY'
    }
];

export function ClawSkills() {
    return (
        <div className="glass-panel" style={{ marginBottom: '30px' }}>
            <div className="label-subtle" style={{ background: 'var(--accent-secondary)', color: '#000' }}>// ACTIVE_CLAW_SKILLS</div>
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {SKILLS.map(skill => (
                    <div key={skill.id} className="inset-panel" style={{
                        opacity: skill.status === 'ACTIVE' ? 1 : 0.5,
                        borderColor: skill.status === 'ACTIVE' ? 'var(--accent-secondary)' : 'var(--text-muted)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '1.5rem' }}>{skill.icon}</span>
                            <div className="mono" style={{
                                fontSize: '0.6rem',
                                background: skill.status === 'ACTIVE' ? 'var(--success)' : 'var(--text-muted)',
                                color: '#000',
                                padding: '2px 6px',
                                fontWeight: 900
                            }}>
                                {skill.status}
                            </div>
                        </div>
                        <div className="mono" style={{ fontWeight: 900, fontSize: '0.8rem', marginBottom: '5px' }}>{skill.name}</div>
                        <p className="mono" style={{ fontSize: '0.65rem', opacity: 0.7, lineHeight: 1.4 }}>
                            {skill.desc}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
