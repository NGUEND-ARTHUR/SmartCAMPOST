import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type SkeletonLoaderProps = {
  rows?: number;
  className?: string;
};

export function SkeletonLoader({ rows = 4, className }: SkeletonLoaderProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("space-y-3", className)} aria-label={t("common.loading")}>
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
