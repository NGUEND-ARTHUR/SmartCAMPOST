import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  baseId: string;
  value: string | undefined;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error("Tabs components must be used within <Tabs>");
  }
  return ctx;
}

interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  className?: string;
}

function toIdSegment(value: string) {
  // keep ids deterministic + valid-ish
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const Tabs = ({
  children,
  value,
  defaultValue,
  onValueChange,
  className,
  ...props
}: React.PropsWithChildren<TabsProps>) => {
  const baseId = React.useId();
  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    defaultValue,
  );

  const isControlled = value != null;
  const currentValue = isControlled ? value : internalValue;

  const handleValueChange = React.useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  return (
    <TabsContext.Provider
      value={{ baseId, value: currentValue, onValueChange: handleValueChange }}
    >
      <div className={cn(className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div role="tablist" className={cn("flex space-x-2", className)}>
    {children}
  </div>
);

export const TabsTrigger = ({
  children,
  value,
  className,
  disabled,
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}) => {
  const ctx = useTabsContext();
  const isActive = ctx.value === value;
  const seg = toIdSegment(value) || "tab";
  const triggerId = `${ctx.baseId}-trigger-${seg}`;
  const panelId = `${ctx.baseId}-content-${seg}`;

  return (
    <button
      type="button"
      id={triggerId}
      disabled={disabled}
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "px-3 py-2 rounded-md border",
        isActive ? "bg-muted" : undefined,
        disabled ? "opacity-50 cursor-not-allowed" : undefined,
        className,
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({
  children,
  className,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  value: string;
}) => {
  const ctx = useTabsContext();
  const seg = toIdSegment(value) || "tab";
  const triggerId = `${ctx.baseId}-trigger-${seg}`;
  const panelId = `${ctx.baseId}-content-${seg}`;
  if (ctx.value !== value) return null;
  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={triggerId}
      className={cn(className)}
    >
      {children}
    </div>
  );
};
