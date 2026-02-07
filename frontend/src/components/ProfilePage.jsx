import '../index.css';

// Note: achievements prop is an array of achievement objects from Firebase (with id, name, icon, etc.)

export function ProfilePage({
    xUsername,
    userStats,
    isDelegated,
    onCheckPayments,
    onResetTutorial,
    onOpenLeaderboard,
    onBack,
    achievements = [] // Array of unlocked achievement OBJECTS from Firebase
}) {
    // Full achievements list for display
    const ACHIEVEMENTS = [
        { id: 'first_payment', name: 'First Blood', desc: 'Send your first payment', icon: '🎯' },
        { id: 'first_claim', name: 'Claim Master', desc: 'Claim your first payment', icon: '💎' },
        { id: 'authorized', name: 'Trusted', desc: 'Authorize the vault', icon: '🔐' },
        { id: 'big_spender', name: 'Big Spender', desc: 'Send over $100', icon: '💸' },
        { id: 'collector', name: 'Collector', desc: 'Claim over $100', icon: '🏆' },
        { id: 'whale', name: 'Whale', desc: 'Send over $1000', icon: '🐋' },
        { id: 'mega_whale', name: 'Mega Whale', desc: 'Send over $10,000', icon: '🐳' },
        { id: 'veteran', name: 'Veteran', desc: 'Complete 10 transactions', icon: '⭐' },
        { id: 'multi_sender', name: 'Generous', desc: 'Send to 5 different users', icon: '🎁' },
        { id: 'daily_login', name: 'Dedicated', desc: 'Log in today', icon: '📅' },
        { id: 'streak_7', name: 'Weekly Warrior', desc: '7-day login streak', icon: '🔥' },
        { id: 'streak_30', name: 'Monthly Master', desc: '30-day login streak', icon: '💫' },
        { id: 'social_sharer', name: 'Influencer', desc: 'Share a payment on X', icon: '📣' },
        { id: 'early_adopter', name: 'Pioneer', desc: 'Join in first 1000 users', icon: '🚀' },
        { id: 'lottery_winner', name: 'Lucky', desc: 'Win the weekly lottery', icon: '🎰' }
    ];





    return (
        <div className="profile-page reveal-element visible">
            {/* Profile Header */}
            <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div className="mono label-subtle" style={{ marginBottom: '20px' }}>// USER_IDENTITY</div>
                <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', background: 'var(--accent)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '2rem', fontWeight: 900 }}>
                    {xUsername ? xUsername[0].toUpperCase() : 'W'}
                </div>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>@{xUsername}</h2>
                <div className="mono" style={{ display: 'inline-block', padding: '6px 15px', borderRadius: '100px', background: 'var(--bg-inset)', fontSize: '0.8rem' }}>
                    <span className="text-muted">POINTS_REWARD:</span> <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{userStats?.points?.toFixed(0) || 0}</span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-panel animate-fade-in" style={{ marginBottom: '30px' }}>
                <div className="mono label-subtle" style={{ marginBottom: '20px' }}>// QUICK_ACTIONS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <button onClick={onCheckPayments} className="btn btn-accent" style={{ borderRadius: '16px' }}>
                        CHECK_PAYMENTS
                    </button>
                    <button onClick={onResetTutorial} className="btn btn-primary mobile-fit-btn" style={{ borderRadius: '16px' }}>
                        TUTORIAL
                    </button>
                </div>
            </div>


            {/* Stats */}
            <div className="glass-panel animate-fade-in" style={{ marginBottom: '30px' }}>
                <div className="mono label-subtle" style={{ marginBottom: '20px' }}>// PERFORMANCE_METRICS</div>
                <div className="stats-grid">
                    <div className="stat-item">
                        <div className="mono label-subtle" style={{ fontSize: '0.6rem', marginBottom: '10px' }}>TOTAL_CLAIMED</div>
                        <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>
                            ${(userStats?.totalClaimed || 0).toFixed(2)}
                        </div>
                    </div>
                    <div className="stat-item">
                        <div className="mono label-subtle" style={{ fontSize: '0.6rem', marginBottom: '10px' }}>VOLUME_REWARD</div>
                        <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                            {(userStats?.points || 0).toFixed(0)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
