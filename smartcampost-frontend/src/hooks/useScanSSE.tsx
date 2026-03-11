import { useEffect, useRef } from "react";

function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.token || parsed?.token || null;
    }
  } catch { /* ignore */ }
  return null;
}

function getSseBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (!raw) return "http://localhost:8080/api";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export default function useScanSSE(onEvent: (e: unknown) => void) {
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const token = getAuthToken();
      const base = getSseBaseUrl();
      const url = token
        ? `${base}/stream/scans?token=${encodeURIComponent(token)}`
        : `${base}/stream/scans`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        retryRef.current = 0;
      };

      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          onEvent(data);
        } catch (e) {
          console.warn("bad sse data", e);
        }
      };
      es.addEventListener("scan-event", (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data);
          onEvent(data);
        } catch (e) {
          console.warn("bad sse scan-event", e);
        }
      });
      es.onerror = () => {
        es.close();
        if (cancelled) return;
        const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
        retryRef.current++;
        setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (esRef.current) esRef.current.close();
    };
  }, [onEvent]);
}
