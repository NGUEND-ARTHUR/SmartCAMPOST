import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  className?: string;
  title?: string;
  "aria-label"?: string;
}

export const Checkbox = ({ checked, onCheckedChange, id, className, title, "aria-label": ariaLabel }: CheckboxProps) => (
  <input
    id={id}
    type="checkbox"
    checked={checked}
    onChange={(e) => onCheckedChange?.(e.target.checked)}
    className={cn("h-4 w-4 rounded border", className)}
    title={title || "Checkbox"}
    aria-label={ariaLabel || title || "Checkbox"}
  />
);

export default Checkbox;
