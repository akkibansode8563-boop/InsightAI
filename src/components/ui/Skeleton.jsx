import { cn } from './cn.js';

export function Skeleton({ className, width, height, circle = false }) {
  return (
    <div
      className={cn('skeleton', circle && 'rounded-full', !circle && 'rounded-lg', className)}
      style={{ width, height: height || '1em' }}
      aria-busy="true"
      aria-label="Loading"
    />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card-premium p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton circle width={44} height={44} />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="60%" />
          <Skeleton height={12} width="40%" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={13} width={i === lines - 1 ? '70%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 2 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? '65%' : '100%'} />
      ))}
    </div>
  );
}
