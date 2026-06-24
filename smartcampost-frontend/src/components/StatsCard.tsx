import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  subtitle?: string;
  trend?: { value: number; label: string };
  accentColor?: string;
  className?: string;
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  accentColor = "bg-primary",
  className,
}: StatsCardProps) {
  const iconColorClass = accentColor.replace("bg-", "text-");

  return (
    <Card className={cn("relative overflow-hidden transition-all hover:shadow-md", className)}>
      <div className={cn("absolute top-0 left-0 h-1 w-full", accentColor)} />
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight">
              <AnimatedCounter target={value} />
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.value >= 0 ? "text-emerald-600" : "text-red-600",
                )}
              >
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
                <span className="text-muted-foreground font-normal">{trend.label}</span>
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl",
              accentColor.replace("bg-", "bg-") + "/10",
            )}
          >
            <Icon className={cn("h-5 w-5", iconColorClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
