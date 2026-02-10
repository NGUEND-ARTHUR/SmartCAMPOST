import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressProps extends React.ComponentPropsWithoutRef<"progress"> {
  value?: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(100, value));

const Progress = React.forwardRef<HTMLProgressElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const clamped = clamp01(value);

    return (
      <progress
        ref={ref}
        value={clamped}
        max={max}
        className={cn("sc-progress", className)}
        {...props}
      />
    );
  },
);

Progress.displayName = "Progress";

export { Progress };
