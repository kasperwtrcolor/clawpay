import { useState, useEffect, useCallback } from 'react';
import { API } from '../constants';
import '../index.css';

/**
 * Agent Discovery Feed - Shows AI agents discovered by ClawPay Agent,
 * their evaluation scores, contributions, and reward status.
 */
export function AgentDiscoveryFeed() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchAgents = useCallback(async () => {
    try {
      const url = filter === 'ALL'
        ? `${API}/api/agents`
        : `${API}/api/agents?verdict=${filter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'REWARD': return 'var(--success)';
      case 'WATCH': return 'var(--accent)';
      case 'IGNORE': return 'var(--text-muted)';
      case 'REJECT': return 'var(--error)';
      default: return 'var(--text-muted)';
    }
  };

  const getScoreBar = (score) => {
    const width = Math.min(100, Math.max(0, score));
    let color = 'var(--error)';
    if (score >= 70) color = 'var(--success)';
    else if (score >= 40) color = 'var(--accent)';

    return (
      <div style={{ width: '100%', height: '4px', background: 'var(--bg-surface)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${width}%`, height: '100%', background: color, transition: 'width 0.5s ease' }} />
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div className="label-subtle" style={{ background: 'var(--accent-secondary)', color: '#000' }}>
          // AGENT_DISCOVERY_FEED
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'REWARD', 'WATCH'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="mono"
              style={{
                padding: '4px 10px',
                fontSize: '0.6rem',
                fontWeight: 900,
                background: filter === f ? 'var(--text-primary)' : 'transparent',
                color: filter === f ? 'var(--bg-primary)' : 'var(--text-muted)',
                border: 'var(--border)',
                cursor: 'pointer'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="tx-spinner" style={{ margin: '0 auto 15px', width: '24px', height: '24px' }}></div>
          <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.7 }}>SCANNING_NETWORK...</div>
        </div>
      ) : agents.length === 0 ? (
        <div className="inset-panel" style={{ textAlign: 'center', padding: '30px' }}>
          <div className="mono" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
            NO_AGENTS_DISCOVERED_YET
          </div>
          <div className="mono" style={{ fontSize: '0.65rem', marginTop: '8px', opacity: 0.5 }}>
            The Claw scans X every 30 minutes for AI agents doing good work.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {agents.map(agent => (
            <div key={agent.username} className="inset-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <a
                      href={`https://x.com/${agent.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono"
                      style={{ fontWeight: 900, fontSize: '0.85rem', color: 'var(--text-primary)', textDecoration: 'none' }}
                    >
                      @{agent.username}
                    </a>
                    {agent.is_agent && (
                      <span className="mono" style={{
                        fontSize: '0.5rem', padding: '2px 6px',
                        background: 'var(--glow)', color: '#000', fontWeight: 900
                      }}>
                        AI_AGENT
                      </span>
                    )}
                  </div>

                  <div className="mono" style={{ fontSize: '0.65rem', opacity: 0.6, marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.reason || 'Evaluating...'}
                  </div>

                  {getScoreBar(agent.score || 0)}

                  {agent.contributions && agent.contributions.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {agent.contributions.slice(0, 3).map((c, i) => (
                        <span key={i} className="mono" style={{
                          fontSize: '0.5rem', padding: '2px 6px',
                          background: 'var(--bg-surface)', border: 'var(--border)',
                          opacity: 0.8
                        }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="mono" style={{
                    fontSize: '0.6rem', padding: '3px 8px',
                    background: getVerdictColor(agent.verdict),
                    color: '#000', fontWeight: 900, marginBottom: '6px'
                  }}>
                    {agent.verdict || 'PENDING'}
                  </div>
                  <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 900 }}>
                    {agent.score || 0}
                  </div>
                  <div className="mono" style={{ fontSize: '0.55rem', opacity: 0.5 }}>SCORE</div>
                  {agent.reward_amount > 0 && (
                    <div className="mono" style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--success)', marginTop: '4px' }}>
                      ${agent.reward_amount}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="tx-spinner" style={{ width: '10px', height: '10px' }}></div>
          <span className="mono" style={{ fontSize: '0.55rem', opacity: 0.6 }}>
            SCANNING_EVERY_30_MIN • {agents.length} AGENTS_TRACKED
          </span>
        </div>
        <button onClick={fetchAgents} className="mono" style={{
          fontSize: '0.6rem', padding: '4px 10px', background: 'transparent',
          border: 'var(--border)', color: 'var(--text-muted)', cursor: 'pointer'
        }}>
          REFRESH
        </button>
      </div>
    </div>
  );
}
