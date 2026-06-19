import { AlertTriangle } from "lucide-react";

type ErrorBannerProps = {
  title?: string;
  message: string;
};

export function ErrorBanner({ title = "Something went wrong", message }: ErrorBannerProps) {
  return (
    <div className="flex gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <div className="font-semibold">{title}</div>
        <div className="mt-1 text-destructive/90">{message}</div>
      </div>
    </div>
  );
}

export default ErrorBanner;
