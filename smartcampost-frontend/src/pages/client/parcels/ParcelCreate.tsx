import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateParcel } from "../../../hooks/parcels";

export default function CreateParcel() {
  const navigate = useNavigate();
  const createParcel = useCreateParcel();

  const [formData, setFormData] = useState({
    content: "",
    weight: "",
    dimensions: "",
    value: "",
    fragility: "LOW",
    senderAddress: "",
    receiverAddress: "",
    deliveryMode: "AGENCY_PICKUP",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createParcel.mutateAsync(formData);
      navigate("/client/dashboard");
    } catch (error) {
      // Error handled by toast
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Create New Shipment</h1>
        <p className="text-slate-600">Fill in the details to send your parcel.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Content Description</label>
          <input
            type="text"
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Dimensions (L x W x H cm)</label>
            <input
              type="text"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleChange}
              placeholder="30 x 20 x 10"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Declared Value (XAF)</label>
            <input
              type="number"
              name="value"
              value={formData.value}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Fragility</label>
            <select
              name="fragility"
              value={formData.fragility}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Sender Address</label>
          <textarea
            name="senderAddress"
            value={formData.senderAddress}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Receiver Address</label>
          <textarea
            name="receiverAddress"
            value={formData.receiverAddress}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Mode</label>
          <select
            name="deliveryMode"
            value={formData.deliveryMode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="AGENCY_PICKUP">Agency Pickup</option>
            <option value="HOME_DELIVERY">Home Delivery</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={createParcel.isPending}
          className="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 disabled:opacity-50"
        >
          {createParcel.isPending ? "Creating..." : "Create Shipment"}
        </button>
      </form>
    </div>
  );
}