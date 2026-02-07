import '../index.css';
import { useState, useEffect } from 'react';

// Scrolling Payment Ticker - shows recent payment usernames
export function PaymentTicker({ payments }) {
    if (!payments || payments.length === 0) return null;

    // Get unique recent senders/recipients for the ticker
    const recentUsers = [...new Set(
        payments.slice(0, 20).flatMap(p => [
            p.sender_username ? `@${p.sender_username}` : null,
            p.recipient_username ? `@${p.recipient_username}` : null
        ]).filter(Boolean)
    )].slice(0, 15);

    if (recentUsers.length === 0) return null;

    // Double the items for seamless loop
    const tickerItems = [...recentUsers, ...recentUsers];

    return (
        <div className="ticker-container" style={{
            overflow: 'hidden',
            background: 'var(--bg-inset)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '8px 0',
            marginBottom: '20px'
        }}>
            <div className="ticker-content" style={{
                display: 'flex',
                animation: 'scroll 30s linear infinite',
                whiteSpace: 'nowrap'
            }}>
                {tickerItems.map((user, i) => (
                    <span key={i} style={{
                        display: 'inline-block',
                        padding: '0 30px',
                        color: i % 2 === 0 ? 'var(--glow)' : 'var(--accent-gold)',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.8rem',
                        fontWeight: '600'
                    }}>
                        {user} ⚡
                    </span>
                ))}
            </div>
            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}

export function ScanCountdown() {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();

            // Bot scans at :20 and :50 each hour (20 and 50 min marks)
            // Find the next scan time
            let nextScanMinute;
            if (minutes < 20) {
                nextScanMinute = 20;
            } else if (minutes < 50) {
                nextScanMinute = 50;
            } else {
                nextScanMinute = 80; // Next hour's :20
            }

            const minutesLeft = nextScanMinute - minutes - 1;
            const secondsLeft = 60 - seconds;

            if (minutesLeft < 0) {
                setTimeLeft('0:00');
            } else {
                setTimeLeft(`${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-panel scan-countdown" style={{
            padding: '20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div>
                <div className="mono label-subtle" style={{ fontSize: '0.6rem', marginBottom: '4px' }}>
                    // NEXT_PAYMENT_SCAN
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Scanned every 30 minutes
                </div>
            </div>
            <div className="mono" style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--accent)',
            }}>
                ⏱️ {timeLeft}
            </div>
        </div>
    );
}

export function StatsCard({ userStats }) {
    // Safe defaults for Firebase stats
    const sent = userStats?.totalSent || 0;
    const claimed = userStats?.totalClaimed || 0;
    const points = userStats?.points || 0;

    return (
        <div className="glass-panel" style={{ padding: '30px', marginBottom: '20px' }}>
            <div className="mono label-subtle" style={{ marginBottom: '20px' }}>// YOUR_STATS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="inset-panel" style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="mono label-subtle" style={{ fontSize: '0.55rem', marginBottom: '8px' }}>SENT</div>
                    <div className="mono" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--error)' }}>
                        ${sent.toFixed(2)}
                    </div>
                </div>
                <div className="inset-panel" style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="mono label-subtle" style={{ fontSize: '0.55rem', marginBottom: '8px' }}>CLAIMED</div>
                    <div className="mono" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                        ${claimed.toFixed(2)}
                    </div>
                </div>
                <div className="inset-panel" style={{ textAlign: 'center', padding: '20px' }}>
                    <div className="mono label-subtle" style={{ fontSize: '0.55rem', marginBottom: '8px' }}>POINTS</div>
                    <div className="mono" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>
                        {points.toFixed(0)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function HowToPayCard() {
    return (
        <div className="glass-panel howto-card" style={{ padding: '30px', marginBottom: '20px' }}>
            <div className="mono label-subtle" style={{ marginBottom: '20px' }}>// HOW_TO_PAY</div>
            <div className="inset-panel" style={{ textAlign: 'center', padding: '20px', marginBottom: '15px' }}>
                <span className="mono" style={{ fontSize: '1rem' }}>
                    <span style={{ color: 'var(--accent-secondary)' }}>@bot_claw</span>
                    <span style={{ color: 'var(--text-muted)' }}> send </span>
                    <span style={{ color: 'var(--accent)' }}>@friend</span>
                    <span style={{ color: 'var(--success)' }}> $5</span>
                </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
                Post on X with the format above to send USDC.
            </p>
        </div>
    );
}

export function Footer({ onShowTerms }) {
    return (
        <div style={{ textAlign: 'center', padding: '30px', color: '#444' }}>
            <div className="mono" style={{ fontSize: '0.65rem', marginBottom: '15px' }}>
                © 2026 Claw Pay • BUILT ON SOLANA
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                @bot_claw
                <span style={{ color: 'var(--text-primary)' }}>•</span>
                <button
                    onClick={onShowTerms}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace"
                    }}
                >
                    Terms & Conditions
                </button>
            </div>
        </div>
    );
}

// Terms and Conditions Modal
export function TermsModal({ show, onClose }) {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-plate" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="engraved" style={{ marginBottom: '20px' }}>// TERMS_AND_CONDITIONS</div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.8, fontFamily: "'JetBrains Mono', monospace" }}>
                        <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: 'var(--glow)', marginBottom: '10px', fontWeight: 600 }}>1. Service Description</h3>
                        <p>Claw Pay is a non-custodial social payment service built on Solana. Users maintain full control of their wallets and funds at all times.</p>

                        <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: 'var(--glow)', marginTop: '20px', marginBottom: '10px', fontWeight: 600 }}>2. No Financial Advice</h3>
                        <p>This service does not provide financial, investment, or legal advice. Users are responsible for their own financial decisions.</p>

                        <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: 'var(--glow)', marginTop: '20px', marginBottom: '10px', fontWeight: 600 }}>3. Risk Acknowledgment</h3>
                        <p>Cryptocurrency transactions are irreversible. Users acknowledge the risks associated with blockchain transactions including but not limited to: network fees, transaction failures, and price volatility.</p>

                        <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: 'var(--glow)', marginTop: '20px', marginBottom: '10px', fontWeight: 600 }}>4. User Responsibility</h3>
                        <p>Users are responsible for:</p>
                        <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                            <li>Securing their wallet credentials</li>
                            <li>Ensuring sufficient funds for transactions</li>
                            <li>Verifying recipient addresses before sending</li>
                        </ul>

                        <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: 'var(--glow)', marginTop: '20px', marginBottom: '10px', fontWeight: 600 }}>5. Service Availability</h3>
                        <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. Payment scanning occurs every 30 minutes.</p>

                        <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: 'var(--glow)', marginTop: '20px', marginBottom: '10px', fontWeight: 600 }}>6. Privacy</h3>
                        <p>We only store X usernames and wallet addresses necessary for service operation. Blockchain transactions are public by nature.</p>

                        <h3 style={{ fontFamily: "'Fredoka', sans-serif", color: 'var(--glow)', marginTop: '20px', marginBottom: '10px', fontWeight: 600 }}>7. Modifications</h3>
                        <p>We reserve the right to modify these terms at any time. Continued use constitutes acceptance of modified terms.</p>
                    </div>
                </div>

                <button onClick={onClose} className="btn btn-primary" style={{ marginTop: '20px', width: '100%' }}>
                    I UNDERSTAND
                </button>
            </div>
        </div>
    );
}
