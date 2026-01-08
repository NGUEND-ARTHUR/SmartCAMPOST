import { useState } from "react";
import { useListAllPickups } from "../../hooks/pickups";
import QRScanner from "../../components/qr/QRScanner";

export default function CourierDashboard() {
  const [scanMode, setScanMode] = useState(false);
  const { data: pickups, isLoading } = useListAllPickups();

  const handleScan = (result: string) => {
    console.log("Scanned:", result);
    // Handle delivery scan
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Courier Dashboard</h1>
        <p className="text-slate-600">Manage your deliveries and pickups.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => setScanMode(!scanMode)}
          className="bg-amber-500 text-white p-4 rounded-lg hover:bg-amber-600 transition-colors"
        >
          <h3 className="text-lg font-semibold mb-1">Scan for Delivery</h3>
          <p>Process parcel</p>
        </button>
        <button className="bg-slate-100 text-slate-900 p-4 rounded-lg hover:bg-slate-200">
          <h3 className="text-lg font-semibold mb-1">My Route</h3>
          <p>View optimized path</p>
        </button>
        <button className="bg-slate-100 text-slate-900 p-4 rounded-lg hover:bg-slate-200">
          <h3 className="text-lg font-semibold mb-1">Reports</h3>
          <p>Daily performance</p>
        </button>
      </div>

      {/* Scanner */}
      {scanMode && (
        <div className="mb-8">
          <QRScanner onScan={handleScan} />
        </div>
      )}

      {/* Today's Pickups */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Today's Assignments</h2>
        {isLoading ? (
          <div>Loading...</div>
        ) : pickups?.content?.length ? (
          <div className="space-y-4">
            {pickups.content.map((pickup) => (
              <div key={pickup.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900">{pickup.parcelTrackingRef}</p>
                  <p className="text-slate-600">{pickup.address}</p>
                  <p className="text-sm text-slate-500">Status: {pickup.status}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                    Start Pickup
                  </button>
                  <button className="px-4 py-2 bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No assignments today</p>
        )}
      </div>
    </div>
  );
}