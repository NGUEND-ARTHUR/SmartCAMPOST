import * as React from "react";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
};

export function Badge({
  children,
  className = "",
  variant = "default",
}: BadgeProps) {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  const vclass =
    variant === "outline"
      ? "border border-border bg-background text-foreground"
      : variant === "ghost"
        ? "bg-transparent text-muted-foreground"
        : variant === "secondary"
          ? "bg-secondary text-white"
          : "bg-muted text-muted-foreground";
  return <span className={`${base} ${vclass} ${className}`}>{children}</span>;
}

export default Badge;
