import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function ErrorBanner({ children }: Props) {
  return (
    <div className="rounded-md border border-red-900 bg-red-950/60 px-3 py-2 text-xs text-red-200">
      {children}
    </div>
  );
}


