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
      ? "border border-gray-200 bg-white text-gray-800"
      : variant === "ghost"
        ? "bg-transparent text-gray-700"
        : variant === "secondary"
          ? "bg-secondary text-white"
          : "bg-gray-100 text-gray-800";
  return <span className={`${base} ${vclass} ${className}`}>{children}</span>;
}

export default Badge;
