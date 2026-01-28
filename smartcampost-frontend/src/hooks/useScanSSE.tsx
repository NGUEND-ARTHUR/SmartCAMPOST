import { useEffect, useRef } from "react";

export default function useScanSSE(onEvent: (e: any) => void) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/stream/scans");
    esRef.current = es;
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onEvent(data);
      } catch (e) {
        console.warn("bad sse data", e);
      }
    };
    es.addEventListener("scan-event", (ev: any) => {
      try {
        const data = JSON.parse(ev.data);
        onEvent(data);
      } catch (e) {
        console.warn("bad sse scan-event", e);
      }
    });
    es.onerror = (err) => {
      console.warn("SSE error", err);
      es.close();
    };
    return () => {
      if (es) es.close();
    };
  }, [onEvent]);
}
