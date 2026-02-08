import '../index.css';
import { useState, useEffect } from 'react';

// Scrolling Payment Ticker
export function PaymentTicker({ payments }) {
    if (!payments || payments.length === 0) return null;

    const recentUsers = [...new Set(
        payments.slice(0, 20).flatMap(p => [
            p.sender_username ? `@${p.sender_username}` : null,
            p.recipient_username ? `@${p.recipient_username}` : null
        ]).filter(Boolean)
    )].slice(0, 15);

    if (recentUsers.length === 0) return null;
    const tickerItems = [...recentUsers, ...recentUsers];

    return (
        <div style={{
            overflow: 'hidden',
            background: 'var(--industrial-cyan)',
            borderBottom: 'var(--border-subtle)',
            padding: '10px 0',
            marginBottom: '30px'
        }}>
            <div style={{
                display: 'flex',
                animation: 'tickerScroll 40s linear infinite',
                whiteSpace: 'nowrap'
            }}>
                {tickerItems.map((user, i) => (
                    <span key={i} className="mono" style={{
                        display: 'inline-block',
                        padding: '0 40px',
                        color: '#000',
                        fontSize: '0.7rem',
                        fontWeight: 700
                    }}>
                        {user.toUpperCase()} ⚡
                    </span>
                ))}
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
        <div className="slab industrial-border" style={{
            marginBottom: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--industrial-cyan)',
            padding: '24px'
        }}>
            <div className="mono">
                <div style={{ fontSize: '0.55rem', color: '#000', fontWeight: 700, marginBottom: '4px' }}>// NEXT_SCAN</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#000' }}>AGENT_SCANNING_X_INTERVAL</div>
            </div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#000' }}>
                {timeLeft}
            </div>
        </div>
    );
}

export function StatsCard({ userStats }) {
    return (
        <div className="slab" style={{ marginBottom: '30px' }}>
            <div className="label-subtle">// USER_STATS_SNAPSHOT</div>
            <div className="stats-grid" style={{ marginTop: '20px' }}>
                <div className="stat-item">
                    <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '8px' }}>CLAIMED</div>
                    <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700 }}>${(userStats?.totalClaimed || 0).toFixed(2)}</div>
                </div>
                <div className="stat-item" style={{ boxShadow: '4px 4px 0px var(--industrial-yellow)' }}>
                    <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: '8px' }}>POINTS</div>
                    <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{(userStats?.points || 0).toFixed(0)}</div>
                </div>
            </div>
        </div>
    );
}

export function HowToPayCard() {
    return (
        <div className="slab" style={{ marginBottom: '30px' }}>
            <div className="label-subtle">// COMMAND_GUIDE</div>
            <div className="inset-panel" style={{ marginTop: '20px', background: '#000', color: 'var(--text-primary)' }}>
                <code className="mono" style={{ fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--industrial-cyan)' }}>@clawpay_agent</span> send <span style={{ color: 'var(--industrial-yellow)' }}>@username</span> $10
                </code>
            </div>
            <p className="mono" style={{ fontSize: '0.65rem', marginTop: '15px', color: 'var(--text-muted)' }}>
                POST THIS COMMAND ON X TO TRIGGER THE SETTLEMENT ENGINE.
            </p>
        </div>
    );
}

export function Footer({ onShowTerms }) {
    return (
        <footer style={{ padding: '60px 0', borderTop: 'var(--border-subtle)', textAlign: 'center', marginTop: '40px' }}>
            <div className="container">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ width: '24px', height: '24px', background: 'var(--industrial-cyan)' }}></div>
                    <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700 }}>CLAW_PAY v2.0</span>
                </div>
                <div className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    SOLANA_MAINNET // © 2026
                </div>
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '30px' }}>
                    <a href="https://x.com/clawpay_agent" className="mono" style={{ fontSize: '0.65rem', color: 'var(--industrial-cyan)', textDecoration: 'none' }}>@CLAWPAY_AGENT</a>
                    <button onClick={onShowTerms} className="mono" style={{ background: 'none', border: 'none', fontSize: '0.65rem', cursor: 'pointer', color: 'var(--text-muted)', textDecoration: 'underline' }}>TERMS_OF_SERVICE</button>
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
            background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="slab industrial-border" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', padding: '40px' }}>
                <div className="label-subtle">// LEGAL_DIRECTIVES</div>
                <div className="mono" style={{ fontSize: '0.75rem', marginTop: '20px', lineHeight: 1.7 }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--industrial-cyan)', marginBottom: '8px' }}>01. NON-CUSTODIAL</h3>
                    <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Claw Pay does not hold your funds. You remain in control of your keys at all times.</p>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--industrial-cyan)', marginBottom: '8px' }}>02. RISK_VECTORS</h3>
                    <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Blockchain transactions are final. Verify recipient handles carefully.</p>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--industrial-cyan)', marginBottom: '8px' }}>03. SETTLEMENT</h3>
                    <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Payments are processed every 30 minutes on Solana Mainnet.</p>
                </div>
                <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', marginTop: '30px' }}>ACKNOWLEDGEMENT_SECURED</button>
            </div>
        </div>
    );
}
