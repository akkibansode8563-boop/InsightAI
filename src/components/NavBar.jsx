import { useApp, MODULES } from '../context/AppContext.jsx';

const langLabels = { en: 'EN', mr: 'मर', hi: 'हि' };

export default function NavBar() {
  const {
    activeModule,
    setActiveModule,
    language,
    toggleLanguage,
    theme,
    toggleTheme,
    t,
  } = useApp();

  return (
    <nav
      className="glass-strong"
      style={{
        height: 'var(--navbar-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        flexShrink: 0,
        zIndex: 100,
        position: 'sticky',
        top: 0,
        margin: '12px 16px 0',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* ── Brand Logo ── */}
      <div
        onClick={() => setActiveModule('chat')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, var(--primary), #ea580c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            boxShadow: 'var(--shadow-primary)',
            transform: 'rotate(-2deg)',
            transition: 'var(--transition-bounce)',
          }}
          className="hover-scale"
        >
          🤖
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span
            className="font-heading"
            style={{
              fontWeight: 850,
              fontSize: '1.05em',
              color: 'var(--text-primary)',
              letterSpacing: '-0.04em',
            }}
          >
            InsightAI
          </span>
          <span
            style={{
              fontSize: '0.62em',
              fontWeight: 800,
              color: 'var(--primary)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            v2.0
          </span>
        </div>
      </div>

      {/* ── Nav Tabs ── */}
      <div
        className="custom-scrollbar"
        style={{
          flex: 1,
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 0,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-elevated)',
            padding: 4,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--glass-border-strong)',
            position: 'relative',
          }}
        >
          {MODULES.map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`nav-tab ${isActive ? 'active' : ''}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78em',
                  fontWeight: 700,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-surface)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'var(--transition-smooth)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                }}
                title={t('nav.' + mod.id)}
              >
                <span style={{ fontSize: '1.1em' }}>{mod.icon}</span>
                <span className="nav-label-text">{t('nav.' + mod.id)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Controls ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Language Cycle Button */}
        <button
          onClick={toggleLanguage}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.76em',
            fontWeight: 800,
            cursor: 'pointer',
            border: '1px solid var(--glass-border-strong)',
            color: 'var(--primary)',
            background: 'var(--primary-soft)',
            transition: 'var(--transition-fast)',
            minWidth: 42,
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
          title={`Switch language (current: ${language.toUpperCase()})`}
        >
          {langLabels[language]}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border-strong)',
            cursor: 'pointer',
            fontSize: '1.05em',
            transition: 'var(--transition-smooth)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
          className="hover-scale"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  );
}
