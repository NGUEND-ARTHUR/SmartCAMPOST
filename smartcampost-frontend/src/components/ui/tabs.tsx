import * as React from "react";
import { cn } from "@/lib/utils";

export const Tabs = ({
  children,
  value,
  onValueChange,
  className,
  ...props
}: React.PropsWithChildren<{ className?: string }>) => (
  <div className={cn(className)} {...props}>
    {children}
  </div>
);

export const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex space-x-2", className)}>{children}</div>
);

export const TabsTrigger = ({ children, value, onClick, className }: { children: React.ReactNode; value?: string; onClick?: () => void; className?: string }) => (
  <button
    type="button"
    onClick={() => onClick?.(value)}
    className={cn("px-3 py-2 rounded-md border", className)}
  >
    {children}
  </button>
);

export const TabsContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(className)}>{children}</div>
);

// Components exported via named declarations above; no additional export list.
