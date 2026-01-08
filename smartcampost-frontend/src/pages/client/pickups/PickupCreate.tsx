import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreatePickupRequest } from "../../../hooks/pickups";
import { Badge } from "../../components/ui/Badge";

interface PickupFormData {
  pickupAddress: string;
  pickupDate: string;
  pickupTime: string;
  contactName: string;
  contactPhone: string;
  parcelCount: number;
  notes: string;
}

export default function PickupRequest() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<PickupFormData>();
  const createPickup = useCreatePickupRequest();

  const onSubmit = async (data: PickupFormData) => {
    try {
      await createPickup.mutateAsync({
        ...data,
        parcelCount: Number(data.parcelCount),
        pickupDateTime: `${data.pickupDate}T${data.pickupTime}`,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to create pickup request:", error);
    }
  };

  if (submitted) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Pickup Request Submitted!</h2>
            <p className="text-green-700 mb-4">
              Our agent will contact you shortly to confirm the pickup details.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600"
            >
              Request Another Pickup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Request Parcel Pickup</h1>
          <p className="text-slate-600">Schedule a pickup for your parcels from your location.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6">
          {/* Pickup Details */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Pickup Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pickup Address</label>
                <textarea
                  {...register("pickupAddress", { required: "Pickup address is required" })}
                  rows={3}
                  placeholder="Enter the complete address where parcels should be picked up"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errors.pickupAddress && <p className="text-red-500 text-sm">{errors.pickupAddress.message}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    {...register("pickupDate", { required: "Pickup date is required" })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.pickupDate && <p className="text-red-500 text-sm">{errors.pickupDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Time</label>
                  <select
                    {...register("pickupTime", { required: "Pickup time is required" })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                  {errors.pickupTime && <p className="text-red-500 text-sm">{errors.pickupTime.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                <input
                  {...register("contactName", { required: "Contact name is required" })}
                  placeholder="Person to contact for pickup"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                <input
                  {...register("contactPhone", { required: "Contact phone is required" })}
                  placeholder="Phone number for coordination"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errors.contactPhone && <p className="text-red-500 text-sm">{errors.contactPhone.message}</p>}
              </div>
            </div>
          </div>

          {/* Parcel Information */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Parcel Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Number of Parcels</label>
                <input
                  type="number"
                  min="1"
                  {...register("parcelCount", { required: "Parcel count is required", min: { value: 1, message: "At least 1 parcel required" } })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errors.parcelCount && <p className="text-red-500 text-sm">{errors.parcelCount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Any special instructions or notes for the pickup agent"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-blue-600 mr-3">ℹ️</div>
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">Pickup Service Information</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Pickup is available Monday to Saturday, 9 AM to 5 PM</li>
                  <li>• Parcels must be properly packaged and labeled</li>
                  <li>• Agent will call 30 minutes before arrival</li>
                  <li>• Service fee: 500 FCFA per parcel</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createPickup.isPending}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              {createPickup.isPending ? "Submitting..." : "Request Pickup"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}