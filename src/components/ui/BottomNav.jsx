import { useState } from 'react';
import { useApp, MODULES } from '../../context/AppContext.jsx';
import { cn } from './cn.js';

// Modules shown directly in bottom nav
const PRIMARY_TABS = ['chat', 'sales', 'dealer', 'solutions', 'market'];

// Modules in the "More" bottom sheet
const MORE_MODULES = MODULES.filter(m => !PRIMARY_TABS.includes(m.id));

const MODULE_COLORS = {
  chat:       '#f97316',
  sales:      '#8b5cf6',
  dealer:     '#059669',
  enterprise: '#0ea5e9',
  solutions:  '#f59e0b',
  news:       '#ef4444',
  learn:      '#6366f1',
  market:     '#10b981',
};

function MoreSheet({ open, onClose }) {
  const { setActiveModule, activeModule } = useApp();

  if (!open) return null;

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 80px)' }}>
        <div className="bottom-sheet-handle" />
        <div className="px-5 pb-3 pt-1">
          <h3 className="font-heading font-bold text-[var(--text-secondary)] text-sm uppercase tracking-widest mb-4">More Modules</h3>
          <div className="grid grid-cols-3 gap-3">
            {MORE_MODULES.map(mod => {
              const color = MODULE_COLORS[mod.id] || '#f97316';
              const isActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => { setActiveModule(mod.id); onClose(); }}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200',
                    'border active:scale-95',
                    isActive
                      ? 'border-[var(--glass-border-strong)]'
                      : 'border-transparent bg-[var(--bg-elevated)]',
                  )}
                  style={isActive ? { background: `${color}15`, borderColor: `${color}40` } : undefined}
                >
                  <span className="text-2xl">{mod.icon}</span>
                  <span
                    className="text-xs font-semibold leading-none text-center"
                    style={{ color: isActive ? color : 'var(--text-secondary)' }}
                  >
                    {mod.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export function BottomNav() {
  const { activeModule, setActiveModule } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryModules = MODULES.filter(m => PRIMARY_TABS.includes(m.id));

  const isMoreActive = MORE_MODULES.some(m => m.id === activeModule);

  return (
    <>
      {/* Bottom Nav Bar — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '1px solid var(--glass-border-strong)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.08)',
        }}
        aria-label="Bottom navigation"
      >
        <div className="flex items-stretch h-16">
          {/* Primary Tabs */}
          {primaryModules.map(mod => {
            const isActive = activeModule === mod.id;
            const color = MODULE_COLORS[mod.id] || '#f97316';
            return (
              <button
                key={mod.id}
                onClick={() => { setActiveModule(mod.id); setMoreOpen(false); }}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200 active:scale-90"
                aria-label={mod.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full transition-all duration-300"
                    style={{ background: color }}
                  />
                )}
                {/* Icon with background pill when active */}
                <span
                  className={cn(
                    'text-xl transition-all duration-200 rounded-xl px-2.5 py-1',
                    isActive && 'scale-110',
                  )}
                  style={isActive ? { background: `${color}18` } : undefined}
                >
                  {mod.icon}
                </span>
                <span
                  className="text-[9px] font-bold leading-none tracking-tight"
                  style={{ color: isActive ? color : 'var(--text-muted)' }}
                >
                  {mod.label.length > 7 ? mod.label.slice(0, 6) + '…' : mod.label}
                </span>
              </button>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setMoreOpen(prev => !prev)}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200 active:scale-90"
            aria-label="More modules"
            aria-expanded={moreOpen}
          >
            {isMoreActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary-500"
              />
            )}
            <span
              className={cn(
                'text-xl transition-all duration-200 rounded-xl px-2.5 py-1',
                (moreOpen || isMoreActive) && 'scale-110 bg-primary-500/15',
              )}
            >
              {isMoreActive
                ? MORE_MODULES.find(m => m.id === activeModule)?.icon || '⋯'
                : '⋯'}
            </span>
            <span
              className="text-[9px] font-bold leading-none tracking-tight"
              style={{ color: (moreOpen || isMoreActive) ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
