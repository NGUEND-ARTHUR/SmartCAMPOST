import * as React from "react";
import { cn } from "@/lib/utils";

type SelectContextType<T = string> = {
  value?: T;
  onValueChange?: ((v: T) => void) | React.Dispatch<React.SetStateAction<T>>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedLabel?: React.ReactNode;
  setSelectedLabel: React.Dispatch<React.SetStateAction<React.ReactNode>>;
};

const SelectContext = React.createContext<SelectContextType<any> | null>(null);

type SelectProps<T = string> = React.PropsWithChildren<{
  value?: T;
  onValueChange?: (v: T) => void;
  className?: string;
  disabled?: boolean;
}> &
  React.HTMLAttributes<HTMLDivElement>;

export function Select<T = string>({
  children,
  value,
  onValueChange,
  className,
  ...props
}: SelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState<React.ReactNode>();

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        setOpen,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      <div className={cn("inline-block w-full relative", className)} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export const SelectTrigger = ({
  children,
  className,
  placeholder,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  placeholder?: React.ReactNode;
}) => {
  const ctx = React.useContext(SelectContext);

  return (
    <button
      type="button"
      role="combobox"
      aria-expanded={ctx?.open ?? false}
      aria-haspopup="listbox"
      onClick={() => ctx?.setOpen?.((v: boolean) => !v)}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          ctx?.setOpen?.(true);
        }
        if (event.key === "Escape") {
          ctx?.setOpen?.(false);
        }
      }}
      className={cn(
        "w-full rounded-md border border-input px-3 py-2 text-left flex items-center justify-between bg-background",
        className,
      )}
      {...props}
    >
      <span className="text-sm text-foreground">{children ?? placeholder}</span>
      <svg
        className={cn(
          "w-4 h-4 text-muted-foreground",
          ctx?.open && "transform rotate-180",
        )}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
};

export const SelectValue = ({
  placeholder,
}: {
  placeholder?: React.ReactNode;
}) => {
  const ctx = React.useContext(SelectContext);
  const value = ctx?.selectedLabel ?? ctx?.value;
  const hasValue =
    value !== undefined && value !== null && String(value).trim() !== "";
  return (
    <span className={cn("text-sm", hasValue ? "text-foreground" : "text-muted-foreground")}>
      {hasValue ? (value as React.ReactNode) : placeholder}
    </span>
  );
};

export const SelectContent = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  const ctx = React.useContext(SelectContext);
  if (!ctx?.open) return null;

  return (
    <div
      role="listbox"
      className={cn(
        "absolute left-0 right-0 z-50 mt-1 rounded-md border border-border bg-popover text-popover-foreground shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const SelectItem = ({
  value,
  children,
}: React.PropsWithChildren<{ value: string | number }>) => {
  const ctx = React.useContext(SelectContext);
  const handleClick = () => {
    ctx?.onValueChange?.(value);
    ctx?.setSelectedLabel?.(children);
    ctx?.setOpen?.(false);
  };

  return (
    <div
      role="option"
      tabIndex={0}
      aria-selected={ctx?.value === value}
      className="px-3 py-2 cursor-pointer hover:bg-accent"
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      }}
    >
      {children}
    </div>
  );
};
