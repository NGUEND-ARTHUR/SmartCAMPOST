import { FormEvent, useState } from "react";
import { createPickupRequest } from "../../services/pickupService";
import axios from "axios";

export default function PickupRequestForm() {
  const [senderName, setSenderName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressText, setAddressText] = useState("");
  const [city, setCity] = useState("");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("08:00-12:00");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await createPickupRequest({
        senderName,
        phone,
        addressText,
        city,
        preferredTimeSlot,
      });
      setMsg("Pickup request created successfully ✅");
      setSenderName("");
      setPhone("");
      setAddressText("");
      setCity("");
    } catch (err: unknown) {
      let m = "Failed to create pickup request.";
      if (axios.isAxiosError(err)) m = err.message;
      setMsg(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="text-sm font-semibold text-slate-100">Request Home Pickup</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Full name">
          <input value={senderName} onChange={(e) => setSenderName(e.target.value)} required
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
        </Field>

        <Field label="Phone">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
        </Field>
      </div>

      <Field label="City">
        <input value={city} onChange={(e) => setCity(e.target.value)} required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
      </Field>

      <Field label="Address details">
        <textarea value={addressText} onChange={(e) => setAddressText(e.target.value)} required
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 min-h-[90px]" />
      </Field>

      <Field label="Preferred time slot">
        <select value={preferredTimeSlot} onChange={(e) => setPreferredTimeSlot(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50">
          <option>08:00-12:00</option>
          <option>12:00-16:00</option>
          <option>16:00-19:00</option>
        </select>
      </Field>

      <button disabled={loading} className="w-full rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold py-2 hover:bg-amber-400 disabled:opacity-60">
        {loading ? "Submitting..." : "Submit pickup request"}
      </button>

      {msg && (
        <p className="text-xs text-slate-200 bg-slate-950 border border-slate-800 rounded-md px-2 py-1">
          {msg}
        </p>
      )}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-slate-300">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
