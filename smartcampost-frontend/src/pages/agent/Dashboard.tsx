import { useState } from "react";
import { useListParcels } from "../../hooks/parcels";
import { Badge } from "../../components/ui/Badge";
import QRScanner from "../../components/qr/QRScanner";

export default function AgentDashboard() {
  const [scanMode, setScanMode] = useState(false);
  const { data: parcels, isLoading } = useListParcels(0, 10);

  const handleScan = (result: string) => {
    console.log("Scanned:", result);
    // Handle scan result - navigate to parcel or create scan event
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Agent Dashboard</h1>
        <p className="text-slate-600">Manage parcels and scan events.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setScanMode(!scanMode)}
          className="bg-amber-500 text-white p-4 rounded-lg hover:bg-amber-600 transition-colors"
        >
          <h3 className="text-lg font-semibold mb-1">Scan QR</h3>
          <p>Process parcel</p>
        </button>
        <button className="bg-slate-100 text-slate-900 p-4 rounded-lg hover:bg-slate-200">
          <h3 className="text-lg font-semibold mb-1">New Parcel</h3>
          <p>Register shipment</p>
        </button>
        <button className="bg-slate-100 text-slate-900 p-4 rounded-lg hover:bg-slate-200">
          <h3 className="text-lg font-semibold mb-1">Pickups</h3>
          <p>Manage collections</p>
        </button>
        <button className="bg-slate-100 text-slate-900 p-4 rounded-lg hover:bg-slate-200">
          <h3 className="text-lg font-semibold mb-1">Reports</h3>
          <p>Daily summary</p>
        </button>
      </div>

      {/* Scanner */}
      {scanMode && (
        <div className="mb-8">
          <QRScanner onScan={handleScan} />
        </div>
      )}

      {/* Recent Parcels */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Parcels</h2>
        {isLoading ? (
          <div>Loading...</div>
        ) : parcels?.content?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2">Tracking</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Sender</th>
                  <th className="text-left py-2">Receiver</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parcels.content.map((parcel) => (
                  <tr key={parcel.id} className="border-b border-slate-100">
                    <td className="py-3">{parcel.trackingRef}</td>
                    <td className="py-3">
                      <Badge variant={parcel.status === "DELIVERED" ? "success" : "default"}>
                        {parcel.status}
                      </Badge>
                    </td>
                    <td className="py-3">{parcel.senderAddress}</td>
                    <td className="py-3">{parcel.receiverAddress}</td>
                    <td className="py-3">
                      <button className="text-amber-500 hover:text-amber-600 mr-2">View</button>
                      <button className="text-amber-500 hover:text-amber-600">Scan</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No parcels</p>
        )}
      </div>
    </div>
  );
}