import { useEffect, useRef } from 'react';
import { cn } from './cn.js';

export function Modal({ open, onClose, title, children, size = 'md', footer, className }) {
  const overlayRef = useRef(null);

  // Scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // On mobile (<640px), render as bottom sheet
  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-[200] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog — desktop: centered, mobile: bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          // Mobile: bottom sheet
          'fixed bottom-0 left-0 right-0 z-[201] animate-slide-up rounded-t-3xl',
          // Desktop: centered dialog
          'sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:right-auto sm:rounded-2xl sm:animate-fade-up',
          'bg-[var(--bg-surface)] shadow-2xl w-full',
          sizeMap[size],
          'max-h-[90vh] flex flex-col overflow-hidden',
          className,
        )}
      >
        {/* Handle bar (mobile only) */}
        <div className="sm:hidden">
          <div className="bottom-sheet-handle" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border-strong)] flex-shrink-0">
            <h2 className="font-heading font-bold text-[var(--text-primary)] text-lg">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated-hover)] transition-colors"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--glass-border-strong)] flex-shrink-0 bg-[var(--bg-elevated)] rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
