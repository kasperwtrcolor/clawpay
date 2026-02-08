import { useState, useEffect, useCallback } from 'react';
import { API } from '../constants';
import '../index.css';

export function BountyBoard({ xUsername, isAdmin }) {
    const [bounties, setBounties] = useState([]);
    const [filter, setFilter] = useState('open');
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newBounty, setNewBounty] = useState({ title: '', description: '', reward: '', tags: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchBounties = useCallback(async () => {
        try {
            const response = await fetch(`${API}/api/bounties?status=${filter}`);
            if (response.ok) {
                const data = await response.json();
                setBounties(data.bounties || []);
            }
        } catch (err) {
            console.error('Failed to fetch bounties:', err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchBounties();
        const interval = setInterval(fetchBounties, 60000);
        return () => clearInterval(interval);
    }, [fetchBounties]);

    const handleCreate = async () => {
        if (!newBounty.title || !newBounty.reward) return;
        setSubmitting(true);
        try {
            const response = await fetch(`${API}/api/bounties`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newBounty.title,
                    description: newBounty.description,
                    reward: parseFloat(newBounty.reward),
                    tags: newBounty.tags.split(',').map(t => t.trim()).filter(Boolean),
                    creator: xUsername
                })
            });
            if (response.ok) {
                setNewBounty({ title: '', description: '', reward: '', tags: '' });
                setShowCreate(false);
                fetchBounties();
            }
        } catch (err) {
            console.error('Failed to create bounty:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitWork = async (bountyId) => {
        const proof = prompt('Enter proof of work (URL or description):');
        if (!proof) return;

        try {
            const response = await fetch(`${API}/api/bounties/${bountyId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: xUsername, proof })
            });
            if (response.ok) {
                fetchBounties();
            }
        } catch (err) {
            console.error('Failed to submit work:', err);
        }
    };

    const statusColors = {
        open: 'var(--success)',
        in_progress: 'var(--accent)',
        evaluating: 'var(--accent-secondary)',
        completed: 'var(--text-muted)',
        cancelled: 'var(--error)'
    };

    return (
        <div className="glass-panel" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div className="label-subtle" style={{ background: 'var(--accent)', color: '#000' }}>// BOUNTY_BOARD</div>
                {(isAdmin || true) && (
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="btn"
                        style={{ padding: '6px 14px', fontSize: '0.65rem' }}
                    >
                        {showCreate ? 'CANCEL' : 'POST_BOUNTY'}
                    </button>
                )}
            </div>

            {/* Create Bounty Form */}
            {showCreate && (
                <div className="inset-panel" style={{ marginBottom: '20px' }}>
                    <div className="mono" style={{ fontWeight: 900, fontSize: '0.75rem', marginBottom: '15px' }}>NEW_BOUNTY</div>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Bounty title..."
                            value={newBounty.title}
                            onChange={e => setNewBounty(p => ({ ...p, title: e.target.value }))}
                            style={{
                                padding: '10px', border: 'var(--border)', background: 'var(--bg-primary)',
                                color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem'
                            }}
                        />
                        <textarea
                            placeholder="Describe what needs to be done..."
                            value={newBounty.description}
                            onChange={e => setNewBounty(p => ({ ...p, description: e.target.value }))}
                            rows={3}
                            style={{
                                padding: '10px', border: 'var(--border)', background: 'var(--bg-primary)',
                                color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
                                resize: 'vertical'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="number"
                                placeholder="Reward (USDC)"
                                value={newBounty.reward}
                                onChange={e => setNewBounty(p => ({ ...p, reward: e.target.value }))}
                                style={{
                                    padding: '10px', border: 'var(--border)', background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
                                    flex: 1
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Tags (comma separated)"
                                value={newBounty.tags}
                                onChange={e => setNewBounty(p => ({ ...p, tags: e.target.value }))}
                                style={{
                                    padding: '10px', border: 'var(--border)', background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
                                    flex: 2
                                }}
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={submitting || !newBounty.title || !newBounty.reward}
                            className="btn btn-accent"
                            style={{ padding: '10px', fontSize: '0.7rem' }}
                        >
                            {submitting ? 'POSTING...' : 'POST_BOUNTY'}
                        </button>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {['open', 'in_progress', 'evaluating', 'completed'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className="mono"
                        style={{
                            padding: '4px 10px', fontSize: '0.6rem', fontWeight: 900,
                            border: 'var(--border)', cursor: 'pointer',
                            background: filter === status ? 'var(--accent)' : 'transparent',
                            color: filter === status ? '#000' : 'var(--text-primary)'
                        }}
                    >
                        {status.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Bounties List */}
            {loading ? (
                <div className="mono" style={{ textAlign: 'center', opacity: 0.5, padding: '30px', fontSize: '0.7rem' }}>
                    LOADING_BOUNTIES...
                </div>
            ) : bounties.length === 0 ? (
                <div className="mono" style={{ textAlign: 'center', opacity: 0.5, padding: '30px', fontSize: '0.7rem' }}>
                    NO_BOUNTIES_FOUND
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {bounties.map(bounty => (
                        <div key={bounty.id} className="inset-panel" style={{ borderColor: statusColors[bounty.status] || 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <div>
                                    <div className="mono" style={{ fontWeight: 900, fontSize: '0.8rem' }}>{bounty.title}</div>
                                    <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '2px' }}>
                                        by @{bounty.creator} | {bounty.submissions?.length || 0} submissions
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div className="mono" style={{
                                        fontSize: '0.6rem', fontWeight: 900,
                                        background: statusColors[bounty.status] || 'var(--text-muted)',
                                        color: '#000', padding: '2px 6px'
                                    }}>
                                        {bounty.status?.toUpperCase()}
                                    </div>
                                    <div className="mono" style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--success)' }}>
                                        ${bounty.reward}
                                    </div>
                                </div>
                            </div>

                            {bounty.description && (
                                <p className="mono" style={{ fontSize: '0.65rem', opacity: 0.7, lineHeight: 1.5, marginBottom: '10px' }}>
                                    {bounty.description}
                                </p>
                            )}

                            {bounty.tags?.length > 0 && (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                    {bounty.tags.map((tag, i) => (
                                        <span key={i} className="mono" style={{
                                            fontSize: '0.55rem', padding: '2px 6px',
                                            background: 'var(--bg-primary)', border: 'var(--border-subtle)'
                                        }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {bounty.status === 'open' && xUsername && (
                                <button
                                    onClick={() => handleSubmitWork(bounty.id)}
                                    className="btn btn-accent"
                                    style={{ padding: '6px 14px', fontSize: '0.6rem', marginTop: '5px' }}
                                >
                                    SUBMIT_WORK
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
