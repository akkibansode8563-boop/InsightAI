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
    xp,
    level,
  } = useApp();

  return (
    <nav
      className="glass-strong sticky top-0 z-50 mx-3 mt-3 rounded-xl md:mx-4 md:mt-3"
      style={{ height: 'var(--navbar-height)' }}
    >
      <div className="flex items-center h-full px-3 md:px-5 gap-3">

        {/* ── Brand Logo ── */}
        <button
          onClick={() => setActiveModule('chat')}
          className="flex items-center gap-3 flex-shrink-0 cursor-pointer select-none hover:opacity-90 transition-opacity min-h-touch"
          aria-label="Go to home"
        >
          {/* DCC Logo image */}
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-sm border border-[var(--glass-border-strong)] flex-shrink-0">
            <img
              src="/dcc-logo.png"
              alt="DCC Logo"
              className="w-7 h-7 object-contain"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-heading font-black text-base text-[var(--text-primary)] tracking-tight">
              InsightAI
            </span>
            <span className="text-[9px] font-bold text-[var(--primary)] tracking-widest uppercase">
              by DCC · v2.0
            </span>
          </div>
        </button>

        {/* ── Gamified Level/XP Indicator (Desktop & Tablet) ── */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg border border-[var(--glass-border-strong)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] select-none">
          <span className="text-xs font-black text-[var(--primary)]" style={{ background: 'var(--primary-soft)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
            Lvl {level}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] leading-none">
              XP PROGRESS
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 rounded-full bg-[var(--glass-border-strong)] overflow-hidden">
                <div 
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${(xp % 500) / 5}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-[var(--text-primary)]">
                {xp % 500}/500
              </span>
            </div>
          </div>
        </div>

        {/* ── Nav Tabs (Desktop only — hidden on mobile) ── */}
        <div className="hidden md:flex flex-1 justify-center overflow-x-auto scrollbar-hide">
          <div
            className="flex gap-1 p-1 rounded-xl border border-[var(--glass-border-strong)]"
            style={{ background: 'var(--bg-elevated)' }}
          >
            {MODULES.map((mod) => {
              const isActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                    transition-all duration-200 border
                    ${isActive
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border-[var(--glass-border-strong)]'
                      : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  title={t('nav.' + mod.id)}
                >
                  <span className="text-sm">{mod.icon}</span>
                  <span className="nav-label-text hidden lg:inline">{t('nav.' + mod.id)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── App icon (mobile center) ── */}
        <div className="flex md:hidden flex-1 justify-center">
          <div className="flex items-center gap-2">
            <img src="/icon/icon-72x72.png" alt="InsightAI" className="w-7 h-7 rounded-lg" />
            <span className="font-heading font-black text-sm text-[var(--text-primary)]">InsightAI</span>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Language Cycle Button */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-lg text-xs font-black cursor-pointer border border-[var(--glass-border-strong)] text-[var(--primary)] transition-all duration-150 hover:bg-[var(--primary-soft)] min-h-touch min-w-touch flex items-center justify-center"
            style={{ background: 'var(--primary-soft)' }}
            title={`Switch language (current: ${language.toUpperCase()})`}
            aria-label={`Current language: ${language}`}
          >
            {langLabels[language]}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all duration-200 hover:scale-110 border border-[var(--glass-border-strong)] hover:bg-[var(--bg-elevated)] min-h-touch min-w-touch"
            style={{ background: 'var(--bg-surface)' }}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label={theme === 'light' ? 'Enable dark mode' : 'Enable light mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  );
}
