import { useState, useEffect } from 'react';
import '../index.css';

export function LotteryBanner({
    lottery,
    onOpenDetails,
    userWallet,
    xUsername
}) {
    const [timeRemaining, setTimeRemaining] = useState('');

    // Update countdown every second
    useEffect(() => {
        if (!lottery?.endTime) return;

        // Show winner info if completed
        if (lottery.status === 'completed' || lottery.status === 'claimed') {
            if (lottery.winner) {
                setTimeRemaining(`Winner: @${lottery.winner.username}`);
            } else {
                setTimeRemaining('Winner selected!');
            }
            return;
        }

        if (lottery.status !== 'active') return;

        const updateTimer = () => {
            const endTime = new Date(lottery.endTime);
            const now = new Date();
            const diff = endTime - now;

            if (diff <= 0) {
                setTimeRemaining('Drawing soon!');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
            } else {
                setTimeRemaining(`${minutes}m ${seconds}s`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [lottery?.endTime, lottery?.status, lottery?.winner]);

    // Only show banner for ACTIVE lotteries on homepage
    if (!lottery || lottery.status !== 'active') {
        return null;
    }

    return (
        <div
            className="lottery-banner animate-fade-in"
            onClick={onOpenDetails}
            style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, #d94500 50%, #b43a00 100%)',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '20px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 20px var(--glow)'
            }}
        >
            {/* Animated background effect */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '200%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                animation: 'shimmer 3s infinite'
            }} />

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
                color: 'white',
                flexWrap: 'wrap',
                gap: '10px'
            }}>
                {/* Left side - Prize info */}
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>🎰</span>
                        <span style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '2px 8px',
                            borderRadius: '4px'
                        }}>
                            SWARM DISTRIBUTION
                        </span>
                    </div>
                    <div style={{
                        fontSize: '1.8rem',
                        fontWeight: '800',
                        fontFamily: "'Fredoka', sans-serif",
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        ${lottery.prizeAmount} USDC
                    </div>
                </div>

                {/* Right side - Countdown or Winner */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontSize: '0.7rem',
                        opacity: 0.9,
                        marginBottom: '4px',
                        fontWeight: '500'
                    }}>
                        DRAW IN
                    </div>
                    <div style={{
                        fontSize: '1.4rem',
                        fontWeight: '700',
                        fontFamily: "'JetBrains Mono', monospace"
                    }}>
                        {timeRemaining}
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
                color: 'white'
            }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                    🧠 Agent Intent: <span style={{ fontWeight: 700 }}>Evolving Swarm Intelligence</span>
                </span>
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '4px 10px',
                    borderRadius: '20px'
                }}>
                    Tap for details →
                </span>
            </div>
        </div>
    );
}

export default LotteryBanner;
