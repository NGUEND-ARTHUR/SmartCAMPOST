import { useState } from "react";
import { useForm } from "react-hook-form";
import { useScanParcel, useUpdateParcelStatus } from "../../../hooks/parcels";
import { QRScanner } from "../../../components/qr/QRScanner";
import { Badge } from "../../../components/ui/Badge";

interface ScanFormData {
  trackingRef: string;
}

export default function ScanParcel() {
  const [scanMode, setScanMode] = useState<"manual" | "qr">("manual");
  const [scannedParcel, setScannedParcel] = useState<any>(null);
  const { register, handleSubmit, setValue } = useForm<ScanFormData>();
  const scanParcel = useScanParcel();
  const updateStatus = useUpdateParcelStatus();

  const onScan = async (trackingRef: string) => {
    try {
      const parcel = await scanParcel.mutateAsync(trackingRef);
      setScannedParcel(parcel);
    } catch (error) {
      console.error("Failed to scan parcel:", error);
    }
  };

  const onManualSubmit = async (data: ScanFormData) => {
    await onScan(data.trackingRef);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!scannedParcel) return;
    try {
      await updateStatus.mutateAsync({
        id: scannedParcel.id,
        status: newStatus,
        location: "Agent Office", // Could be dynamic
      });
      // Refresh parcel data
      await scanParcel.mutateAsync(scannedParcel.trackingRef);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const resetScan = () => {
    setScannedParcel(null);
    setValue("trackingRef", "");
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Scan Parcel</h1>
          <p className="text-slate-600">Scan or enter tracking reference to view and update parcel status.</p>
        </div>

        {!scannedParcel ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Scan Mode Toggle */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setScanMode("manual")}
                className={`px-4 py-2 rounded-lg ${
                  scanMode === "manual"
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => setScanMode("qr")}
                className={`px-4 py-2 rounded-lg ${
                  scanMode === "qr"
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
              >
                QR Scan
              </button>
            </div>

            {scanMode === "manual" ? (
              <form onSubmit={handleSubmit(onManualSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Reference</label>
                  <input
                    {...register("trackingRef", { required: true })}
                    placeholder="Enter tracking reference"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={scanParcel.isPending}
                  className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50"
                >
                  {scanParcel.isPending ? "Searching..." : "Search Parcel"}
                </button>
              </form>
            ) : (
              <div>
                <QRScanner onScan={onScan} />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Parcel Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{scannedParcel.trackingRef}</h2>
                  <p className="text-slate-600">{scannedParcel.senderName} → {scannedParcel.receiverName}</p>
                </div>
                <Badge variant={
                  scannedParcel.status === "DELIVERED" ? "success" :
                  scannedParcel.status === "IN_TRANSIT" ? "warning" :
                  scannedParcel.status === "PENDING" ? "default" : "error"
                }>
                  {scannedParcel.status}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>From:</strong> {scannedParcel.senderAddress}</p>
                  <p><strong>To:</strong> {scannedParcel.receiverAddress}</p>
                </div>
                <div>
                  <p><strong>Weight:</strong> {scannedParcel.weight}kg</p>
                  <p><strong>Description:</strong> {scannedParcel.description || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Status Update Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Update Status</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {scannedParcel.status === "REGISTERED" && (
                  <button
                    onClick={() => handleStatusUpdate("IN_TRANSIT")}
                    disabled={updateStatus.isPending}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Mark In Transit
                  </button>
                )}
                {scannedParcel.status === "IN_TRANSIT" && (
                  <button
                    onClick={() => handleStatusUpdate("OUT_FOR_DELIVERY")}
                    disabled={updateStatus.isPending}
                    className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 disabled:opacity-50"
                  >
                    Out for Delivery
                  </button>
                )}
                {scannedParcel.status === "OUT_FOR_DELIVERY" && (
                  <button
                    onClick={() => handleStatusUpdate("DELIVERED")}
                    disabled={updateStatus.isPending}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={resetScan}
                className="bg-slate-100 text-slate-900 px-4 py-2 rounded hover:bg-slate-200"
              >
                Scan Another
              </button>
              <button
                onClick={() => window.print()}
                className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
              >
                Print Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}