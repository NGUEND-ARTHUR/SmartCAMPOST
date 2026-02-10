import React, { useState } from "react";
import { paymentService } from "@/services";

export default function MoMoPaymentPage() {
  const [phone, setPhone] = useState("");
  const [parcelId, setParcelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function initiate() {
    setMessage(null);

    if (!phone.trim()) {
      setMessage("Phone is required");
      return;
    }

    if (!parcelId.trim()) {
      setMessage("Parcel ID is required");
      return;
    }

    setLoading(true);
    try {
      // Uses unified payment flow: backend quotes amount server-side.
      const payment = await paymentService.init({
        parcelId: parcelId.trim(),
        method: "MOBILE_MONEY",
        payerPhone: phone.trim(),
      });

      setMessage(
        `Payment initiated. ID: ${payment.id} | Amount: ${payment.amount} ${payment.currency}`,
      );
    } catch (e: any) {
      setMessage("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">Pay with MTN MoMo</h2>
      <div className="mt-3">
        <input
          placeholder="Phone (e.g. 2376...)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mt-3">
        <input
          placeholder="Parcel ID"
          value={parcelId}
          onChange={(e) => setParcelId(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mt-3">
        <button className="btn" onClick={initiate} disabled={loading}>
          {loading ? "Initiating..." : "Pay with MoMo"}
        </button>
      </div>
      {message && <div className="mt-3">{message}</div>}
    </div>
  );
}
