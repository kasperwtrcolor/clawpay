import '../index.css';

export function ThemeToggle({ theme, onToggle }) {
    const isDark = theme === 'dark';

    return (
        <button
            className="theme-toggle"
            onClick={onToggle}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            style={{
                border: 'var(--border)',
                background: 'var(--bg-primary)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'var(--transition)',
                boxShadow: '2px 2px 0px var(--text-primary)'
            }}
        >
            <div className="mono" style={{
                fontSize: '0.7rem',
                padding: '4px 10px',
                background: !isDark ? 'var(--text-primary)' : 'transparent',
                color: !isDark ? 'var(--bg-primary)' : 'var(--text-secondary)',
                fontWeight: 800
            }}>LIGHT</div>
            <div className="mono" style={{
                fontSize: '0.7rem',
                padding: '4px 10px',
                background: isDark ? 'var(--text-primary)' : 'transparent',
                color: isDark ? 'var(--bg-primary)' : 'var(--text-secondary)',
                fontWeight: 800
            }}>DARK</div>
        </button>
    );
}

export default ThemeToggle;
