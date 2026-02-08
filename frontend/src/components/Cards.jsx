import '../index.css';
import { useState, useEffect } from 'react';

// Scrolling Payment Ticker - Marquee style
export function PaymentTicker({ payments }) {
    if (!payments || payments.length === 0) return null;

    const recentUsers = [...new Set(
        payments.slice(0, 20).flatMap(p => [
            p.sender_username ? `@${p.sender_username}` : null,
            p.recipient_username ? `@${p.recipient_username}` : null
        ]).filter(Boolean)
    )].slice(0, 15);

    if (recentUsers.length === 0) return null;
    const tickerContent = recentUsers.map(u => u.toUpperCase()).join(' // ') + ' // ';

    return (
        <div className="marquee" style={{ marginBottom: '2rem' }}>
            <div className="marquee-inner">
                {tickerContent}{tickerContent}
            </div>
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
            let nextScanMinute = minutes < 20 ? 20 : (minutes < 50 ? 50 : 80);
            const minutesLeft = nextScanMinute - minutes - 1;
            const secondsLeft = 60 - seconds;
            setTimeLeft(minutesLeft < 0 ? '0:00' : `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`);
        };
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="status-box" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
                <span className="mono" style={{ fontSize: '0.7rem' }}>// NEXT_SCAN</span>
                <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>AGENT_SCANNING_X_INTERVAL</div>
            </div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                {timeLeft}
            </div>
        </div>
    );
}

export function StatsCard({ userStats }) {
    return (
        <div style={{ marginBottom: '2rem' }}>
            <p className="mono" style={{ marginBottom: '1rem' }}>// USER_STATS_SNAPSHOT</p>
            <div className="stats-grid">
                <div className="stat-item">
                    <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>CLAIMED</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.5rem' }}>
                        ${(userStats?.totalClaimed || 0).toFixed(2)}
                    </div>
                </div>
                <div className="stat-item">
                    <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>POINTS</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.5rem' }}>
                        {(userStats?.points || 0).toFixed(0)}
                    </div>
                </div>
                <div className="stat-item">
                    <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>REPUTATION</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--phosphor)', marginTop: '0.5rem' }}>
                        {userStats?.reputation || '--'}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function HowToPayCard() {
    return (
        <div style={{ marginBottom: '2rem' }}>
            <p className="mono" style={{ marginBottom: '1rem' }}>// COMMAND_GUIDE</p>
            <div className="terminal-window" style={{ height: 'auto' }}>
                <div className="terminal-header">
                    <span>SYNTAX</span>
                    <span>X_POST</span>
                </div>
                <div className="terminal-body" style={{ padding: '1rem' }}>
                    <code style={{ fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--hazard)' }}>@clawpay_agent</span> send <span style={{ color: 'var(--text-main)' }}>@username</span> $10
                    </code>
                </div>
            </div>
            <p style={{ fontSize: '0.7rem', marginTop: '0.75rem', color: 'var(--text-muted)' }}>
                POST THIS COMMAND ON X TO TRIGGER THE SETTLEMENT ENGINE.
            </p>
        </div>
    );
}

export function Footer({ onShowTerms }) {
    return (
        <footer style={{ padding: '4rem 2rem', borderTop: '1px solid #222', marginTop: '4rem' }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <p className="mono" style={{ marginBottom: '0.5rem' }}>CLAW_PAY // THE_ECONOMIC_LAYER_FOR_AGENTS</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Powered by Solana & Neural Discovery Engine v4.0.1</p>
                </div>
                <div className="mono" style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                    <a href="https://x.com/clawpay_agent" style={{ color: 'var(--phosphor)', textDecoration: 'none', display: 'block', marginBottom: '0.25rem' }}>X / @CLAWPAY_AGENT</a>
                    <button onClick={onShowTerms} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>TERMS_OF_SERVICE</button>
                </div>
            </div>
        </footer>
    );
}

export function TermsModal({ show, onClose }) {
    if (!show) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="terminal-window" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh' }}>
                <div className="terminal-header">
                    <span>LEGAL_DIRECTIVES</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--hazard)', cursor: 'pointer', fontFamily: 'inherit' }}>CLOSE</button>
                </div>
                <div className="terminal-body" style={{ overflowY: 'auto', color: 'var(--text-main)' }}>
                    <h3 className="mono" style={{ marginBottom: '0.5rem' }}>01. NON-CUSTODIAL</h3>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Claw Pay does not hold your funds. You remain in control of your keys at all times.</p>
                    <h3 className="mono" style={{ marginBottom: '0.5rem' }}>02. RISK_VECTORS</h3>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Blockchain transactions are final. Verify recipient handles carefully.</p>
                    <h3 className="mono" style={{ marginBottom: '0.5rem' }}>03. SETTLEMENT</h3>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Payments are processed every 30 minutes on Solana Mainnet.</p>
                </div>
                <div style={{ padding: '1rem', borderTop: '1px solid #333' }}>
                    <button onClick={onClose} className="btn" style={{ width: '100%' }}>ACKNOWLEDGEMENT_SECURED</button>
                </div>
            </div>
        </div>
    );
}
