import { FormEvent, useState } from "react";
import { confirmFinalDelivery } from "../../services/deliveryService";

export default function DeliveryConfirmationForm() {
  const [parcelId, setParcelId] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await confirmFinalDelivery({
        otp: { parcelId, otpCode: otp },
        proof: { parcelId, proofType: "OTP" },
      });
      setMsg("Delivery confirmed ✅");
      setParcelId("");
      setOtp("");
    } catch {
      setMsg("Failed to confirm delivery. Check backend endpoint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="text-sm font-semibold text-slate-100">Confirm Delivery (OTP)</h3>

      <div>
        <label className="text-xs text-slate-300">Parcel ID</label>
        <input value={parcelId} onChange={(e) => setParcelId(e.target.value)} required
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
      </div>

      <div>
        <label className="text-xs text-slate-300">OTP</label>
        <input value={otp} onChange={(e) => setOtp(e.target.value)} required
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
      </div>

      <button disabled={loading} className="w-full rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold py-2 hover:bg-amber-400 disabled:opacity-60">
        {loading ? "Confirming..." : "Confirm delivery"}
      </button>

      {msg && <p className="text-xs text-slate-200 bg-slate-950 border border-slate-800 rounded-md px-2 py-1">{msg}</p>}
    </form>
  );
}
