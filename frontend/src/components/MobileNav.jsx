import { useState, useRef, useEffect } from 'react';
import { Home, User, Trophy, Crown, Ticket } from 'lucide-react';
import '../index.css';

const baseNavItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'leaders', icon: Trophy, label: 'Leaders' },
    { id: 'lottery', icon: Ticket, label: 'Lottery' },
    { id: 'profile', icon: User, label: 'Profile' },
];

const adminNavItem = { id: 'admin', icon: Crown, label: 'Admin' };

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
            className="mobile-nav glass-panel"
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                right: '20px',
                borderRadius: '30px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-around',
                zIndex: 1000,
                background: 'var(--glass)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-lg)'
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
                            borderRadius: '100px',
                            padding: '10px',
                            transition: 'var(--transition)',
                            border: 'none',
                            position: 'relative'
                        }}
                    >
                        <Icon size={20} strokeWidth={isActive ? 3 : 2} />
                        {isActive && (
                            <span className="mono" style={{ fontSize: '0.6rem', position: 'absolute', bottom: '-4px', fontWeight: 700 }}>
                                {item.label.toUpperCase()}
                            </span>
                        )}
                    </button>
                );
            })}
        </nav>
    );
}

export default MobileNav;
