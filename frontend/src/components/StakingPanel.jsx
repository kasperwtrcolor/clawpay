import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import '../index.css';

export function StakingPanel({ xUsername, walletAddress, walletBalance }) {
    const [stakeAmount, setStakeAmount] = useState('');
    const [stakingInfo, setStakingInfo] = useState(null);
    const [globalStats, setGlobalStats] = useState(null);
    const [loading, setLoading] = useState(false);

    // Read staking info from Firebase
    useEffect(() => {
        if (!xUsername) return;

        const stakeRef = doc(db, 'stakes', xUsername.toLowerCase());
        const unsubscribe = onSnapshot(stakeRef, (snapshot) => {
            if (snapshot.exists()) {
                setStakingInfo(snapshot.data());
            }
        }, (err) => {
            console.error('Staking info error:', err);
        });

        return () => unsubscribe();
    }, [xUsername]);

    // Read global staking stats from Firebase
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const statsDoc = await getDoc(doc(db, 'meta', 'staking_stats'));
                if (statsDoc.exists()) {
                    setGlobalStats(statsDoc.data());
                } else {
                    // Build stats from stakes collection
                    const stakesSnap = await getDocs(collection(db, 'stakes'));
                    let totalStaked = 0;
                    let totalStakers = 0;
                    stakesSnap.forEach(doc => {
                        const data = doc.data();
                        if (data.staked_amount > 0) {
                            totalStaked += data.staked_amount;
                            totalStakers++;
                        }
                    });
                    setGlobalStats({ total_staked: totalStaked, total_stakers: totalStakers });
                }
            } catch (err) {
                console.error('Global staking stats error:', err);
            }
        };
        fetchStats();
    }, []);

    const handleStake = async () => {
        const amount = parseFloat(stakeAmount);
        if (!amount || amount <= 0) return;
        if (amount > walletBalance) return;

        setLoading(true);
        try {
            const stakeRef = doc(db, 'stakes', xUsername.toLowerCase());
            const existing = await getDoc(stakeRef);
            const currentAmount = existing.exists() ? (existing.data().staked_amount || 0) : 0;

            await setDoc(stakeRef, {
                staked_amount: currentAmount + amount,
                wallet: walletAddress,
                username: xUsername,
                updated_at: new Date()
            }, { merge: true });

            setStakeAmount('');
        } catch (err) {
            console.error('Staking failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnstake = async () => {
        if (!stakingInfo?.staked_amount) return;

        setLoading(true);
        try {
            const stakeRef = doc(db, 'stakes', xUsername.toLowerCase());
            await setDoc(stakeRef, {
                staked_amount: 0,
                updated_at: new Date()
            }, { merge: true });
        } catch (err) {
            console.error('Unstake failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const tierInfo = getTierInfo(stakingInfo?.staked_amount || 0);

    return (
        <div className="glass-panel" style={{ marginBottom: '30px' }}>
            <div className="label-subtle" style={{ background: 'var(--accent)', color: '#000' }}>// AGENT_STAKING</div>

            <div className="mono" style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '10px', marginBottom: '15px' }}>
                Stake USDC into the treasury for higher reward multipliers and priority evaluation.
            </div>

            {/* Your Stake */}
            <div className="inset-panel" style={{ marginBottom: '15px' }}>
                <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '8px' }}>YOUR_STAKE</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div className="mono" style={{ fontWeight: 900, fontSize: '1.4rem' }}>
                            ${(stakingInfo?.staked_amount || 0).toFixed(2)}
                        </div>
                        <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.7 }}>USDC STAKED</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div className="mono" style={{
                            fontWeight: 900, fontSize: '0.8rem',
                            color: tierInfo.color
                        }}>
                            {tierInfo.name}
                        </div>
                        <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                            {tierInfo.multiplier}x REWARD_MULTIPLIER
                        </div>
                    </div>
                </div>
            </div>

            {/* Stake Controls */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                    type="number"
                    placeholder="Amount USDC"
                    value={stakeAmount}
                    onChange={e => setStakeAmount(e.target.value)}
                    style={{
                        flex: 1, padding: '10px', border: 'var(--border)',
                        background: 'var(--bg-primary)', color: 'var(--text-primary)',
                        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem'
                    }}
                />
                <button
                    onClick={handleStake}
                    disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                    className="btn btn-accent"
                    style={{ padding: '10px 16px', fontSize: '0.65rem' }}
                >
                    {loading ? '...' : 'STAKE'}
                </button>
                {stakingInfo?.staked_amount > 0 && (
                    <button
                        onClick={handleUnstake}
                        disabled={loading}
                        className="btn"
                        style={{ padding: '10px 16px', fontSize: '0.65rem' }}
                    >
                        UNSTAKE
                    </button>
                )}
            </div>

            {/* Tier Breakdown */}
            <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '8px' }}>STAKING_TIERS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '15px' }}>
                {TIERS.map(tier => (
                    <div key={tier.name} className="mono" style={{
                        padding: '8px', textAlign: 'center', fontSize: '0.55rem',
                        border: tierInfo.name === tier.name ? `2px solid ${tier.color}` : 'var(--border-subtle)',
                        background: tierInfo.name === tier.name ? 'rgba(0,255,136,0.05)' : 'transparent'
                    }}>
                        <div style={{ fontWeight: 900, color: tier.color }}>{tier.name}</div>
                        <div style={{ opacity: 0.7 }}>${tier.min}+</div>
                        <div style={{ opacity: 0.7 }}>{tier.multiplier}x</div>
                    </div>
                ))}
            </div>

            {/* Global Stats */}
            {globalStats && (
                <div className="inset-panel">
                    <div className="mono" style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '8px' }}>TREASURY_POOL</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="mono" style={{ fontSize: '0.7rem' }}>
                            <span style={{ fontWeight: 900 }}>${globalStats.total_staked?.toFixed(2) || '0.00'}</span> TOTAL_STAKED
                        </div>
                        <div className="mono" style={{ fontSize: '0.7rem' }}>
                            <span style={{ fontWeight: 900 }}>{globalStats.total_stakers || 0}</span> STAKERS
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const TIERS = [
    { name: 'OBSERVER', min: 0, multiplier: 1.0, color: 'var(--text-muted)' },
    { name: 'OPERATOR', min: 10, multiplier: 1.25, color: 'var(--accent-secondary)' },
    { name: 'SENTINEL', min: 50, multiplier: 1.5, color: 'var(--accent)' },
    { name: 'ARCHITECT', min: 200, multiplier: 2.0, color: 'var(--success)' }
];

function getTierInfo(amount) {
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (amount >= TIERS[i].min) return TIERS[i];
    }
    return TIERS[0];
}
