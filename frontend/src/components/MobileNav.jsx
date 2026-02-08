import { useState, useEffect, useRef } from 'react';
import { Home, User, Ticket, FileText, Compass, Crown } from 'lucide-react';
import '../index.css';

const baseNavItems = [
    { id: 'home', icon: Home, label: 'HOME' },
    { id: 'bounties', icon: FileText, label: 'BOUNTIES' },
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
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const navRef = useRef(null);
    const itemRefs = useRef({});

    // Sync external active state
    useEffect(() => {
        setActive(activeItem);
    }, [activeItem]);

    // Calculate indicator position
    useEffect(() => {
        const activeRef = itemRefs.current[active];
        if (activeRef && navRef.current) {
            const navRect = navRef.current.getBoundingClientRect();
            const itemRect = activeRef.getBoundingClientRect();
            setIndicatorStyle({
                left: `${itemRect.left - navRect.left + itemRect.width / 2 - 20}px`,
                width: '40px'
            });
        }
    }, [active, navItems.length]);

    const handleClick = (id) => {
        setActive(id);
        if (onNavigate) onNavigate(id);
    };

    return (
        <nav
            ref={navRef}
            className="mobile-bottom-nav"
        >
            {/* Sliding indicator pill */}
            <div className="mobile-nav-indicator" style={indicatorStyle} />

            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;

                return (
                    <button
                        key={item.id}
                        ref={el => itemRefs.current[item.id] = el}
                        onClick={() => handleClick(item.id)}
                        className={`mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}
                    >
                        <div className={`mobile-nav-icon ${isActive ? 'mobile-nav-icon-active' : ''}`}>
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                        </div>
                        <span className={`mobile-nav-label ${isActive ? 'mobile-nav-label-active' : ''}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}

export default MobileNav;
