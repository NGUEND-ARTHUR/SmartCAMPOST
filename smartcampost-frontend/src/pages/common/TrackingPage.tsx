import React, { useState } from "react";

export default function TrackingPage() {
  const [number, setNumber] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function lookup() {
    if (!number) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/track/parcel/${encodeURIComponent(number)}`,
      );
      if (res.ok) setResult(await res.json());
      else setResult({ error: "Not found" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">Track Parcel</h2>
      <div className="mt-4">
        <input
          className="border p-2"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Enter tracking number"
        />
        <button className="ml-2 btn" onClick={lookup} disabled={loading}>
          Lookup
        </button>
      </div>
      <div className="mt-6">
        {loading && <div>Loading…</div>}
        {result && (
          <div>
            {result.error ? (
              <div>{result.error}</div>
            ) : (
              <div>
                <div>
                  <strong>Status:</strong> {result.status}
                </div>
                <div>
                  <strong>Last location:</strong> {result.lastLocation}
                </div>
                <div className="mt-4">
                  <strong>Timeline</strong>
                  <ul className="mt-2">
                    {result.timeline?.map((t: any, i: number) => (
                      <li key={i} className="border p-2 mb-2">
                        <div>
                          {t.scanType} — {t.location} — {t.timestamp}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
