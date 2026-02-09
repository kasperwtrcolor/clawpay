import { useState } from 'react';
import { Home, User, Trophy, Crown, Ticket, Target, Compass } from 'lucide-react';
import '../index.css';

const baseNavItems = [
    { id: 'home', icon: Home, label: 'HOME' },
    { id: 'bounties', icon: Target, label: 'BOUNTY' },
    { id: 'explore', icon: Compass, label: 'EXPLORE' },
    { id: 'lottery', icon: Ticket, label: 'SWARM' },
    { id: 'profile', icon: User, label: 'PROFILE' },
];

const adminNavItem = { id: 'admin', icon: Crown, label: 'ADMIN' };

export function MobileNav({
    activeItem = 'home',
    onNavigate,
    isAdmin = false
}) {
    const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;
    const [active, setActive] = useState(activeItem);

    const handleClick = (id) => {
        setActive(id);
        if (onNavigate) onNavigate(id);
    };

    return (
        <nav
            className="mobile-nav mobile-only"
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                right: '20px',
                padding: '10px',
                display: 'flex',
                justifyContent: 'space-around',
                zIndex: 1000,
                background: 'var(--bg-primary)',
                border: 'var(--border)',
                boxShadow: 'var(--shadow-industrial)'
            }}
        >
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => handleClick(item.id)}
                        style={{
                            flex: 1,
                            background: isActive ? 'var(--phosphor)' : 'transparent',
                            color: isActive ? 'var(--bg)' : 'var(--phosphor)',
                            padding: '12px 5px',
                            transition: 'all 0.1s ease',
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            fontFamily: "'Space Mono', monospace"
                        }}
                    >
                        <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                        <span style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}

export default MobileNav;
