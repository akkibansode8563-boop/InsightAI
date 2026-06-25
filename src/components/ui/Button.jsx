import { cn } from './cn.js';

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
};

const variantClasses = {
  primary:   'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-[0_4px_14px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] hover:-translate-y-0.5 active:scale-[0.97] border-0',
  secondary: 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--glass-border-strong)] hover:bg-[var(--bg-elevated)] hover:-translate-y-0.5',
  ghost:     'bg-transparent text-[var(--text-secondary)] border border-[var(--glass-border-strong)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
  danger:    'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-[0_4px_12px_rgba(220,38,38,0.25)] hover:shadow-[0_6px_18px_rgba(220,38,38,0.35)] hover:-translate-y-0.5',
  outline:   'bg-transparent text-primary-500 border border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',
  success:   'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.25)] hover:-translate-y-0.5',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  className,
  onClick,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-200',
        'cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        sizeClasses[size],
        variantClasses[variant],
        isDisabled && 'opacity-50 cursor-not-allowed !transform-none !shadow-none pointer-events-none',
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" aria-label="Loading" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
}
