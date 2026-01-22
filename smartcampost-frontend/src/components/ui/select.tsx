import * as React from "react";
import { cn } from "@/lib/utils";

type SelectContextType<T = string> = {
  value?: T;
  onValueChange?: ((v: T) => void) | React.Dispatch<React.SetStateAction<T>>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
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

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
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
      onClick={() => ctx?.setOpen?.((v: boolean) => !v)}
      className={cn(
        "w-full rounded-md border px-3 py-2 text-left flex items-center justify-between bg-white",
        className,
      )}
      {...props}
    >
      <span className="text-sm text-muted-foreground">
        {(ctx?.value as unknown as React.ReactNode) ?? placeholder ?? children}
      </span>
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
  return (
    <span className="text-sm text-muted-foreground">
      {(ctx?.value as unknown as React.ReactNode) ?? placeholder}
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
      className={cn(
        "absolute left-0 right-0 z-10 mt-1 rounded-md border bg-white shadow-sm",
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
    ctx?.setOpen?.(false);
  };

  return (
    <div
      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
      onClick={handleClick}
    >
      {children}
    </div>
  );
};
