import { Link } from "react-router-dom";
import { useListMyParcels } from "../../hooks/parcels";
import { Badge } from "../../components/ui/Badge";

export default function ClientDashboard() {
  const { data: parcels, isLoading } = useListMyParcels();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here's your parcel overview.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/client/parcels/new"
          className="bg-amber-500 text-white p-6 rounded-lg hover:bg-amber-600 transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">Create Shipment</h3>
          <p>Send a new parcel</p>
        </Link>
        <Link
          to="/client/pickups/new"
          className="bg-slate-100 text-slate-900 p-6 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">Request Pickup</h3>
          <p>Schedule home collection</p>
        </Link>
        <Link
          to="/client/payments"
          className="bg-slate-100 text-slate-900 p-6 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">Payments</h3>
          <p>View transactions</p>
        </Link>
      </div>

      {/* Parcels */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">My Parcels</h2>
        {isLoading ? (
          <div>Loading...</div>
        ) : parcels?.content?.length ? (
          <div className="space-y-4">
            {parcels.content.map((parcel) => (
              <div key={parcel.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900">{parcel.trackingRef}</p>
                  <p className="text-slate-600">{parcel.senderAddress} → {parcel.receiverAddress}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={parcel.status === "DELIVERED" ? "success" : "default"}>
                    {parcel.status}
                  </Badge>
                  <Link
                    to={`/client/parcels/${parcel.id}`}
                    className="text-amber-500 hover:text-amber-600"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No parcels yet</p>
        )}
      </div>
    </div>
  );
}