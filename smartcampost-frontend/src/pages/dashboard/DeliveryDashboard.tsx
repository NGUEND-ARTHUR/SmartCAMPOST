export default function DeliveryDashboard() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-50">
        Courier Dashboard
      </h2>
      <p className="text-xs text-slate-400">
        This view will show assigned pickups and deliveries for the current
        courier, using /api/pickups/courier/me and parcel endpoints.
      </p>
    </div>
  );
}


