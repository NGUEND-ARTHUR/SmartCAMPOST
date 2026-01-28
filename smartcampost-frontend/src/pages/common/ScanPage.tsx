import React, { useState } from "react";
import useGeolocation from "../../hooks/useGeolocation";

export default function ScanPage() {
  const [parcelId, setParcelId] = useState("");
  const [address, setAddress] = useState("");
  const [scanType, setScanType] = useState("IN_TRANSIT");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { getCurrent } = useGeolocation();

  async function doScan() {
    setMessage(null);
    if (!parcelId) {
      setMessage("Enter parcel id or tracking number");
      return;
    }
    setLoading(true);
    let payload: any = { scanType };
    try {
      const pos = await getCurrent().catch(() => null);
      if (pos) {
        payload.latitude = pos.coords.latitude;
        payload.longitude = pos.coords.longitude;
        payload.source = "GPS";
      } else if (address) {
        payload.address = address;
        payload.source = "MANUAL";
      } else {
        setMessage("GPS unavailable: enter address");
        setLoading(false);
        return;
      }

      const id = encodeURIComponent(parcelId);
      const res = await fetch(`/api/parcels/${id}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (res.ok)
        setMessage(
          "Scan recorded. Status: " + (json?.parcelStatus || "unknown"),
        );
      else setMessage("Scan failed: " + (json?.error || res.statusText));
    } catch (e: any) {
      setMessage("Error: " + e?.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">Scan Parcel</h2>
      <div className="mt-3">
        <input
          placeholder="Parcel ID or tracking"
          value={parcelId}
          onChange={(e) => setParcelId(e.target.value)}
          className="border p-2"
        />
      </div>
      <div className="mt-3">
        <label htmlFor="scanTypeSelect" className="sr-only">
          Scan type
        </label>
        <select
          id="scanTypeSelect"
          aria-label="Scan type"
          value={scanType}
          onChange={(e) => setScanType(e.target.value)}
          className="border p-2"
        >
          <option value="IN_TRANSIT">IN_TRANSIT</option>
          <option value="PICKED_UP">PICKED_UP</option>
          <option value="ARRIVED_AT_CENTER">ARRIVED_AT_CENTER</option>
          <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
          <option value="DELIVERED">DELIVERED</option>
        </select>
      </div>
      <div className="mt-3">
        <input
          placeholder="Manual address (if GPS denied)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mt-3">
        <button className="btn" onClick={doScan} disabled={loading}>
          {loading ? "Scanning..." : "Scan"}
        </button>
      </div>
      {message && <div className="mt-3">{message}</div>}
    </div>
  );
}
