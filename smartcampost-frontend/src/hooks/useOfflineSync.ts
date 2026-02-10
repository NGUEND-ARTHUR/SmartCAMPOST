import { useCallback, useEffect, useState } from "react";
import type { OfflineScanEvent, OfflineSyncResult } from "../types";
import { scanEventService } from "../services/parcels/scanEvents.api";

const STORAGE_KEY = "smartcampost_offline_events";

interface UseOfflineSyncResult {
  /** Queued events waiting to be synced */
  queuedEvents: OfflineScanEvent[];
  /** Number of queued events */
  queueCount: number;
  /** Whether device is online */
  isOnline: boolean;
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Last sync result */
  lastSyncResult: OfflineSyncResult | null;
  /** Add event to offline queue */
  queueEvent: (event: OfflineScanEvent) => void;
  /** Manually trigger sync */
  syncNow: () => Promise<OfflineSyncResult | null>;
  /** Clear all queued events */
  clearQueue: () => void;
}

/**
 * Hook for offline scan event queue management.
 * Events are queued when offline and synced when back online.
 */
export function useOfflineSync(): UseOfflineSyncResult {
  const [queuedEvents, setQueuedEvents] = useState<OfflineScanEvent[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] =
    useState<OfflineSyncResult | null>(null);

  // Load queued events from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const events = JSON.parse(stored) as OfflineScanEvent[];
        setQueuedEvents(events);
      }
    } catch (e) {
      console.error("Failed to load offline events:", e);
    }
  }, []);

  // Save queued events to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queuedEvents));
    } catch (e) {
      console.error("Failed to save offline events:", e);
    }
  }, [queuedEvents]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const queueEvent = useCallback((event: OfflineScanEvent) => {
    setQueuedEvents((prev) => [...prev, event]);
  }, []);

  const syncNow = useCallback(async (): Promise<OfflineSyncResult | null> => {
    if (queuedEvents.length === 0) {
      return null;
    }

    if (!isOnline) {
      console.warn("Cannot sync while offline");
      return null;
    }

    setIsSyncing(true);

    try {
      const result = await scanEventService.syncOffline({
        events: queuedEvents,
        batchId: `batch-${Date.now()}`,
      });

      setLastSyncResult(result);

      // Remove successfully synced events
      if (result.successCount === result.totalEvents) {
        setQueuedEvents([]);
      } else {
        // Keep only failed events
        const failedIndices = new Set(result.failures.map((f) => f.eventIndex));
        setQueuedEvents((prev) => prev.filter((_, i) => failedIndices.has(i)));
      }

      return result;
    } catch (error) {
      console.error("Offline sync failed:", error);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [queuedEvents, isOnline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queuedEvents.length > 0 && !isSyncing) {
      syncNow();
    }
  }, [isOnline, isSyncing, queuedEvents.length, syncNow]);

  const clearQueue = useCallback(() => {
    setQueuedEvents([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    queuedEvents,
    queueCount: queuedEvents.length,
    isOnline,
    isSyncing,
    lastSyncResult,
    queueEvent,
    syncNow,
    clearQueue,
  };
}

export default useOfflineSync;
