/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
}

export const Tabs = ({
  children,
  value: _value,
  onValueChange: _onValueChange,
  className,
  ...props
}: React.PropsWithChildren<TabsProps>) => (
  <div className={cn(className)} {...props}>
    {children}
  </div>
);

export const TabsList = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("flex space-x-2", className)}>{children}</div>;

export const TabsTrigger = ({
  children,
  value,
  onClick,
  className,
}: {
  children: React.ReactNode;
  value?: string;
  onClick?: (v: string) => void;
  className?: string;
}) => (
  <button
    type="button"
    onClick={() => onClick?.(value as string)}
    className={cn("px-3 py-2 rounded-md border", className)}
  >
    {children}
  </button>
);

export const TabsContent = ({
  children,
  className,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  value?: string;
}) => (
  <div data-tabs-value={value} className={cn(className)}>
    {children}
  </div>
);

// Components exported via named declarations above; no additional export list.
