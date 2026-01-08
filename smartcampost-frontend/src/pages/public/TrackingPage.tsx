import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetParcelByTracking } from "../../hooks/parcels";
import ParcelTimeline from "../../components/parcel/ParcelTimeline";
import { Badge } from "../../components/ui/Badge";

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const trackingRef = searchParams.get("ref") || "";
  const [inputRef, setInputRef] = useState(trackingRef);

  const { data: parcel, isLoading, error } = useGetParcelByTracking(inputRef);

  useEffect(() => {
    if (trackingRef) setInputRef(trackingRef);
  }, [trackingRef]);

  const handleSearch = () => {
    if (inputRef.trim()) {
      window.location.href = `/track?ref=${inputRef}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-slate-900">
              Smart<span className="text-amber-500">CAMPOST</span>
            </Link>
            <Link to="/auth/login" className="text-slate-600 hover:text-slate-900">
              Login
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Track Your Parcel</h1>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter tracking number"
              value={inputRef}
              onChange={(e) => setInputRef(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold"
            >
              Track
            </button>
          </div>
        </div>

        {/* Parcel Info */}
        {isLoading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-center py-8 text-red-600">Parcel not found</div>}
        {parcel && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Parcel {parcel.trackingRef}
                </h2>
                <p className="text-slate-600">From: {parcel.senderAddress} → To: {parcel.receiverAddress}</p>
              </div>
              <Badge variant={parcel.status === "DELIVERED" ? "success" : "default"}>
                {parcel.status}
              </Badge>
            </div>

            {/* Timeline */}
            <ParcelTimeline parcelId={parcel.id} />

            {/* Support */}
            <div className="mt-8 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">Need Help?</h3>
              <p className="text-slate-600">
                Contact support at support@smartcampost.cm or call +237 123 456 789
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}