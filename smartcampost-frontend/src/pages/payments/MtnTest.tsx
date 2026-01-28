import React, { useState } from "react";
import { initMtnPayment, getMtnToken } from "@/services/mtn/mtn.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MtnTest() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(1000);
  const [res, setRes] = useState<any>(null);

  const doToken = async () => {
    const t = await getMtnToken();
    setRes(t);
  };

  const doInit = async () => {
    const r = await initMtnPayment({
      amount,
      msisdn: phone,
      externalId: Date.now().toString(),
    });
    setRes(r);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">MTN Mobile Money Test</h1>
      <div className="grid gap-2 max-w-sm">
        <label className="text-sm">Phone (MSISDN)</label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+2376XXXXXXXX"
        />
        <label className="text-sm">Amount</label>
        <Input
          value={String(amount)}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <div className="flex gap-2">
          <Button onClick={doToken}>Get Token</Button>
          <Button onClick={doInit}>Init Payment</Button>
        </div>
        <div className="mt-4">
          <pre className="bg-gray-100 p-2 rounded text-xs">
            {res ? JSON.stringify(res, null, 2) : "(no response)"}
          </pre>
        </div>
      </div>
    </div>
  );
}
