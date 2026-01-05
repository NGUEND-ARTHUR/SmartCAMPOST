import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createParcel } from "../../services/parcelService";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CreateParcel() {
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [comment, setComment] = useState("");

  const [error, setError] = useState<string | null>(null);

  const qc = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () =>
      createParcel({
        receiverName,
        receiverPhone,
        destinationCity,
        comment: comment || undefined,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["myParcels"] });
      navigate("/client/parcels", { replace: true });
    },
    onError: (err: unknown) => {
      let message = "Failed to create parcel.";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (typeof data === "string") message = data;
        else if (data && typeof data === "object") {
          message =
            (data as { message?: string; error?: string }).message ||
            (data as { message?: string; error?: string }).error ||
            message;
        } else if (err.message) message = err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  return (
    <div className="p-4 max-w-xl">
      <h2 className="text-lg font-semibold text-slate-100">Create Parcel</h2>
      <p className="text-xs text-slate-400 mt-1">
        This creates a parcel record (CREATED). Staff may ACCEPT it later.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300">Receiver name</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300">Receiver phone</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300">Destination city</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={destinationCity}
            onChange={(e) => setDestinationCity(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300">Comment (optional)</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-2 py-1">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {mutation.isPending ? "Creating…" : "Create parcel"}
        </button>
      </form>
    </div>
  );
}
