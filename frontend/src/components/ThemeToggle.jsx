import '../index.css';

export function ThemeToggle({ theme, onToggle }) {
    const isDark = theme === 'dark';

    return (
        <button
            className={`theme-toggle-pill ${isDark ? 'dark' : 'light'}`}
            onClick={onToggle}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            role="switch"
            aria-checked={isDark}
            style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-medium)',
                borderRadius: '100px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 1000
            }}
        >
            <div className="mono" style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '100px', background: !isDark ? 'var(--accent)' : 'transparent', color: !isDark ? '#000' : 'var(--text-muted)', fontWeight: 700, transition: 'var(--transition)' }}>LIGHT</div>
            <div className="mono" style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '100px', background: isDark ? 'var(--accent)' : 'transparent', color: isDark ? '#000' : 'var(--text-muted)', fontWeight: 700, transition: 'var(--transition)' }}>DARK</div>
        </button>
    );
}

export default ThemeToggle;
