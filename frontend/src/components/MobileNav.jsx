import { useState } from 'react';
import { Home, User, Trophy, Crown, Ticket } from 'lucide-react';
import '../index.css';

const baseNavItems = [
    { id: 'home', icon: Home, label: 'HOME' },
    { id: 'leaders', icon: Trophy, label: 'LEADS' },
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
            className="mobile-nav"
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
                boxShadow: '4px 4px 0px var(--text-primary)'
            }}
        >
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => handleClick(item.id)}
                        className="btn"
                        style={{
                            flex: 1,
                            background: isActive ? 'var(--text-primary)' : 'transparent',
                            color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                            padding: '12px 5px',
                            transition: 'all 0.1s ease',
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                        <span className="mono" style={{ fontSize: '0.6rem', fontWeight: 800 }}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}

export default MobileNav;
