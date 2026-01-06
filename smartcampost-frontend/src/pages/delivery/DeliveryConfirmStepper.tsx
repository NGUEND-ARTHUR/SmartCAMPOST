import { FormEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ReadOnlyTrackingMap } from "../../components/maps/ReadOnlyTrackingMap";
import {
  sendDeliveryOtp,
  verifyDeliveryOtp,
  confirmFinalDelivery,
  type DeliveryProofRequest,
} from "../../services/deliveryService";
import { getParcelById } from "../../services/parcelService";
import { ErrorBanner } from "../../components/feedback/ErrorBanner";
import { EmptyState } from "../../components/feedback/EmptyState";

type Step = 1 | 2 | 3 | 4;

export default function DeliveryConfirmStepper() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const [step, setStep] = useState<Step>(1);
  const [otp, setOtp] = useState("");
  const [proofType, setProofType] =
    useState<DeliveryProofRequest["proofType"]>("PHOTO");
  const [proofUrl, setProofUrl] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: parcel, isLoading, isError } = useQuery({
    queryKey: ["parcel", parcelId],
    queryFn: () => getParcelById(String(parcelId)),
    enabled: !!parcelId,
  });

  if (!parcelId) {
    return <ErrorBanner>Missing parcel id in URL.</ErrorBanner>;
  }

  const handleSendOtp = async () => {
    if (!parcelId || !parcel?.receiverPhone) return;
    setError(null);
    setSubmitting(true);
    try {
      await sendDeliveryOtp({
        parcelId,
        phoneNumber: parcel.receiverPhone,
      });
      setStep(2);
    } catch {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const ok = await verifyDeliveryOtp({ parcelId, otpCode: otp });
      if (!ok) {
        setError("Invalid or expired OTP.");
        return;
      }
      setStep(3);
    } catch {
      setError("Failed to verify OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmFinal = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await confirmFinalDelivery({
        otp: { parcelId, otpCode: otp },
        proof: {
          parcelId,
          proofType,
          proofUrl: proofUrl || undefined,
          note: note || undefined,
        },
      });
      setStep(4);
    } catch {
      setError("Failed to confirm delivery.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <p className="text-xs text-slate-300">Loading parcel...</p>;
  }

  if (isError || !parcel) {
    return (
      <ErrorBanner>
        Could not load parcel. Check that the parcel exists and you are
        assigned to it.
      </ErrorBanner>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">
            Delivery confirmation
          </p>
          <h2 className="text-lg font-semibold text-slate-50">
            {parcel.trackingRef}
          </h2>
          <p className="text-xs text-slate-400">
            Receiver: {parcel.receiverName ?? "-"} •{" "}
            {parcel.receiverPhone ?? "-"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span
            className={`px-2 py-1 rounded-full border ${
              parcel.status === "DELIVERED"
                ? "border-emerald-500/60 text-emerald-300"
                : "border-amber-500/60 text-amber-300"
            }`}
          >
            {parcel.status}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: stepper */}
        <div className="space-y-4">
          <ol className="flex items-center gap-2 text-[11px] text-slate-400">
            <li className={step >= 1 ? "text-amber-300 font-medium" : ""}>
              1. Send OTP
            </li>
            <li>›</li>
            <li className={step >= 2 ? "text-amber-300 font-medium" : ""}>
              2. Verify OTP
            </li>
            <li>›</li>
            <li className={step >= 3 ? "text-amber-300 font-medium" : ""}>
              3. Capture proof
            </li>
            <li>›</li>
            <li className={step === 4 ? "text-emerald-300 font-medium" : ""}>
              4. Completed
            </li>
          </ol>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          {step === 1 && (
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="text-sm font-semibold text-slate-100">
                Step 1 — Send OTP
              </h3>
              <p className="text-xs text-slate-400">
                We will send an OTP to{" "}
                <span className="font-mono">
                  {parcel.receiverPhone ?? "N/A"}
                </span>
                . Ask the recipient to share it with you.
              </p>
              <button
                onClick={handleSendOtp}
                disabled={submitting}
                className="mt-2 inline-flex justify-center rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send OTP"}
              </button>
            </div>
          )}

          {step === 2 && (
            <form
              onSubmit={handleVerifyOtp}
              className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <h3 className="text-sm font-semibold text-slate-100">
                Step 2 — Verify OTP
              </h3>
              <p className="text-xs text-slate-400">
                Enter the 6-digit OTP received by the recipient.
              </p>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-center text-sm text-slate-50 tracking-[0.4em]"
                placeholder="••••••"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex justify-center rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
              >
                {submitting ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          )}

          {step === 3 && (
            <form
              onSubmit={handleConfirmFinal}
              className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <h3 className="text-sm font-semibold text-slate-100">
                Step 3 — Capture proof & confirm
              </h3>
              <div className="space-y-2">
                <label className="text-xs text-slate-300">
                  Proof type
                </label>
                <div className="flex gap-2 text-[11px]">
                  {["PHOTO", "SIGNATURE", "OTP"].map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() =>
                        setProofType(pt as DeliveryProofRequest["proofType"])
                      }
                      className={`px-3 py-1 rounded-full border ${
                        proofType === pt
                          ? "border-amber-500 bg-amber-500/10 text-amber-300"
                          : "border-slate-700 text-slate-300"
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300">
                  Proof URL (photo/signature)
                </label>
                <input
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex justify-center rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
              >
                {submitting ? "Confirming..." : "Confirm delivery"}
              </button>
            </form>
          )}

          {step === 4 && (
            <EmptyState
              title="Delivery completed"
              description="The parcel has been marked as DELIVERED. Any COD payment has been handled by the backend."
            />
          )}
        </div>

        {/* Right: map + summary */}
        <div className="space-y-4">
          <ReadOnlyTrackingMap trackingRef={parcel.trackingRef} />
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300 space-y-1">
            <p>
              <span className="text-slate-400">From:</span>{" "}
              {parcel.originAgencyId ?? "Origin agency not set"}
            </p>
            <p>
              <span className="text-slate-400">To:</span>{" "}
              {parcel.destinationAgencyId ?? "Destination agency not set"}
            </p>
            <p>
              <span className="text-slate-400">Option:</span>{" "}
              {parcel.deliveryOption}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


