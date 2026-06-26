import * as React from "react";

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  CREATED: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", dot: "bg-slate-500" },
  ACCEPTED: { bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  TAKEN_IN_CHARGE: { bg: "bg-violet-50 dark:bg-violet-950", text: "text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  IN_TRANSIT: { bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  ARRIVED_HUB: { bg: "bg-cyan-50 dark:bg-cyan-950", text: "text-cyan-700 dark:text-cyan-300", dot: "bg-cyan-500" },
  ARRIVED_DEST_AGENCY: { bg: "bg-teal-50 dark:bg-teal-950", text: "text-teal-700 dark:text-teal-300", dot: "bg-teal-500" },
  OUT_FOR_DELIVERY: { bg: "bg-orange-50 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  DELIVERED: { bg: "bg-green-50 dark:bg-green-950", text: "text-green-700 dark:text-green-300", dot: "bg-green-500" },
  PICKED_UP_AT_AGENCY: { bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  RETURNED: { bg: "bg-red-50 dark:bg-red-950", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
  RETURNED_TO_SENDER: { bg: "bg-red-50 dark:bg-red-950", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
  CANCELLED: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },

  REQUESTED: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", dot: "bg-slate-500" },
  ASSIGNED: { bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  COMPLETED: { bg: "bg-green-50 dark:bg-green-950", text: "text-green-700 dark:text-green-300", dot: "bg-green-500" },

  OPEN: { bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  IN_PROGRESS: { bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  RESOLVED: { bg: "bg-green-50 dark:bg-green-950", text: "text-green-700 dark:text-green-300", dot: "bg-green-500" },
  CLOSED: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },

  SUCCESS: { bg: "bg-green-50 dark:bg-green-950", text: "text-green-700 dark:text-green-300", dot: "bg-green-500" },
  FAILED: { bg: "bg-red-50 dark:bg-red-950", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
  PENDING: { bg: "bg-amber-50 dark:bg-amber-950", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
};

const fallback = { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" };

export const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status] ?? fallback;
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${config.bg} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
};

export default StatusBadge;
