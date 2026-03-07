import { useEffect, useRef } from "react";

export default function useScanSSE(onEvent: (e: unknown) => void) {
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const es = new EventSource("/api/stream/scans");
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
