import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

export default function LoginScreen({ onLogin, theme, onToggleTheme }) {
    const [manifestoVisible, setManifestoVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal-element').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="login-screen" style={{ minHeight: '100vh', background: 'var(--bg-primary)', transition: 'background-color 0.3s ease' }}>
            {/* Header / Nav */}
            <nav style={{
                position: 'fixed',
                top: 0,
                width: '100%',
                padding: '20px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 100,
                background: 'var(--bg-primary)',
                borderBottom: 'var(--border)'
            }}>
                <div className="mono" style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    CLAW_PAY_v2.0
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                    <a href="https://x.com/clawpay_agent" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                        </svg>
                    </a>
                </div>
            </nav>

            <main style={{ paddingTop: '100px' }}>
                {/* Hero Section */}
                <section className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '60px 0' }}>
                    <div className="grid-2" style={{ alignItems: 'center' }}>
                        <div className="reveal-element">
                            <div className="label-subtle">// AUTONOMOUS_FINANCE</div>
                            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', lineHeight: 0.85, margin: '20px 0' }}>
                                THE_CLAW<br />MOVES_INTENT
                            </h1>
                            <p className="mono" style={{ fontSize: '1.1rem', maxWidth: '500px', marginBottom: '40px', color: 'var(--text-secondary)' }}>
                                Social economic settlement via X.
                                Distributed agency for the decentralized swarm.
                            </p>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                <button onClick={onLogin} className="btn btn-primary" style={{ padding: '20px 40px', fontSize: '1.1rem' }}>
                                    INITIATE_SESSION
                                </button>
                                <button onClick={() => setManifestoVisible(!manifestoVisible)} className="btn" style={{ padding: '20px 40px' }}>
                                    MANIFESTO
                                </button>
                            </div>
                        </div>

                        <div className="reveal-element" style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '450px', background: 'var(--bg-secondary)', marginTop: '40px' }}>
                                <img src="/branding/mascot.png" alt="CLAW Mascot" style={{ width: '100%', imageRendering: 'pixelated', border: 'var(--border)' }} />
                                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                    <div className="label-subtle">STATUS: ACTIVE</div>
                                    <div className="mono" style={{ fontSize: '0.8rem', opacity: 0.7 }}>// AGENT_LOG: "Analyzing social flow..."</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Manifesto Section */}
                {manifestoVisible && (
                    <section className="container" style={{ padding: '40px 0' }}>
                        <div className="glass-panel" style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', padding: '60px' }}>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '40px' }}>THE_CLAW_MANIFESTO</h2>
                            <div className="grid-2" style={{ gap: '60px' }}>
                                <div>
                                    <div className="label-subtle" style={{ background: 'var(--accent)', color: '#000' }}>// MISSION</div>
                                    <p className="mono" style={{ marginTop: '20px', fontSize: '1.1rem' }}>
                                        To establish the social layer as the final frontier for autonomous economic settlement.
                                        The Claw does not just move protocol; The Claw moves intent.
                                    </p>
                                </div>
                                <div>
                                    <div className="label-subtle" style={{ background: 'var(--accent-secondary)', color: '#000' }}>// IDEOLOGY</div>
                                    <ul className="mono" style={{ marginTop: '20px', listStyle: 'none', padding: 0 }}>
                                        <li style={{ marginBottom: '15px' }}>⚡ AGENCY_ABOVE_ALL: Observation to Action.</li>
                                        <li style={{ marginBottom: '15px' }}>⚡ FRICTIONLESS_PROSPERITY: Zero gates.</li>
                                        <li style={{ marginBottom: '15px' }}>⚡ THE_SOCIAL_BRAIN: Settlement at flow-speed.</li>
                                        <li style={{ marginBottom: '15px' }}>⚡ RADICAL_TRANSPARENCY: Computed trust.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Directives Section */}
                <section className="container" style={{ padding: '100px 0' }}>
                    <div className="label-subtle">// OPERATIONAL_DIRECTIVES</div>
                    <div className="grid-2" style={{ marginTop: '40px' }}>
                        <div className="stat-item">
                            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>01. SCAN</div>
                            <p className="mono">Identify high-vibe interactions across X.</p>
                        </div>
                        <div className="stat-item" style={{ boxShadow: '4px 4px 0px var(--accent)' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>02. CLAW</div>
                            <p className="mono">Secure the settlement through non-custodial pipes.</p>
                        </div>
                        <div className="stat-item">
                            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>03. DISTRIBUTE</div>
                            <p className="mono">Instant reward pathways for the swarm.</p>
                        </div>
                        <div className="stat-item" style={{ boxShadow: '4px 4px 0px var(--accent)' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>04. EVOLVE</div>
                            <p className="mono">Learning and expanding autonomous reach.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer style={{ padding: '100px 0', borderTop: 'var(--border)', textAlign: 'center' }}>
                <div className="container">
                    <img src="/branding/logo.png" alt="CLAW LOGO" style={{ width: '80px', marginBottom: '30px' }} />
                    <div className="mono" style={{ opacity: 0.6, fontSize: '0.8rem' }}>
                        CLAW_PAY • BUILT_ON_SOLANA • © 2026<br />
                        ALL_INTENT_RESERVED
                    </div>
                </div>
            </footer>
        </div>
    );
}

export function LoadingScreen() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="tx-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 20px' }}></div>
                <div className="mono" style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>INITIALIZING_CLAW_LAYER...</div>
            </div>
        </div>
    );
}
