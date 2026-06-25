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
      style={{
        height: 'var(--navbar-height)',
        background: 'var(--glass-bg-strong)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border-strong)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
        flexShrink: 0,
        zIndex: 50,
        position: 'relative',
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginRight: 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
            flexShrink: 0,
          }}
        >
          🤖
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span
            className="font-heading"
            style={{
              fontWeight: 900,
              fontSize: '0.95em',
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}
          >
            InsightAI
          </span>
          <span
            style={{
              fontSize: '0.58em',
              fontWeight: 700,
              color: 'var(--primary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            v2.0
          </span>
        </div>
      </div>

      {/* ── Module Tabs (horizontally scrollable on small screens) ── */}
      <div
        className="custom-scrollbar"
        style={{
          flex: 1,
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          paddingBottom: 0,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className={`nav-tab${activeModule === mod.id ? ' active' : ''}`}
            style={
              activeModule === mod.id
                ? { color: mod.accent, background: `${mod.accent}18` }
                : {}
            }
            title={t('nav.' + mod.id)}
          >
            <span style={{ fontSize: '1em' }}>{mod.icon}</span>
            <span>{t('nav.' + mod.id)}</span>
          </button>
        ))}
      </div>

      {/* ── Right Controls ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
        }}
      >
        {/* Language Cycle Button */}
        <button
          onClick={toggleLanguage}
          className="glass"
          style={{
            padding: '5px 11px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.78em',
            fontWeight: 800,
            cursor: 'pointer',
            border: '1px solid var(--glass-border-strong)',
            color: 'var(--primary)',
            background: 'var(--primary-soft)',
            transition: 'var(--transition-fast)',
            letterSpacing: '0.02em',
            minWidth: 36,
            textAlign: 'center',
          }}
          title={`Switch language (current: ${language.toUpperCase()})`}
        >
          {langLabels[language]}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--glass-border-strong)',
            cursor: 'pointer',
            fontSize: '1em',
            transition: 'var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  );
}
