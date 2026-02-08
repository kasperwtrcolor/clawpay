import { useState, useEffect } from 'react';
import { API } from '../constants';
import '../index.css';

export function ReputationBadge({ username }) {
    const [reputation, setReputation] = useState(null);

    useEffect(() => {
        if (!username) return;

        const fetchReputation = async () => {
            try {
                const response = await fetch(`${API}/api/reputation/${username}`);
                if (response.ok) {
                    const data = await response.json();
                    setReputation(data.reputation);
                }
            } catch (err) {
                console.error('Failed to fetch reputation:', err);
            }
        };

        fetchReputation();
    }, [username]);

    if (!reputation) return null;

    const tierColors = {
        NEWCOMER: 'var(--text-muted)',
        CONTRIBUTOR: 'var(--accent-secondary)',
        TRUSTED: 'var(--accent)',
        ELITE: 'var(--success)',
        LEGENDARY: '#FFD700'
    };

    return (
        <div className="inset-panel" style={{ marginBottom: '15px' }}>
            <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '8px' }}>AGENT_REPUTATION</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div className="mono" style={{ fontWeight: 900, fontSize: '0.8rem' }}>@{username}</div>
                    <div className="mono" style={{
                        fontSize: '0.65rem', fontWeight: 900,
                        color: tierColors[reputation.trust_tier] || 'var(--text-muted)'
                    }}>
                        {reputation.trust_tier}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontWeight: 900, fontSize: '1.2rem' }}>
                        {reputation.cumulative_score}
                    </div>
                    <div className="mono" style={{ fontSize: '0.55rem', opacity: 0.7 }}>REPUTATION_SCORE</div>
                </div>
            </div>

            {/* Score Bar */}
            <div style={{
                marginTop: '10px', height: '6px', background: 'var(--bg-primary)',
                border: 'var(--border-subtle)', position: 'relative'
            }}>
                <div style={{
                    height: '100%', width: `${Math.min(reputation.cumulative_score / 10, 100)}%`,
                    background: tierColors[reputation.trust_tier] || 'var(--text-muted)',
                    transition: 'width 0.3s ease'
                }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <div className="mono" style={{ fontSize: '0.55rem', opacity: 0.7 }}>
                    {reputation.times_evaluated || 0} evaluations
                </div>
                <div className="mono" style={{ fontSize: '0.55rem', opacity: 0.7 }}>
                    ${reputation.total_earned?.toFixed(2) || '0.00'} earned
                </div>
                <div className="mono" style={{ fontSize: '0.55rem', opacity: 0.7 }}>
                    {reputation.bounties_completed || 0} bounties
                </div>
            </div>
        </div>
    );
}

export function ReputationLeaderboard() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const response = await fetch(`${API}/api/reputation/leaderboard`);
                if (response.ok) {
                    const data = await response.json();
                    setAgents(data.agents || []);
                }
            } catch (err) {
                console.error('Failed to fetch reputation leaderboard:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAgents();
        const interval = setInterval(fetchAgents, 60000);
        return () => clearInterval(interval);
    }, []);

    const tierColors = {
        NEWCOMER: 'var(--text-muted)',
        CONTRIBUTOR: 'var(--accent-secondary)',
        TRUSTED: 'var(--accent)',
        ELITE: 'var(--success)',
        LEGENDARY: '#FFD700'
    };

    if (loading) {
        return (
            <div className="glass-panel" style={{ marginBottom: '30px' }}>
                <div className="label-subtle" style={{ background: 'var(--accent-secondary)', color: '#000' }}>// REPUTATION_BOARD</div>
                <div className="mono" style={{ textAlign: 'center', opacity: 0.5, padding: '30px', fontSize: '0.7rem' }}>
                    LOADING...
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ marginBottom: '30px' }}>
            <div className="label-subtle" style={{ background: 'var(--accent-secondary)', color: '#000' }}>// REPUTATION_BOARD</div>
            <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '10px', marginBottom: '15px' }}>
                Cumulative trust scores for discovered AI agents.
            </div>

            {agents.length === 0 ? (
                <div className="mono" style={{ textAlign: 'center', opacity: 0.5, padding: '20px', fontSize: '0.7rem' }}>
                    NO_AGENTS_RATED_YET
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                    {agents.map((agent, i) => (
                        <div key={agent.username} className="inset-panel" style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 16px',
                            borderColor: tierColors[agent.trust_tier] || 'var(--text-muted)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="mono" style={{
                                    fontWeight: 900, fontSize: '0.7rem', width: '24px',
                                    color: i < 3 ? 'var(--accent)' : 'var(--text-muted)'
                                }}>
                                    #{i + 1}
                                </div>
                                <div>
                                    <div className="mono" style={{ fontWeight: 900, fontSize: '0.75rem' }}>
                                        @{agent.username}
                                    </div>
                                    <div className="mono" style={{
                                        fontSize: '0.55rem', fontWeight: 900,
                                        color: tierColors[agent.trust_tier] || 'var(--text-muted)'
                                    }}>
                                        {agent.trust_tier}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="mono" style={{ fontWeight: 900, fontSize: '0.9rem' }}>
                                    {agent.cumulative_score}
                                </div>
                                <div className="mono" style={{ fontSize: '0.5rem', opacity: 0.5 }}>
                                    ${agent.total_earned?.toFixed(2) || '0.00'} earned
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
