import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import '../index.css';

export function LotteryPage({
    currentLottery,
    lotteryHistory = [],
    eligibleUsers = [],
    userStats,
    userWallet,
    xUsername,
    onClaim,
    onRefresh,
    onFetchHistory,
    isClaiming = false,
    onBack
}) {
    const [timeRemaining, setTimeRemaining] = useState('');
    const [activeTab, setActiveTab] = useState('current');

    useEffect(() => {
        onRefresh?.();
        onFetchHistory?.();
    }, []);

    useEffect(() => {
        if (!currentLottery?.endTime) return;
        if (currentLottery.status === 'completed' || currentLottery.status === 'claimed') {
            setTimeRemaining(currentLottery.winner ? `@${currentLottery.winner.username}` : 'Selected!');
            return;
        }
        if (currentLottery.status !== 'active') {
            setTimeRemaining('DRAFT_MODE');
            return;
        }

        const updateTimer = () => {
            const endTime = new Date(currentLottery.endTime);
            const now = new Date();
            const diff = endTime - now;
            if (diff <= 0) {
                setTimeRemaining('DRAW_PENDING...');
                return;
            }
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeRemaining(`${h}H ${m}M ${s}S`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [currentLottery?.endTime, currentLottery?.status, currentLottery?.winner]);

    // Calculate user entries - prioritize direct userStats prop from hook, fallback to list search
    const myTotalSent = userStats?.totalSent || userStats?.total_sent || 0;
    const userEntries = Math.floor(myTotalSent / 10) + 1;

    // Calculate total entries including the current user even if they aren't in the eligibleUsers list yet
    const baseTotalEntries = eligibleUsers.reduce((sum, u) => {
        // Skip current user in the list reduction to avoid double counting
        const uWallet = (u.wallet_address || u.walletAddress || '').toLowerCase();
        const myWallet = (userWallet || '').toLowerCase();
        if (uWallet && myWallet && uWallet === myWallet) return sum;
        return sum + Math.floor((u.total_sent || u.totalSent || 0) / 10) + 1;
    }, 0);

    const totalEntries = baseTotalEntries + userEntries;

    const isWinner = currentLottery?.winner &&
        (currentLottery.winner.walletAddress?.toLowerCase() === userWallet?.toLowerCase() ||
            currentLottery.winner.username?.toLowerCase().replace('@', '') === xUsername?.toLowerCase().replace('@', ''));

    const canClaim = isWinner && currentLottery?.status === 'completed';

    return (
        <div className="lottery-page reveal-element visible" style={{ padding: '0 0 100px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Nav Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                <button onClick={onBack} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.8rem' }}>← DASHBOARD</button>
                <h2 className="mono" style={{ margin: 0 }}>SWARM_VAULT</h2>
            </div>

            {/* Tabs */}
            <div className="glass-panel" style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '100px', marginBottom: '30px' }}>
                <button onClick={() => setActiveTab('current')} className="btn" style={{ flex: 1, background: activeTab === 'current' ? 'var(--text-primary)' : 'transparent', color: activeTab === 'current' ? 'var(--bg-primary)' : 'var(--text-primary)' }}>ACTIVE_DRAW</button>
                <button onClick={() => setActiveTab('history')} className="btn" style={{ flex: 1, background: activeTab === 'history' ? 'var(--text-primary)' : 'transparent', color: activeTab === 'history' ? 'var(--bg-primary)' : 'var(--text-primary)' }}>HISTORY</button>
            </div>

            {/* Explanation Section */}
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px', background: 'rgba(var(--accent-rgb), 0.05)', borderStyle: 'dashed' }}>
                <div className="mono label-subtle" style={{ marginBottom: '10px', color: 'var(--accent)' }}>// HOW_IT_WORKS</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Every user earns <strong style={{ color: 'var(--text-primary)' }}>1 base entry</strong> for participating.
                    Earn <strong style={{ color: 'var(--accent)' }}>1 additional entry</strong> for every $10 sent through CLAW PAY.
                    The more payments you send, the higher your odds of winning the jackpot!
                </p>
            </div>

            {activeTab === 'current' && currentLottery ? (
                <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{
                        background: currentLottery.winner ? 'var(--success)' : 'var(--accent)',
                        padding: '40px 30px',
                        color: '#000',
                        textAlign: 'center'
                    }}>
                        <p className="mono label-subtle" style={{ color: 'rgba(0,0,0,0.6)', marginBottom: '10px' }}>DISTRIBUTION_POOL</p>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '10px' }}>${currentLottery.prizeAmount}</h1>
                        <div className="mono" style={{ background: 'rgba(0,0,0,0.1)', padding: '8px 20px', borderRadius: '100px', display: 'inline-block', fontWeight: 700 }}>
                            {currentLottery.winner ? `RECIPIENT: @${currentLottery.winner.username}` : `SETTLEMENT_IN: ${timeRemaining}`}
                        </div>
                    </div>

                    <div style={{ padding: '40px' }}>
                        {canClaim && (
                            <div className="glass-panel" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--success)', textAlign: 'center', marginBottom: '30px', padding: '30px' }}>
                                <h3 className="mono" style={{ color: 'var(--success)', marginBottom: '10px' }}>SWARM_REWARD_ATTRIBUTED</h3>
                                <p style={{ marginBottom: '20px' }}>The agent has identified your value. Settle your reward now.</p>
                                <button onClick={() => onClaim?.(currentLottery.id)} disabled={isClaiming} className="btn btn-accent" style={{ width: '100%', marginBottom: '15px' }}>
                                    {isClaiming ? 'SETTLING...' : 'SETTLE_REWARD'}
                                </button>
                                <a
                                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`THE CLAW HAS IDENTIFIED ME. 🦾\n\nI just received a $${currentLottery.prizeAmount} SWARM_DISTRIBUTION reward from @clawpay_agent. \n\nInitiate session: clawpay.fun`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                    style={{ width: '100%', textDecoration: 'none', background: 'var(--accent-secondary)' }}
                                >
                                    SHARE_SETTLEMENT
                                </a>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                            <div className="inset-panel" style={{ textAlign: 'center' }}>
                                <p className="mono label-subtle">YOUR_ENTRIES</p>
                                <h3 style={{ fontSize: '2rem', color: 'var(--accent)' }}>{userEntries}</h3>
                            </div>
                            <div className="inset-panel" style={{ textAlign: 'center' }}>
                                <p className="mono label-subtle">EST_WIN_CHANCE</p>
                                <h3 style={{ fontSize: '2rem' }}>{totalEntries > 0 ? ((userEntries / totalEntries) * 100).toFixed(1) : 0}%</h3>
                            </div>
                        </div>


                        <div className="mono label-subtle" style={{ marginBottom: '20px' }}>RECENT_PARTICIPANTS</div>
                        <div style={{ background: 'var(--bg-inset)', borderRadius: '16px', overflow: 'hidden' }}>
                            {eligibleUsers.slice(0, 10).map((u, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                                    <span className="mono">@{u.x_username || u.xUsername}</span>
                                    <span className="text-muted">{Math.floor((u.total_sent || u.totalSent || 0) / 10) + 1} ENTRIES</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : activeTab === 'history' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {lotteryHistory.map((lottery, i) => {
                        const isWinnerH = lottery.winner &&
                            (lottery.winner.walletAddress?.toLowerCase() === userWallet?.toLowerCase() ||
                                lottery.winner.username?.toLowerCase().replace('@', '') === xUsername?.toLowerCase().replace('@', ''));
                        const canClaimH = isWinnerH && lottery.status === 'completed';

                        return (
                            <div key={i} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 className="mono" style={{ color: 'var(--accent)' }}>${lottery.prizeAmount}</h3>
                                    <p className="mono label-subtle" style={{ marginTop: '5px' }}>{lottery.status === 'claimed' ? 'PAYMENT_SETTLED' : 'DRAW_COMPLETED'}</p>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                                    <div className="mono" style={{ fontWeight: 700 }}>@{lottery.winner?.username}</div>
                                    {canClaimH ? (
                                        <button
                                            onClick={() => onClaim?.(lottery.id)}
                                            disabled={isClaiming}
                                            className="btn btn-accent"
                                            style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                                        >
                                            {isClaiming ? 'WAITING...' : 'CLAIM_PRIZE'}
                                        </button>
                                    ) : (
                                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{lottery.status === 'claimed' ? 'CLAIMED' : 'UNCLAIMED'}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="tx-spinner" style={{ margin: '0 auto 20px' }}></div>
                    <p className="mono label-subtle">SYNCHRONIZING_VAULT_DATA...</p>
                </div>
            )}
        </div>
    );
}

export default LotteryPage;
