import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ 
  className, 
  variant = "rectangular",
  ...props 
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-secondary/50",
        variant === "text" && "h-4 w-full rounded-md",
        variant === "circular" && "h-12 w-12 rounded-full",
        variant === "rectangular" && "h-48 w-full rounded-xl",
        className
      )}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="bg-secondary/30 h-10 border-b border-border flex items-center px-4 gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 border-b border-border last:border-0 flex items-center px-4 gap-4">
             {Array.from({ length: cols }).map((_, j) => (
               <Skeleton key={j} className="h-4 flex-1" />
             ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-border rounded-xl p-4 space-y-4 bg-surface shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
         <Skeleton className="h-8 w-20" />
         <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
