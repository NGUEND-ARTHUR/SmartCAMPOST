import { cn } from "@/lib/utils";

type SkeletonLoaderProps = {
  rows?: number;
  className?: string;
};

export function SkeletonLoader({ rows = 4, className }: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-3", className)} aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-14 animate-pulse rounded-md bg-muted"
          style={{ opacity: 1 - index * 0.08 }}
        />
      ))}
    </div>
  );
}

export default SkeletonLoader;
