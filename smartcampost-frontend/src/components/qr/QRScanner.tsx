import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recordScanEvent } from "../../services/scanEventService";
import api from "../../services/api";
import type { ScanEventType } from "../../types/Scan";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

const EVENT_TYPES: ScanEventType[] = [
  "ACCEPTED",
  "IN_TRANSIT",
  "ARRIVED_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RETURNED",
];

export default function QRScanner() {
  const regionId = useMemo(() => `qr-reader-${Math.random().toString(16).slice(2)}`, []);
  const qrRef = useRef<Html5Qrcode | null>(null);

  const [scanned, setScanned] = useState<string>("");
  const [parcelId, setParcelId] = useState<string>("");
  const [eventType, setEventType] = useState<ScanEventType>("IN_TRANSIT");
  const [locationNote, setLocationNote] = useState<string>("");

  const [cameraOn, setCameraOn] = useState(false);
  const [status, setStatus] = useState<string>("");

  const qc = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: () =>
      recordScanEvent({
        parcelId,
        eventType,
        locationNote: locationNote || undefined,
      }),
    onSuccess: () => {
      setStatus("✅ Scan event recorded.");
      qc.invalidateQueries({ queryKey: ["parcelTimeline", parcelId] });
      qc.invalidateQueries({ queryKey: ["parcelDetails", parcelId] });
    },
    onError: (e) => {
      console.error(e);
      setStatus("❌ Failed to record scan-event.");
    },
  });

  const resolveParcelId = async (text: string) => {
    const raw = text.trim();
    setScanned(raw);

    if (isUuid(raw)) {
      setParcelId(raw);
      setStatus("Parcel ID detected from QR.");
      return;
    }

    // Otherwise treat as trackingRef and resolve to parcelId
    try {
      setStatus("Resolving tracking ref…");
      const { data } = await api.get(`/parcels/tracking/${encodeURIComponent(raw)}`);
      const id = (data as { id?: string })?.id;
      if (!id) {
        setStatus("❌ Tracking found but no parcel id returned.");
        return;
      }
      setParcelId(id);
      setStatus("✅ Parcel resolved from trackingRef.");
    } catch (e) {
      console.error(e);
      setStatus("❌ Could not resolve trackingRef.");
    }
  };

  const startCamera = async () => {
    setStatus("");
    if (qrRef.current) return;

    const qr = new Html5Qrcode(regionId);
    qrRef.current = qr;

    try {
      setCameraOn(true);
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setStatus("❌ No camera found.");
        return;
      }

      const cameraId = devices[0].id;

      await qr.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          // Stop after first success to avoid duplicate scans
          await stopCamera();
          await resolveParcelId(decodedText);
        },
        () => {}
      );

      setStatus("Camera started. Scan a QR code…");
    } catch (e) {
      console.error(e);
      setStatus("❌ Failed to start camera (permissions?).");
      setCameraOn(false);
      qrRef.current = null;
    }
  };

  const stopCamera = async () => {
    const qr = qrRef.current;
    if (!qr) return;

    try {
      await qr.stop();
      await qr.clear();
    } catch {
      // ignore
    } finally {
      qrRef.current = null;
      setCameraOn(false);
    }
  };

  useEffect(() => {
    return () => {
      // cleanup
      void stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = parcelId && !scanMutation.isPending;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">QR Scanner</h2>

        {!cameraOn ? (
          <button
            type="button"
            onClick={startCamera}
            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
          >
            Start Camera
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800"
          >
            Stop
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div id={regionId} className="overflow-hidden rounded-xl bg-black/30" />
        <p className="mt-3 text-xs text-slate-400">
          Tip: if your QR contains <b>trackingRef</b>, we’ll resolve it to a parcelId automatically.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Scanned content
            </label>
            <input
              value={scanned}
              onChange={(e) => resolveParcelId(e.target.value)}
              placeholder="trackingRef or parcelId"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Parcel ID (resolved)
            </label>
            <input
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              placeholder="UUID"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Event type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as ScanEventType)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Location note (optional)
            </label>
            <input
              value={locationNote}
              onChange={(e) => setLocationNote(e.target.value)}
              placeholder="e.g. Yaoundé Hub - Gate A"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => scanMutation.mutate()}
          className="w-full rounded-lg bg-amber-500 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {scanMutation.isPending ? "Recording…" : "Record scan-event"}
        </button>

        {status && (
          <p className="text-xs text-slate-300 border border-slate-800 bg-slate-950 rounded-lg px-3 py-2">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
