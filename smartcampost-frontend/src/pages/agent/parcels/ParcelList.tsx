import { useState } from "react";
import { useListParcels, useUpdateParcelStatus } from "../../../hooks/parcels";
import { Badge } from "../../../components/ui/Badge";

export default function ParcelManagement() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const { data: parcels, isLoading } = useListParcels(0, 50);
  const updateStatus = useUpdateParcelStatus();

  const filteredParcels = parcels?.content?.filter(parcel => {
    const matchesStatus = !statusFilter || parcel.status === statusFilter;
    const matchesSearch = !searchTerm ||
      parcel.trackingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parcel.receiverName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const handleStatusUpdate = async (parcelId: number, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({
        id: parcelId,
        status: newStatus,
        location: "Agent Office",
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DELIVERED": return "success";
      case "IN_TRANSIT": return "warning";
      case "OUT_FOR_DELIVERY": return "info";
      case "REGISTERED": return "default";
      default: return "error";
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading parcels...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Parcel Management</h1>
        <p className="text-slate-600">View and manage all parcels in the system.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Tracking ref, sender, receiver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="RETURNED">Returned</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter("");
                setSearchTerm("");
              }}
              className="bg-slate-100 text-slate-900 px-4 py-2 rounded hover:bg-slate-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Parcels Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tracking Ref
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Sender → Receiver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredParcels.map((parcel) => (
                <tr key={parcel.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {parcel.trackingRef}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    <div>
                      <p className="font-medium">{parcel.senderName}</p>
                      <p className="text-slate-500">→ {parcel.receiverName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(parcel.status)}>
                      {parcel.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {parcel.weight}kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {new Date(parcel.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {parcel.status === "REGISTERED" && (
                        <button
                          onClick={() => handleStatusUpdate(parcel.id, "IN_TRANSIT")}
                          disabled={updateStatus.isPending}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          Start Transit
                        </button>
                      )}
                      {parcel.status === "IN_TRANSIT" && (
                        <button
                          onClick={() => handleStatusUpdate(parcel.id, "OUT_FOR_DELIVERY")}
                          disabled={updateStatus.isPending}
                          className="text-amber-600 hover:text-amber-900 disabled:opacity-50"
                        >
                          Out for Delivery
                        </button>
                      )}
                      {parcel.status === "OUT_FOR_DELIVERY" && (
                        <button
                          onClick={() => handleStatusUpdate(parcel.id, "DELIVERED")}
                          disabled={updateStatus.isPending}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredParcels.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No parcels found matching your criteria.
          </div>
        )}
      </div>

      {/* Pagination could be added here */}
      <div className="mt-4 text-sm text-slate-500">
        Showing {filteredParcels.length} of {parcels?.totalElements || 0} parcels
      </div>
    </div>
  );
}