import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  disabled?: boolean;
  tooltip?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
};

export function ActionButton({
  children,
  disabled,
  tooltip,
  onClick,
  variant,
}: Props) {
  // Disabled buttons don't reliably show a tooltip/title; wrap in a span.
  return (
    <span className="inline-flex" title={disabled ? tooltip : undefined}>
      <Button
        variant={variant}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        className={disabled ? "pointer-events-none" : undefined}
      >
        {children}
      </Button>
    </span>
  );
}
