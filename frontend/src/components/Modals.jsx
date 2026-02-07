import { useRef, useEffect } from 'react';
import '../index.css';

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
    backdropFilter: 'blur(8px)'
};

export function LeaderboardModal({ show, onClose, users }) {
    if (!show) return null;

    const sortedUsers = [...(users || [])]
        .map(u => ({
            ...u,
            // Use stats.points from Firebase if available, otherwise calculate
            points: u.stats?.points || u.points || ((u.total_deposited || 0) + (u.total_sent || 0) + (u.total_claimed || 0))
        }))
        .sort((a, b) => b.points - a.points)
        .filter(u => u.points > 0);

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div className="plate animate-scale modal-content" style={{
                maxWidth: '600px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                padding: '30px',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>

                <div className="screw tl"></div>
                <div className="screw tr"></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🏆</span>
                    <span className="engraved" style={{ fontSize: '0.9rem' }}>LEADERBOARD</span>
                </div>

                {sortedUsers.length === 0 ? (
                    <div className="inset-panel" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ color: 'var(--text-muted)' }}>No users yet</div>
                    </div>
                ) : (
                    <div>
                        {sortedUsers.slice(0, 10).map((u, idx) => (
                            <div key={u.wallet_address || idx} style={{
                                background: idx === 0 ? 'var(--bg-warning)' :
                                    idx === 1 ? 'var(--bg-secondary)' :
                                        idx === 2 ? 'var(--bg-inset)' : 'var(--bg-inset)',
                                border: idx === 0 ? '2px solid var(--accent-gold)' : 'var(--border-subtle)',
                                borderRadius: '10px',
                                padding: '15px',
                                marginBottom: '10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{
                                        width: '30px',
                                        height: '30px',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-medium)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '700',
                                        fontSize: '0.8rem',
                                        color: idx < 3 ? 'var(--accent-gold)' : 'var(--text-muted)'
                                    }}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>@{u.x_username}</div>
                                        <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            ${(u.total_deposited || 0).toFixed(0)} + ${(u.total_sent || 0).toFixed(0)} + ${(u.total_claimed || 0).toFixed(0)}
                                        </div>
                                    </div>
                                </div>
                                <div className="mono" style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-gold)' }}>
                                    {u.points.toFixed(0)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button onClick={onClose} className="btn" style={{ width: '100%', marginTop: '20px' }}>
                    CLOSE
                </button>
            </div>
        </div>
    );
}

export function AchievementsModal({ show, onClose, achievements, unlockedIds }) {
    if (!show) return null;

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div className="plate animate-scale modal-content" style={{
                maxWidth: '500px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                padding: '30px',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <div className="screw tl"></div>
                <div className="screw tr"></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                    <span style={{ fontSize: '1.5rem' }}>⭐</span>
                    <span className="engraved" style={{ fontSize: '0.9rem' }}>ACHIEVEMENTS</span>
                </div>

                <div style={{ display: 'grid', gap: '15px' }}>
                    {achievements.map((ach) => {
                        const unlocked = unlockedIds.includes(ach.id);
                        return (
                            <div key={ach.id} style={{
                                background: unlocked ? 'var(--bg-success)' : 'var(--bg-inset)',
                                border: unlocked ? 'var(--border-success)' : 'var(--border-subtle)',
                                borderRadius: '12px',
                                padding: '15px',
                                opacity: unlocked ? 1 : 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px'
                            }}>
                                <div style={{ fontSize: '2rem' }}>{ach.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>{ach.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ach.desc}</div>
                                </div>
                                {unlocked && (
                                    <div style={{ color: 'var(--success)', fontWeight: '700' }}>✓</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button onClick={onClose} className="btn" style={{ width: '100%', marginTop: '20px' }}>
                    CLOSE
                </button>
            </div>
        </div>
    );
}

export function AdminModal({ show, onClose, users }) {
    if (!show) return null;

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div className="plate animate-scale modal-content" style={{
                maxWidth: '900px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                padding: '30px',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <div className="screw tl"></div>
                <div className="screw tr"></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                    <span style={{ fontSize: '1.5rem' }}>👑</span>
                    <span className="engraved" style={{ fontSize: '0.9rem', color: 'var(--danger)' }}>ADMIN DASHBOARD</span>
                </div>

                {users.length === 0 ? (
                    <div className="inset-panel" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ color: 'var(--text-muted)' }}>No users yet</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.75rem'
                        }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>USERNAME</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>WALLET</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>DEPOSITED</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>SENT</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>CLAIMED</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-gold)' }}>POINTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.wallet_address} style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                                        <td style={{ padding: '12px' }}>@{u.x_username}</td>
                                        <td className="mono" style={{ padding: '12px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            {u.wallet_address?.substring(0, 6)}...{u.wallet_address?.substring(u.wallet_address.length - 4)}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>${(u.total_deposited || 0).toFixed(2)}</td>
                                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--danger)' }}>${(u.total_sent || 0).toFixed(2)}</td>
                                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--success)' }}>${(u.total_claimed || 0).toFixed(2)}</td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: 'var(--accent-gold)' }}>
                                            {((u.total_deposited || 0) + (u.total_sent || 0) + (u.total_claimed || 0)).toFixed(0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <button onClick={onClose} className="btn btn-danger" style={{ width: '100%', marginTop: '20px' }}>
                    CLOSE
                </button>
            </div>
        </div>
    );
}

// Stats Modal - shows user stats in popup
export function StatsModal({ show, onClose, userStats }) {
    if (!show) return null;

    const sent = userStats?.totalSent || 0;
    const claimed = userStats?.totalClaimed || 0;
    const points = userStats?.points || 0;

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div className="plate animate-scale modal-content" style={{
                maxWidth: '400px',
                width: '100%',
                padding: '30px',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <div className="screw tl"></div>
                <div className="screw tr"></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                    <span style={{ fontSize: '1.5rem' }}>📊</span>
                    <span className="engraved" style={{ fontSize: '0.9rem' }}>YOUR STATS</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div className="inset-panel" style={{ textAlign: 'center', padding: '20px' }}>
                        <div className="engraved" style={{ fontSize: '0.55rem', marginBottom: '8px' }}>SENT</div>
                        <div className="mono" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger)' }}>
                            ${sent.toFixed(2)}
                        </div>
                    </div>
                    <div className="inset-panel" style={{ textAlign: 'center', padding: '20px' }}>
                        <div className="engraved" style={{ fontSize: '0.55rem', marginBottom: '8px' }}>CLAIMED</div>
                        <div className="mono" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                            ${claimed.toFixed(2)}
                        </div>
                    </div>
                    <div className="inset-panel" style={{ textAlign: 'center', padding: '20px' }}>
                        <div className="engraved" style={{ fontSize: '0.55rem', marginBottom: '8px' }}>POINTS</div>
                        <div className="mono" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-gold)' }}>
                            {points.toFixed(0)}
                        </div>
                    </div>
                </div>

                <button onClick={onClose} className="btn" style={{ width: '100%', marginTop: '20px' }}>
                    CLOSE
                </button>
            </div>
        </div>
    );
}

// History Modal - shows transaction history in popup
export function HistoryModal({ show, onClose, payments, xUsername }) {
    if (!show) return null;

    const username = xUsername?.toLowerCase();

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div className="plate animate-scale modal-content" style={{
                maxWidth: '600px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                padding: '30px',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <div className="screw tl"></div>
                <div className="screw tr"></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                    <span style={{ fontSize: '1.5rem' }}>📜</span>
                    <span className="engraved" style={{ fontSize: '0.9rem' }}>TRANSACTION HISTORY</span>
                </div>

                {(!payments || payments.length === 0) ? (
                    <div className="inset-panel" style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ color: 'var(--text-muted)' }}>No transactions yet</div>
                    </div>
                ) : (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {payments.slice(0, 20).map((p, idx) => {
                            const isSender = p.sender_username === username;
                            const isRecipient = p.recipient_username === username;

                            return (
                                <div key={p.id || idx} style={{
                                    background: 'var(--bg-inset)',
                                    border: 'var(--border-subtle)',
                                    borderRadius: '10px',
                                    padding: '12px 15px',
                                    marginBottom: '10px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    color: 'var(--text-primary)'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                                            {isSender ? (
                                                <span>Sent to <span style={{ color: 'var(--glow)' }}>@{p.recipient_username}</span></span>
                                            ) : isRecipient ? (
                                                <span>Received from <span style={{ color: 'var(--glow)' }}>@{p.sender_username}</span></span>
                                            ) : (
                                                <span>@{p.sender_username} → @{p.recipient_username}</span>
                                            )}
                                        </div>
                                        <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            {p.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
                                        </div>
                                    </div>
                                    <div className="mono" style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '700',
                                        color: isSender ? 'var(--danger)' : isRecipient ? 'var(--success)' : 'var(--text-muted)'
                                    }}>
                                        {isSender ? '-' : isRecipient ? '+' : ''}${(p.amount || 0).toFixed(2)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <button onClick={onClose} className="btn" style={{ width: '100%', marginTop: '20px' }}>
                    CLOSE
                </button>
            </div>
        </div>
    );
}

// Share Success Modal - triggered after claim
export function ShareSuccessModal({ show, onClose, payment, xUsername, theme }) {
    const canvasRef = useRef(null);

    if (!show || !payment) return null;

    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Just claimed $${payment.amount} USDC on X via @bot_claw! 💸\n\nSocial economic settlement is here. ◎\n\nInitiate session at clawpay.fun`
    )}`;

    const generateReceipt = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = 800;
        const height = 450;
        canvas.width = width;
        canvas.height = height;

        // Background
        const isLight = theme === 'light';
        ctx.fillStyle = isLight ? '#ffffff' : '#0d0d0d';
        ctx.fillRect(0, 0, width, height);

        if (isLight) {
            // Grid background for light mode
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i < width; i += 40) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, height);
                ctx.stroke();
            }
            for (let i = 0; i < height; i += 40) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(width, i);
                ctx.stroke();
            }
        }

        // Draw border
        ctx.strokeStyle = isLight ? '#000000' : '#31d7ff';
        ctx.lineWidth = 10;
        ctx.strokeRect(20, 20, width - 40, height - 40);

        // Header
        ctx.fillStyle = isLight ? '#000000' : '#ffffff';
        ctx.font = 'bold 32px Space Grotesk';
        ctx.fillText('CLAW PAY // SETTLEMENT_RECEIPT', 60, 80);

        // Date
        ctx.font = '16px JetBrains Mono';
        ctx.fillStyle = isLight ? '#666666' : '#888888';
        ctx.fillText(new Date().toLocaleString().toUpperCase(), 60, 110);

        // Amount Box
        const boxY = 150;
        const boxHeight = 150;
        ctx.fillStyle = isLight ? '#f8f8f8' : '#141416';
        if (isLight) {
            ctx.fillRect(60, boxY, width - 120, boxHeight);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeRect(60, boxY, width - 120, boxHeight);
        } else {
            ctx.fillRect(60, boxY, width - 120, boxHeight);
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(60, boxY, width - 120, boxHeight);
        }

        // Amount Display
        ctx.fillStyle = isLight ? '#000000' : '#ffffff';
        ctx.font = 'bold 80px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(`$${payment.amount} USDC`, width / 2, boxY + 100);

        // Recipients
        ctx.textAlign = 'left';
        ctx.font = '20px JetBrains Mono';
        ctx.fillStyle = isLight ? '#000000' : '#31d7ff';
        ctx.fillText(`FROM: @${payment.sender_username}`, 80, boxY + boxHeight + 50);
        ctx.fillText(`CLAIMED BY: @${xUsername}`, 80, boxY + boxHeight + 80);

        // Status
        ctx.textAlign = 'right';
        ctx.font = 'bold 24px Space Grotesk';
        ctx.fillStyle = '#4ade80';
        ctx.fillText('✓ CONFIRMED ON SOLANA', width - 80, boxY + boxHeight + 65);

        // Branding
        ctx.textAlign = 'center';
        ctx.font = '14px Space Grotesk';
        ctx.fillStyle = isLight ? '#999999' : '#444444';
        ctx.fillText('BUILT ON SOLANA // CLAWPAY.FUN', width / 2, height - 45);

        // Download
        const link = document.createElement('a');
        link.download = `clawpay-receipt-${payment.id || Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div className="plate animate-scale modal-content" style={{
                maxWidth: '450px',
                width: '100%',
                padding: '40px 30px',
                position: 'relative',
                textAlign: 'center'
            }} onClick={e => e.stopPropagation()}>
                <div className="screw tl"></div>
                <div className="screw tr"></div>

                <div style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 700,
                    fontSize: '2rem',
                    letterSpacing: '0.02em',
                    color: 'var(--text-primary)',
                    marginBottom: '20px'
                }}>
                    CLAW PAY
                </div>

                <h2 style={{
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    marginBottom: '10px',
                    fontFamily: "'Fredoka', sans-serif",
                    color: 'var(--success)'
                }}>
                    CLAIM SUCCESSFUL!
                </h2>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: 1.6 }}>
                    You just claimed <span style={{ color: 'var(--success)', fontWeight: '700' }}>${payment.amount} USDC</span>.
                    The funds are available in your wallet.
                </p>

                <div className="inset-panel" style={{ marginBottom: '30px', padding: '20px' }}>
                    <div className="engraved" style={{ marginBottom: '15px', fontSize: '0.6rem' }}>SHARE THE LOVE</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                            </svg>
                            SHARE ON X
                        </a>

                        <button
                            onClick={generateReceipt}
                            className="btn btn-gold"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                        >
                            📥 DOWNLOAD RECEIPT
                        </button>
                    </div>
                </div>

                <button onClick={onClose} className="btn" style={{ width: '100%' }}>
                    BACK TO DASHBOARD
                </button>

                {/* Hidden Canvas for Receipt Generation */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
        </div>
    );
}

// Lottery Win Modal - triggered after claiming a lottery jackpot
export function LotteryWinModal({ show, onClose, prizeAmount, theme }) {
    if (!show) return null;

    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `HOLY SHIT! I just won a $${prizeAmount} USDC jackpot on CLAW PAY! 🏆💸\n\nThe Claw moves intent on Solana. ◎\n\nVerify entries at clawpay.fun @bot_claw`
    )}`;

    return (
        <div style={modalOverlayStyle} onClick={onClose}>
            <div className="plate animate-scale modal-content" style={{
                maxWidth: '450px',
                width: '100%',
                padding: '40px 30px',
                position: 'relative',
                textAlign: 'center',
                borderColor: 'var(--accent)'
            }} onClick={e => e.stopPropagation()}>
                <div className="screw tl"></div>
                <div className="screw tr"></div>

                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏆</div>

                <h2 style={{
                    fontSize: '2.2rem',
                    fontWeight: '900',
                    marginBottom: '10px',
                    fontFamily: "'Fredoka', sans-serif",
                    color: 'var(--accent)'
                }}>
                    JACKPOT_CLAIMED!
                </h2>

                <div className="glass-panel" style={{
                    padding: '20px',
                    marginBottom: '30px',
                    background: 'rgba(var(--accent-rgb), 0.1)',
                    borderColor: 'var(--accent)'
                }}>
                    <div className="mono label-subtle" style={{ color: 'var(--accent)', marginBottom: '5px' }}>AMOUNT_SETTLED</div>
                    <div className="mono" style={{ fontSize: '2.5rem', fontWeight: 900 }}>${prizeAmount}</div>
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: 1.6 }}>
                    Your winnings have been transferred to your secure Solana vault. Time to celebrate!
                </p>

                <div className="inset-panel" style={{ marginBottom: '30px', padding: '20px' }}>
                    <div className="engraved" style={{ marginBottom: '15px', fontSize: '0.6rem' }}>BOAST_ON_COMMERCIAL_X</div>
                    <a
                        href={shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'var(--accent-secondary)' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                        </svg>
                        SHARE_VICTORY
                    </a>
                </div>

                <button onClick={onClose} className="btn" style={{ width: '100%' }}>
                    BACK TO VAULT
                </button>
            </div>
        </div>
    );
}
