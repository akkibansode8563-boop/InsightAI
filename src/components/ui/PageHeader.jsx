import { cn } from './cn.js';

export function PageHeader({ icon, title, subtitle, accent = 'var(--primary)', actions, className }) {
  return (
    <div
      className={cn('px-5 py-5 md:px-8 md:py-7 border-b border-[var(--glass-border-strong)] flex-shrink-0', className)}
      style={{ background: `linear-gradient(135deg, ${accent}0d 0%, transparent 60%)` }}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          {icon && (
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl md:text-3xl flex-shrink-0 shadow-sm"
              style={{ background: `${accent}18`, border: `2px solid ${accent}30` }}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1
              className="font-heading font-black text-xl md:text-2xl leading-tight text-[var(--text-primary)] truncate"
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1 leading-relaxed line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
