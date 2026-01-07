import DeliveryConfirmationForm from "../../components/forms/DeliveryConfirmationForm";

export default function DeliveryList() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-50">My Delivery Tasks</h2>
      <p className="text-xs text-slate-400">
        This screen will later list deliveries assigned to the logged-in courier.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
          Delivery list placeholder – wire to /api/parcels for OUT_FOR_DELIVERY parcels when backend endpoint is ready.
        </div>
        <DeliveryConfirmationForm />
      </div>
    </div>
  );
}
