import { cn } from './cn.js';

const variantStyles = {
  primary: { bg: 'var(--primary-soft)',            color: 'var(--primary)' },
  success: { bg: 'rgba(5,150,105,0.1)',            color: '#059669' },
  warning: { bg: 'rgba(217,119,6,0.1)',            color: '#d97706' },
  danger:  { bg: 'rgba(220,38,38,0.1)',            color: '#dc2626' },
  neutral: { bg: 'var(--bg-elevated)',             color: 'var(--text-secondary)' },
  info:    { bg: 'rgba(14,165,233,0.1)',           color: '#0ea5e9' },
  purple:  { bg: 'rgba(139,92,246,0.1)',           color: '#8b5cf6' },
  emerald: { bg: 'rgba(16,185,129,0.1)',           color: '#10b981' },
};

export function Badge({ children, variant = 'neutral', dot = false, className, style }) {
  const s = variantStyles[variant] || variantStyles.neutral;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase select-none',
        className,
      )}
      style={{ background: s.bg, color: s.color, ...style }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse-soft"
          style={{ background: s.color }}
        />
      )}
      {children}
    </span>
  );
}
