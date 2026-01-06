import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createParcel } from "../../services/parcelService";
import type { CreateParcelRequest, DeliveryOption, ServiceType, PaymentOption } from "../../types/Parcel";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CreateParcel() {
  const [senderAddressId, setSenderAddressId] = useState("");
  const [recipientAddressId, setRecipientAddressId] = useState("");
  const [originAgencyId, setOriginAgencyId] = useState("");
  const [destinationAgencyId, setDestinationAgencyId] = useState("");

  const [weight, setWeight] = useState<string>("");
  const [dimensions, setDimensions] = useState("");
  const [declaredValue, setDeclaredValue] = useState<string>("");
  const [fragile, setFragile] = useState(false);

  const [serviceType, setServiceType] = useState<ServiceType>("STANDARD");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("AGENCY");
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("PREPAID");

  const [photoUrl, setPhotoUrl] = useState("");
  const [descriptionComment, setDescriptionComment] = useState("");

  const [error, setError] = useState<string | null>(null);

  const qc = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (payload: CreateParcelRequest) => createParcel(payload),
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

    const payload: CreateParcelRequest = {
      senderAddressId: senderAddressId.trim(),
      recipientAddressId: recipientAddressId.trim(),
      originAgencyId: originAgencyId.trim() || undefined,
      destinationAgencyId: destinationAgencyId.trim() || undefined,
      weight: Number(weight),
      dimensions: dimensions.trim() || undefined,
      declaredValue: declaredValue ? Number(declaredValue) : undefined,
      fragile,
      serviceType,
      deliveryOption,
      paymentOption,
      photoUrl: photoUrl.trim() || undefined,
      descriptionComment: descriptionComment.trim() || undefined,
    };

    mutation.mutate(payload);
  };

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-100">Create Parcel</h2>
      <p className="text-xs text-slate-400 mt-1">
        This form maps directly to the backend CreateParcelRequest DTO. Use raw IDs for now (addresses, agencies).
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Sender Address ID
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
              value={senderAddressId}
              onChange={(e) => setSenderAddressId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Recipient Address ID
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
              value={recipientAddressId}
              onChange={(e) => setRecipientAddressId(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Origin Agency ID (optional)
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
              value={originAgencyId}
              onChange={(e) => setOriginAgencyId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Destination Agency ID (optional)
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
              value={destinationAgencyId}
              onChange={(e) => setDestinationAgencyId(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Dimensions
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
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
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
              value={declaredValue}
              onChange={(e) => setDeclaredValue(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="fragile"
            type="checkbox"
            checked={fragile}
            onChange={(e) => setFragile(e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500"
          />
          <label htmlFor="fragile" className="text-xs text-slate-300">
            Fragile
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Service Type
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
            >
              <option value="STANDARD">STANDARD</option>
              <option value="EXPRESS">EXPRESS</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Delivery Option
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              value={deliveryOption}
              onChange={(e) =>
                setDeliveryOption(e.target.value as DeliveryOption)
              }
            >
              <option value="AGENCY">AGENCY</option>
              <option value="HOME">HOME</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300">
              Payment Option
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              value={paymentOption}
              onChange={(e) =>
                setPaymentOption(e.target.value as PaymentOption)
              }
            >
              <option value="PREPAID">PREPAID</option>
              <option value="COD">COD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300">
            Photo URL (optional)
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300">
            Description / Comment (optional)
          </label>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
            value={descriptionComment}
            onChange={(e) => setDescriptionComment(e.target.value)}
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
