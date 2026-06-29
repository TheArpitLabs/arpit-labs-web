import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/utils";

// Simple spinner for inline loading
export function Spinner({ className, size = "default" }: { className?: string; size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
  );
}

// Full page loading state
export function FullPageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted">{message}</p>
      </div>
    </div>
  );
}

// Card skeleton loader
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90 animate-pulse"
        >
          <div className="h-6 bg-muted/30 rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted/30 rounded w-full mb-2" />
          <div className="h-4 bg-muted/30 rounded w-2/3" />
        </div>
      ))}
    </>
  );
}

// Table skeleton loader
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border border-border/70 rounded-lg animate-pulse">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 bg-muted/30 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// List skeleton loader
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-border/70 rounded-lg animate-pulse">
          <div className="w-12 h-12 bg-muted/30 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted/30 rounded w-3/4" />
            <div className="h-3 bg-muted/30 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Button loading state wrapper
export function ButtonLoading({ 
  children, 
  isLoading, 
  className 
}: { 
  children: React.ReactNode; 
  isLoading: boolean; 
  className?: string;
}) {
  return (
    <button
      disabled={isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

// Generic content loader with fallback
export function ContentLoader<T>({
  isLoading,
  error,
  data,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
}: {
  isLoading: boolean;
  error?: Error | null;
  data?: T | null;
  children: (data: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}) {
  if (isLoading) {
    return loadingComponent || <FullPageLoading />;
  }

  if (error) {
    return (
      errorComponent || (
        <div className="p-8 text-center">
          <p className="text-destructive">Error: {error.message}</p>
        </div>
      )
    );
  }

  if (!data) {
    return (
      emptyComponent || (
        <div className="p-8 text-center">
          <p className="text-muted">No data available</p>
        </div>
      )
    );
  }

  return <>{children(data)}</>;
}
