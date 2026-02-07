import { useState, useRef } from 'react';
import '../index.css';

export function LotteryWinnerCard({
    show,
    lottery,
    xUsername,
    onClose
}) {
    const cardRef = useRef(null);
    const [isSharing, setIsSharing] = useState(false);

    if (!show || !lottery?.winner) return null;

    // Format date
    const claimedDate = lottery.claimedAt?.toDate?.()
        ? new Date(lottery.claimedAt.toDate()).toLocaleDateString()
        : new Date().toLocaleDateString();

    // Share on X
    const handleShareOnX = () => {
        setIsSharing(true);
        const text = `I JUST WON THE $${lottery.prizeAmount} CLAW PAY JACKPOT! 🏆\n\nThe Claw moves intent on Solana. ◎\n\nInitiate session at clawpay.fun @bot_claw`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'width=550,height=420');
        setIsSharing(false);
    };

    // Download as image (using html2canvas if available, or fallback message)
    const handleDownload = async () => {
        if (typeof window !== 'undefined' && window.html2canvas) {
            try {
                const canvas = await window.html2canvas(cardRef.current);
                const link = document.createElement('a');
                link.download = `claw-win-${lottery.prizeAmount}usdc.png`;
                link.href = canvas.toDataURL();
                link.click();
            } catch (e) {
                console.error('Failed to capture card:', e);
                alert('Screenshot feature requires html2canvas library');
            }
        } else {
            // Fallback: prompt user to screenshot manually
            alert('Take a screenshot to save your win! 📸');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content animate-pop-in"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '380px', padding: '0', background: 'transparent' }}
            >
                {/* Shareable Card */}
                <div
                    ref={cardRef}
                    className="winner-card"
                    style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                        borderRadius: '24px',
                        padding: '30px 25px',
                        textAlign: 'center',
                        border: '3px solid',
                        borderImage: 'linear-gradient(135deg, #f59e0b, #fcd34d) 1',
                        boxShadow: '0 20px 60px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                    }}
                >
                    {/* Logo/Brand */}
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#94a3b8',
                        marginBottom: '15px',
                        letterSpacing: '0.15em'
                    }}>
                        CLAW PAY
                    </div>

                    {/* Trophy */}
                    <div style={{
                        fontSize: '4rem',
                        marginBottom: '15px',
                        filter: 'drop-shadow(0 4px 8px rgba(245, 158, 11, 0.4))'
                    }}>
                        🏆
                    </div>

                    {/* Winner */}
                    <div style={{
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        color: '#fcd34d',
                        marginBottom: '5px',
                        fontFamily: "'Fredoka', sans-serif"
                    }}>
                        LOTTERY WINNER
                    </div>

                    {/* Username */}
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: 'white',
                        marginBottom: '25px'
                    }}>
                        @{lottery.winner.username}
                    </div>

                    {/* Prize Amount */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%)',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            color: 'rgba(0,0,0,0.6)',
                            marginBottom: '5px'
                        }}>
                            PRIZE WON
                        </div>
                        <div style={{
                            fontSize: '3rem',
                            fontWeight: '900',
                            color: '#0f172a',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>
                            ${lottery.prizeAmount}
                        </div>
                        <div style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: 'rgba(0,0,0,0.7)'
                        }}>
                            USDC
                        </div>
                    </div>

                    {/* Transaction proof */}
                    {lottery.claimTxSignature && (
                        <div style={{
                            fontSize: '0.7rem',
                            color: '#64748b',
                            marginBottom: '10px'
                        }}>
                            <span style={{ opacity: 0.7 }}>Tx: </span>
                            <a
                                href={`https://solscan.io/tx/${lottery.claimTxSignature}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#3b82f6', textDecoration: 'none' }}
                            >
                                {lottery.claimTxSignature.slice(0, 8)}...{lottery.claimTxSignature.slice(-8)}
                            </a>
                        </div>
                    )}

                    {/* Date */}
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#64748b'
                    }}>
                        {claimedDate}
                    </div>
                </div>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '20px',
                    padding: '0 15px'
                }}>
                    <button
                        onClick={handleShareOnX}
                        disabled={isSharing}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '14px' }}
                    >
                        {isSharing ? '⏳' : '🐦'} Share on X
                    </button>
                    <button
                        onClick={handleDownload}
                        className="btn"
                        style={{ flex: 1, padding: '14px' }}
                    >
                        📸 Save Image
                    </button>
                </div>

                {/* Close */}
                <button
                    onClick={onClose}
                    className="btn"
                    style={{ width: '100%', marginTop: '10px', padding: '12px' }}
                >
                    Close
                </button>
            </div>
        </div>
    );
}

export default LotteryWinnerCard;
