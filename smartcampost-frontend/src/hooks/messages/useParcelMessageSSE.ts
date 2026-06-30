import { useEffect, useRef } from "react";
import type { ParcelMessage } from "@/services";

function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.token || parsed?.token || null;
    }
  } catch (error) {
    console.warn("Failed to read auth token for parcel-message SSE", error);
  }
  return null;
}

function getSseBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  if (!raw) return "http://localhost:8080/api";
  const trimmed = raw.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export default function useParcelMessageSSE(
  parcelId: string | undefined,
  onMessage: (message: ParcelMessage) => void,
) {
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    if (!parcelId) return;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const token = getAuthToken();
      const base = getSseBaseUrl();
      const url = token
        ? `${base}/stream/parcels/${encodeURIComponent(parcelId)}/messages?token=${encodeURIComponent(token)}`
        : `${base}/stream/parcels/${encodeURIComponent(parcelId)}/messages`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        retryRef.current = 0;
      };

      es.addEventListener("parcel-message", (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data) as ParcelMessage;
          onMessage(data);
        } catch (e) {
          console.warn("bad sse parcel-message data", e);
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
  }, [parcelId, onMessage]);
}
