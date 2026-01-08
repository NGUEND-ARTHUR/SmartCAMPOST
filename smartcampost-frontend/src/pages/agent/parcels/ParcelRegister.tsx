import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateParcel } from "../../../hooks/parcels";
import { useListTariffs } from "../../../hooks/tariffs";
import { QRGenerator } from "../../../components/qr/QRGenerator";
import { Badge } from "../../../components/ui/Badge";

interface ParcelFormData {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weight: number;
  dimensions: string;
  description: string;
  tariffId: string;
}

export default function ParcelRegistration() {
  const [createdParcel, setCreatedParcel] = useState<any>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ParcelFormData>();
  const createParcel = useCreateParcel();
  const { data: tariffs } = useListTariffs();

  const weight = watch("weight");
  const selectedTariff = tariffs?.find(t => t.id === watch("tariffId"));
  const estimatedCost = selectedTariff ? selectedTariff.baseRate + (weight * selectedTariff.weightRate) : 0;

  const onSubmit = async (data: ParcelFormData) => {
    try {
      const parcel = await createParcel.mutateAsync({
        ...data,
        weight: Number(data.weight),
        tariffId: Number(data.tariffId),
      });
      setCreatedParcel(parcel);
    } catch (error) {
      console.error("Failed to create parcel:", error);
    }
  };

  if (createdParcel) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-green-800 mb-2">Parcel Created Successfully!</h2>
            <p className="text-green-700">Tracking Reference: {createdParcel.trackingRef}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Parcel QR Code</h3>
            <QRGenerator trackingRef={createdParcel.trackingRef} />
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => window.print()}
                className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
              >
                Print QR Code
              </button>
              <button
                onClick={() => setCreatedParcel(null)}
                className="bg-slate-100 text-slate-900 px-4 py-2 rounded hover:bg-slate-200"
              >
                Register Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Parcel Registration</h1>
          <p className="text-slate-600">Register a new parcel for delivery.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Sender Information */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Sender Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    {...register("senderName", { required: "Sender name is required" })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.senderName && <p className="text-red-500 text-sm">{errors.senderName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    {...register("senderPhone", { required: "Sender phone is required" })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.senderPhone && <p className="text-red-500 text-sm">{errors.senderPhone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <textarea
                    {...register("senderAddress", { required: "Sender address is required" })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.senderAddress && <p className="text-red-500 text-sm">{errors.senderAddress.message}</p>}
                </div>
              </div>
            </div>

            {/* Receiver Information */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Receiver Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    {...register("receiverName", { required: "Receiver name is required" })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.receiverName && <p className="text-red-500 text-sm">{errors.receiverName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    {...register("receiverPhone", { required: "Receiver phone is required" })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.receiverPhone && <p className="text-red-500 text-sm">{errors.receiverPhone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <textarea
                    {...register("receiverAddress", { required: "Receiver address is required" })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.receiverAddress && <p className="text-red-500 text-sm">{errors.receiverAddress.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Parcel Details */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Parcel Details</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register("weight", { required: "Weight is required", min: { value: 0.1, message: "Weight must be at least 0.1kg" } })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errors.weight && <p className="text-red-500 text-sm">{errors.weight.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dimensions (L x W x H cm)</label>
                <input
                  {...register("dimensions", { required: "Dimensions are required" })}
                  placeholder="30 x 20 x 10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errors.dimensions && <p className="text-red-500 text-sm">{errors.dimensions.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tariff</label>
                <select
                  {...register("tariffId", { required: "Tariff is required" })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select tariff</option>
                  {tariffs?.map((tariff) => (
                    <option key={tariff.id} value={tariff.id}>
                      {tariff.name} - {tariff.baseRate} FCFA base
                    </option>
                  ))}
                </select>
                {errors.tariffId && <p className="text-red-500 text-sm">{errors.tariffId.message}</p>}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Cost Estimation */}
          {selectedTariff && weight && (
            <div className="mt-6 bg-slate-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Cost Estimation</h3>
              <div className="flex justify-between items-center">
                <span>Base Rate: {selectedTariff.baseRate} FCFA</span>
                <span>Weight Rate: {selectedTariff.weightRate} FCFA/kg</span>
                <span className="font-bold text-lg">Total: {estimatedCost} FCFA</span>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={createParcel.isPending}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              {createParcel.isPending ? "Creating..." : "Create Parcel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}