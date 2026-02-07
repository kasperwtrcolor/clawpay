import { useState, useEffect } from 'react';
import '../index.css';

export function AdminDashboard({
    users,
    onClose,
    // Enhanced Lottery props
    currentLottery,
    onCreateLottery,
    onActivateLottery,
    onSetLotteryPrize,
    onDrawLottery
}) {
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');

    // Lottery creation form state
    const [newPrize, setNewPrize] = useState(50);
    const [newEndTime, setNewEndTime] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);

    // Set default end time to 24 hours from now
    useEffect(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setNewEndTime(tomorrow.toISOString().slice(0, 16)); // Format for datetime-local
    }, []);

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

    // Eligible users count (users who have sent payments)
    const eligibleUsers = users?.filter(u => (u.total_sent || 0) > 0) || [];

    // Total entries calculation
    const totalEntries = eligibleUsers.reduce((sum, u) =>
        sum + Math.floor((u.total_sent || 0) / 10) + 1, 0
    );

    // Lottery status helpers
    const lotteryStatus = currentLottery?.status || 'none';
    const isLotteryActive = lotteryStatus === 'active';
    const isLotteryCompleted = lotteryStatus === 'completed' || lotteryStatus === 'claimed';
    const hasWinner = !!currentLottery?.winner;

    // Time remaining calculation
    const getTimeRemaining = () => {
        if (!currentLottery?.endTime) return null;
        const endTime = new Date(currentLottery.endTime);
        const now = new Date();
        const diff = endTime - now;

        if (diff <= 0) return 'Ended';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    // Handle lottery creation
    const handleCreateLottery = async () => {
        setIsCreating(true);
        try {
            await onCreateLottery?.(newPrize, newEndTime);
        } finally {
            setIsCreating(false);
        }
    };

    // Handle draw
    const handleDraw = async () => {
        setIsDrawing(true);
        try {
            await onDrawLottery?.();
        } finally {
            setIsDrawing(false);
        }
    };

    const tabs = [
        { id: 'overview', label: '📊 Overview' },
        { id: 'users', label: '👥 Users' },
        { id: 'lottery', label: '🎰 Swarm Dist' }
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

            {/* Enhanced Lottery Tab */}
            {activeTab === 'lottery' && (
                <div className="glass-panel" style={{ padding: '25px', marginBottom: '20px' }}>
                    <div className="mono label-subtle" style={{ marginBottom: '20px' }}>// SWARM_DISTRIBUTION_MANAGEMENT</div>

                    {/* Current Lottery Status */}
                    {currentLottery && (
                        <div className="inset-panel" style={{
                            padding: '20px',
                            marginBottom: '20px',
                            background: hasWinner
                                ? 'linear-gradient(135deg, var(--accent-gold) 0%, #f59e0b 100%)'
                                : isLotteryActive
                                    ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                                    : 'var(--bg-inset)',
                            color: (hasWinner || isLotteryActive) ? 'black' : 'var(--text-primary)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '5px' }}>
                                        {hasWinner ? '🏆 WINNER SELECTED' : isLotteryActive ? '🔴 LIVE' : lotteryStatus.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                                        {hasWinner
                                            ? `@${currentLottery.winner.username}`
                                            : `$${currentLottery.prizeAmount || 0} USDC`
                                        }
                                    </div>
                                    {hasWinner && (
                                        <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>
                                            Prize: ${currentLottery.prizeAmount} USDC
                                        </div>
                                    )}
                                </div>
                                {isLotteryActive && !hasWinner && (
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>ENDS IN</div>
                                        <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>
                                            {getTimeRemaining()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Status Actions */}
                            {lotteryStatus === 'draft' && (
                                <button
                                    onClick={() => onActivateLottery?.(currentLottery.id)}
                                    className="btn btn-success"
                                    style={{ marginTop: '15px', width: '100%' }}
                                >
                                    🚀 ACTIVATE SWARM DISTRIBUTION
                                </button>
                            )}

                            {isLotteryActive && !hasWinner && (
                                <button
                                    onClick={handleDraw}
                                    disabled={isDrawing}
                                    className="btn btn-gold"
                                    style={{ marginTop: '15px', width: '100%' }}
                                >
                                    {isDrawing ? '⏳ Drawing...' : '🎲 DRAW WINNER'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Create New Lottery */}
                    {(!currentLottery || isLotteryCompleted) && (
                        <div className="inset-panel" style={{ padding: '20px', marginBottom: '20px' }}>
                            <div className="engraved" style={{ fontSize: '0.7rem', marginBottom: '15px' }}>
                                CREATE NEW SWARM DISTRIBUTION
                            </div>

                            <div style={{ display: 'grid', gap: '15px' }}>
                                {/* Prize Amount */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                                        Prize Amount (USDC)
                                    </label>
                                    <input
                                        type="number"
                                        value={newPrize}
                                        onChange={(e) => setNewPrize(parseFloat(e.target.value) || 0)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            background: 'var(--bg-inset)',
                                            border: '1px solid var(--border-medium)',
                                            borderRadius: '8px',
                                            color: 'var(--text-primary)',
                                            fontSize: '1.2rem',
                                            fontWeight: '700'
                                        }}
                                    />
                                </div>

                                {/* End Time */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                                        Draw Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={newEndTime}
                                        onChange={(e) => setNewEndTime(e.target.value)}
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

                                <button
                                    onClick={handleCreateLottery}
                                    disabled={isCreating || newPrize <= 0}
                                    className="btn btn-primary"
                                    style={{ padding: '15px' }}
                                >
                                    {isCreating ? '⏳ Creating...' : '✨ CREATE LOTTERY'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Eligible Users */}
                    <div className="inset-panel" style={{ padding: '20px' }}>
                        <div className="engraved" style={{ fontSize: '0.7rem', marginBottom: '15px' }}>
                            ELIGIBLE PARTICIPANTS
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--glow)' }}>
                                    {eligibleUsers.length}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Users</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-gold)' }}>
                                    {totalEntries}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Entries</div>
                            </div>
                        </div>

                        {/* Top participants */}
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {eligibleUsers.slice(0, 10).map((u, i) => (
                                <div key={u.x_username || i} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '8px 0',
                                    borderBottom: '1px solid var(--border-subtle)',
                                    fontSize: '0.8rem'
                                }}>
                                    <span>@{u.x_username}</span>
                                    <span style={{ color: 'var(--accent-gold)' }}>
                                        {Math.floor((u.total_sent || 0) / 10) + 1} entries
                                    </span>
                                </div>
                            ))}
                            {eligibleUsers.length > 10 && (
                                <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                    +{eligibleUsers.length - 10} more participants
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-warning)', borderRadius: '8px' }}>
                        <div style={{ color: 'var(--text-on-status)', fontSize: '0.8rem' }}>
                            ℹ️ <strong>How it works:</strong> Users earn 1 base entry + 1 additional entry per $10 sent.
                            The lottery must be activated for users to see it on the homepage.
                            Winner can be drawn after the end time.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
