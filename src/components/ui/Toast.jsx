import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { cn } from './cn.js';

// ── Toast Context ──────────────────────────────────────────────────
const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ── Toast Icons ────────────────────────────────────────────────────
const icons = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const colors = {
  success: { border: '#059669', bg: 'rgba(5,150,105,0.08)',  text: '#059669' },
  error:   { border: '#dc2626', bg: 'rgba(220,38,38,0.08)',  text: '#dc2626' },
  warning: { border: '#d97706', bg: 'rgba(217,119,6,0.08)',  text: '#d97706' },
  info:    { border: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', text: '#0ea5e9' },
};

// ── Single Toast Item ──────────────────────────────────────────────
function ToastItem({ id, message, type = 'info', onDismiss, action }) {
  const [exiting, setExiting] = useState(false);
  const c = colors[type];

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 200);
  }, [id, onDismiss]);

  useEffect(() => {
    const timer = setTimeout(dismiss, 4000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <div
      className={cn('toast-item', exiting && 'opacity-0 translate-x-4 transition-all duration-200')}
      style={{ borderLeftWidth: 3, borderLeftColor: c.border, background: `var(--bg-surface)` }}
      role="alert"
      aria-live="polite"
    >
      <span style={{ fontSize: '1.1em', flexShrink: 0 }}>{icons[type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--text-primary)] font-medium leading-snug">{message}</p>
        {action && (
          <button
            onClick={() => { action.onClick(); dismiss(); }}
            className="text-xs mt-1 underline font-semibold"
            style={{ color: c.text }}
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={dismiss}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg leading-none flex-shrink-0 transition-colors"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

// ── Toast Provider ─────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', action) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type, action }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toast: showToast }}>
      {children}
      <div className="toast-container" aria-label="Notifications">
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
