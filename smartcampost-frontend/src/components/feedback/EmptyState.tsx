import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-slate-400">
      <p className="text-sm font-medium text-slate-200">{title}</p>
      {description && (
        <p className="text-xs max-w-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}


