import { useState, useEffect } from 'react';
import '../index.css';

export function AdminDashboard({
    users,
    onClose
}) {
    // State
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');

    // Calculate metrics from users data
    const metrics = {
        totalUsers: users?.length || 0,
        totalVolume: users?.reduce((sum, u) => sum + (u.total_sent || 0) + (u.total_claimed || 0), 0) || 0,
        totalClaimed: users?.reduce((sum, u) => sum + (u.total_claimed || 0), 0) || 0,
        activeUsers: users?.filter(u => (u.total_claimed || 0) > 0).length || 0
    };

    // Filter users by search
    const filteredUsers = users?.filter(u =>
        u.x_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.wallet_address?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const tabs = [
        { id: 'overview', label: '📊 Overview' },
        { id: 'users', label: '👥 Users' }
    ];

    return (
        <div className="admin-dashboard animate-fade-in">
            {/* Header */}
            <div className="glass-panel" style={{ padding: '25px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, color: 'var(--accent-gold)' }}>
                        👑 Admin Dashboard
                    </h2>
                    <button onClick={onClose} className="btn" style={{ padding: '8px 16px' }}>
                        ✕ Close
                    </button>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`btn ${activeTab === tab.id ? 'btn-primary' : ''}`}
                            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="glass-panel" style={{ padding: '25px', marginBottom: '20px' }}>
                    <div className="mono label-subtle" style={{ marginBottom: '20px' }}>// APP_METRICS</div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                        <div className="inset-panel" style={{ padding: '15px', textAlign: 'center' }}>
                            <div className="engraved" style={{ fontSize: '0.65rem', marginBottom: '5px' }}>TOTAL USERS</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--glow)' }}>{metrics.totalUsers}</div>
                        </div>
                        <div className="inset-panel" style={{ padding: '15px', textAlign: 'center' }}>
                            <div className="engraved" style={{ fontSize: '0.65rem', marginBottom: '5px' }}>ACTIVE USERS</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--success)' }}>{metrics.activeUsers}</div>
                        </div>
                        <div className="inset-panel" style={{ padding: '15px', textAlign: 'center' }}>
                            <div className="engraved" style={{ fontSize: '0.65rem', marginBottom: '5px' }}>TOTAL VOLUME</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent-gold)' }}>
                                ${metrics.totalVolume.toFixed(0)}
                            </div>
                        </div>
                        <div className="inset-panel" style={{ padding: '15px', textAlign: 'center' }}>
                            <div className="engraved" style={{ fontSize: '0.65rem', marginBottom: '5px' }}>TOTAL CLAIMED</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--success)' }}>
                                ${metrics.totalClaimed.toFixed(0)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="glass-panel" style={{ padding: '25px', marginBottom: '20px' }}>
                    <div className="mono label-subtle" style={{ marginBottom: '20px' }}>// USER_DATABASE</div>

                    {/* Search */}
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="text"
                            placeholder="Search by username or wallet..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'var(--bg-inset)',
                                border: '1px solid var(--border-medium)',
                                borderRadius: '8px',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    {/* Users Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>USERNAME</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>WALLET</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>CLAIMED</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-gold)' }}>POINTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => (
                                    <tr key={u.wallet_address || u.x_username} style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                                        <td style={{ padding: '12px' }}>@{u.x_username}</td>
                                        <td className="mono" style={{ padding: '12px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            {(u.wallet_address || u.walletAddress || '').slice(0, 6)}...{(u.wallet_address || u.walletAddress || '').slice(-4)}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--success)' }}>${(u.total_claimed || 0).toFixed(2)}</td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: 'var(--accent-gold)' }}>
                                            {((u.total_deposited || 0) + (u.total_sent || 0) + (u.total_claimed || 0)).toFixed(0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No users found
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

export default AdminDashboard;
