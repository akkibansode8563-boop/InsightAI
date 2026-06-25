import { cn } from './cn.js';

// Card Container
export function Card({ children, className, accent, hover = true, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[var(--bg-surface)] border border-[var(--glass-border-strong)] rounded-2xl shadow-sm',
        'transition-all duration-300 relative overflow-hidden',
        hover && 'hover:-translate-y-1 hover:shadow-md hover:border-primary-500/20 cursor-pointer',
        accent && `border-l-4`,
        className,
      )}
      style={accent ? { borderLeftColor: accent } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header
export function CardHeader({ children, className, icon, title, subtitle, accent, actions, ...props }) {
  return (
    <div
      className={cn('flex items-start gap-3 p-5 border-b border-[var(--glass-border-strong)]', className)}
      style={accent ? { background: `linear-gradient(135deg, ${accent}10 0%, transparent 70%)` } : undefined}
      {...props}
    >
      {icon && (
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
          style={accent ? { background: `${accent}18`, border: `2px solid ${accent}30` } : { background: 'var(--bg-elevated)' }}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="font-heading font-bold text-[var(--text-primary)] leading-tight truncate">{title}</h3>
        )}
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{subtitle}</p>
        )}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

// Card Body
export function CardBody({ children, className, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

// Card Footer
export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-5 py-3.5 border-t border-[var(--glass-border-strong)] bg-[var(--bg-elevated)] rounded-b-2xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
