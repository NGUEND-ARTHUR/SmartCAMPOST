import * as React from "react";
import { cn } from "@/lib/utils";

const SelectContext = React.createContext<any>(null);

export const Select = ({
  children,
  value,
  onValueChange,
  className,
  ...props
}: any) => {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className={cn("inline-block w-full relative", className)} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = ({ children, className, placeholder }: any) => {
  const ctx = React.useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => ctx?.setOpen?.((v: boolean) => !v)}
      className={cn(
        "w-full rounded-md border px-3 py-2 text-left flex items-center justify-between bg-white",
        className,
      )}
    >
      <span className="text-sm text-muted-foreground">
        {ctx?.value || placeholder || children}
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

export const SelectValue = ({ placeholder }: any) => {
  const ctx = React.useContext(SelectContext);
  return (
    <span className="text-sm text-muted-foreground">
      {ctx?.value || placeholder}
    </span>
  );
};

export const SelectContent = ({ children, className }: any) => {
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

export const SelectItem = ({ value, children }: any) => {
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
