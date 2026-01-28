import React, { useState } from "react";

export default function MoMoPaymentPage() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("0");
  const [parcelId, setParcelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function initiate() {
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payments/momo/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount, parcelId }),
      });
      const json = await res.json();
      if (res.ok) setMessage("Payment initiated. ID: " + json.paymentId);
      else setMessage("Failed: " + (json.error || res.statusText));
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
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div className="mt-3">
        <input
          placeholder="Parcel ID (optional)"
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
