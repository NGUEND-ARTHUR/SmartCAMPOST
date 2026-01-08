import { useListParcels } from "../../hooks/parcels";
import { useListUsers } from "../../hooks/users/users";
import { Badge } from "../../components/ui/Badge";

export default function AdminDashboard() {
  const { data: parcels } = useListParcels(0, 5);
  const { data: users } = useListUsers(0, 5);

  const stats = {
    totalParcels: parcels?.totalElements || 0,
    deliveredToday: parcels?.content?.filter(p => p.status === "DELIVERED").length || 0,
    inTransit: parcels?.content?.filter(p => p.status === "IN_TRANSIT").length || 0,
    totalUsers: users?.totalElements || 0,
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
        <p className="text-slate-600">System overview and management.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-slate-500">Total Parcels</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.totalParcels}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-slate-500">Delivered Today</h3>
          <p className="text-3xl font-bold text-green-600">{stats.deliveredToday}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-slate-500">In Transit</h3>
          <p className="text-3xl font-bold text-amber-600">{stats.inTransit}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-slate-500">Total Users</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <button className="bg-amber-500 text-white p-4 rounded-lg hover:bg-amber-600">
          <h3 className="text-lg font-semibold mb-1">Parcels</h3>
          <p>Manage shipments</p>
        </button>
        <button className="bg-slate-100 text-slate-900 p-4 rounded-lg hover:bg-slate-200">
          <h3 className="text-lg font-semibold mb-1">Users</h3>
          <p>Staff & clients</p>
        </button>
        <button className="bg-slate-100 text-slate-900 p-4 rounded-lg hover:bg-slate-200">
          <h3 className="text-lg font-semibold mb-1">Analytics</h3>
          <p>Reports & KPIs</p>
        </button>
        <button className="bg-slate-100 text-slate-900 p-4 rounded-lg hover:bg-slate-200">
          <h3 className="text-lg font-semibold mb-1">Settings</h3>
          <p>System config</p>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Parcels</h2>
          {parcels?.content?.length ? (
            <div className="space-y-3">
              {parcels.content.slice(0, 5).map((parcel) => (
                <div key={parcel.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{parcel.trackingRef}</p>
                    <p className="text-sm text-slate-500">{parcel.senderAddress}</p>
                  </div>
                  <Badge variant={parcel.status === "DELIVERED" ? "success" : "default"}>
                    {parcel.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No parcels</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Users</h2>
          {users?.content?.length ? (
            <div className="space-y-3">
              {users.content.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{user.phone}</p>
                    <p className="text-sm text-slate-500">{user.role}</p>
                  </div>
                  <Badge variant={user.frozen ? "error" : "success"}>
                    {user.frozen ? "Frozen" : "Active"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No users</p>
          )}
        </div>
      </div>
    </div>
  );
}