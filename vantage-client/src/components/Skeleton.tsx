import { } from 'framer-motion';

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
    />
  );
}

function TripCardSkeleton() {
  return (
    <div className="card p-4 md:p-5" style={{ borderRadius: '12px' }}>
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-24 mb-3" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function FeatureCardSkeleton() {
  return (
    <div className="card p-5" style={{ borderRadius: '12px' }}>
      <Skeleton className="h-8 w-8 mb-2" />
      <Skeleton className="h-5 w-24 mb-1" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

function AuthFormSkeleton() {
  return (
    <div className="auth-card p-5 md:p-8">
      <Skeleton className="h-6 w-32 mx-auto mb-2" />
      <Skeleton className="h-4 w-40 mx-auto mb-6" />
      <div className="mb-4">
        <Skeleton className="h-4 w-12 mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="mb-4">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export { Skeleton, TripCardSkeleton, FeatureCardSkeleton, AuthFormSkeleton };