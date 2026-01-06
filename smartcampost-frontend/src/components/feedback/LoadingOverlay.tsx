import { Spinner } from "../ui/Spinner";

interface Props {
  message?: string;
}

export function LoadingOverlay({ message }: Props) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-700">
        <Spinner />
        <span className="text-xs text-slate-100">
          {message ?? "Loading..."}
        </span>
      </div>
    </div>
  );
}


