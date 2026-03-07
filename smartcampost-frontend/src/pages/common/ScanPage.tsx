import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import useGeolocation from "../../hooks/useGeolocation";
import axiosInstance from "@/lib/axiosClient";

export default function ScanPage() {
  const { t } = useTranslation();
  const [parcelId, setParcelId] = useState("");
  const [address, setAddress] = useState("");
  const [scanType, setScanType] = useState("IN_TRANSIT");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { getCurrent } = useGeolocation();

  async function doScan() {
    setMessage(null);
    if (!parcelId) {
      setMessage(t("scanPage.enterParcelId"));
      return;
    }
    setLoading(true);
    const payload: Record<string, string | number> = { scanType };
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
        setMessage(t("scanPage.gpsUnavailable"));
        setLoading(false);
        return;
      }

      const id = encodeURIComponent(parcelId);
      const res = await axiosInstance.post(`/parcels/${id}/scan`, payload);
      setMessage(
        t("scanPage.scanRecorded") +
          (res.data?.parcelStatus || t("common.unknown")),
      );
    } catch (e) {
      setMessage(
        t("scanPage.error") +
          (e instanceof Error ? e.message : t("common.unknown")),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">{t("scanPage.title")}</h2>
      <div className="mt-3">
        <input
          placeholder={t("scanPage.parcelPlaceholder")}
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
          placeholder={t("scanPage.addressPlaceholder")}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mt-3">
        <button className="btn" onClick={doScan} disabled={loading}>
          {loading ? t("scanPage.scanning") : t("scanPage.scan")}
        </button>
      </div>
      {message && <div className="mt-3">{message}</div>}
    </div>
  );
}
