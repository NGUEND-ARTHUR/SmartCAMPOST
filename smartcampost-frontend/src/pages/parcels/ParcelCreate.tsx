import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createParcel } from "../../services/parcels/parcelService";
import type { CreateParcelRequest, DeliveryOption } from "../../types/Parcel";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ParcelCreate() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [destinationAgencyId, setDestinationAgencyId] = useState("");

  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  const [weightKg, setWeightKg] = useState<string>("");
  const [declaredValue, setDeclaredValue] = useState<string>("");
  const [description, setDescription] = useState("");

  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("AGENCY");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: CreateParcelRequest) => createParcel(payload),
    onSuccess: async (created) => {
      // refresh parcel list cache
      await qc.invalidateQueries({ queryKey: ["myParcels"] });
      // go to details
      navigate(`/parcels/${created.id}`, { replace: true });
    },
    onError: (err: unknown) => {
      let message = "Failed to create parcel. Please try again.";

      if (axios.isAxiosError(err)) {
        const data = err.response?.data;

        if (typeof data === "string") {
          message = data;
        } else if (data && typeof data === "object") {
          const maybe =
            (data as { message?: string; error?: string }).message ||
            (data as { message?: string; error?: string }).error;
          if (maybe) message = maybe;
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }

      setError(message);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // This legacy screen is not wired to the new backend DTO anymore.
    // Keep it compiling by not sending a payload.
    const payload = {} as CreateParcelRequest;

    mutation.mutate(payload);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Create Parcel</h2>
        <button
          onClick={() => navigate("/parcels")}
          className="text-sm text-amber-400 hover:text-amber-300"
          type="button"
        >
          ← Back
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-4 grid gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 md:grid-cols-2"
      >
        {/* Receiver */}
        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold text-slate-200">Receiver</h3>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300">
            Receiver Name
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300">
            Receiver Phone
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-300">
            Destination Agency ID
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={destinationAgencyId}
            onChange={(e) => setDestinationAgencyId(e.target.value)}
            placeholder="UUID or code (depending on backend)"
            required
          />
          <p className="mt-1 text-[11px] text-slate-400">
            For now, paste the agency UUID (later we’ll make a dropdown list).
          </p>
        </div>

        {/* Sender */}
        <div className="md:col-span-2 mt-2">
          <h3 className="text-sm font-semibold text-slate-200">Sender (optional)</h3>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300">
            Sender Name
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300">
            Sender Phone
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
          />
        </div>

        {/* Parcel */}
        <div className="md:col-span-2 mt-2">
          <h3 className="text-sm font-semibold text-slate-200">Parcel</h3>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300">
            Weight (kg)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300">
            Declared Value
          </label>
          <input
            type="number"
            step="1"
            min="0"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={declaredValue}
            onChange={(e) => setDeclaredValue(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-300">
            Delivery Option
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={deliveryOption}
            onChange={(e) => setDeliveryOption(e.target.value as DeliveryOption)}
          >
            <option value="AGENCY">Agency pickup</option>
            <option value="HOME">Home delivery</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-300">
            Description (optional)
          </label>
          <textarea
            className="mt-1 min-h-[90px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && (
          <div className="md:col-span-2">
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-2 py-2">
              {error}
            </p>
          </div>
        )}

        <div className="md:col-span-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate("/parcels")}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {mutation.isPending ? "Creating…" : "Create Parcel"}
          </button>
        </div>
      </form>
    </div>
  );
}
