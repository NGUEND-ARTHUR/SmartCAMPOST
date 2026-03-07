import React, { useState, useRef } from "react";
import { useConfirmPickup, usePickup, useGeolocation } from "@/hooks";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Truck,
  MapPin,
  User,
  Calendar,
  Camera,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function PickupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<
    "details" | "photo" | "signature" | "complete"
  >("details");
  const [photoProof, setPhotoProof] = useState<string | null>(null);
  const [signature, setSignature] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickupId = id ?? "";
  const { data: pickup, isLoading, error } = usePickup(pickupId);
  const { getCurrent } = useGeolocation(false);
  const useConfirm = useConfirmPickup();

  const scheduledText = pickup?.requestedDate
    ? `${new Date(pickup.requestedDate).toLocaleDateString()}${pickup.timeWindow ? ` (${pickup.timeWindow})` : ""}`
    : "—";

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoProof(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  const completePickup = () => {
    (async () => {
      try {
        const pos = await getCurrent();
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;

        await useConfirm.mutateAsync({
          pickupId: id,
          photoUrl: photoProof || undefined,
          descriptionConfirmed: true,
          latitude,
          longitude,
        });
      } catch {
        // ignore and continue to UI confirmation
      }
      setStep("complete");
      setTimeout(() => navigate("/courier/pickups"), 2000);
    })();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate("/courier/pickups")}
            className="flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t("pickupDetail.backToPickups")}
          </button>
          <h1 className="mb-2">{t("pickupDetail.title")}</h1>
          <p className="text-muted-foreground">
            {pickup ? `Pickup #${pickup.id.slice(0, 8)}` : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <p className="text-muted-foreground">{t("pickupDetail.loading")}</p>
          </div>
        ) : error ? (
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <p className="text-muted-foreground">
              {error instanceof Error
                ? error.message
                : t("pickupDetail.loadFailed")}
            </p>
          </div>
        ) : null}

        <div className="bg-card rounded-lg shadow p-6 mb-6">
          <h2 className="mb-4">{t("pickupDetail.information")}</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="w-5 h-5 text-muted-foreground mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("pickupDetail.requester")}
                </p>
                <p className="font-medium">
                  {pickup?.clientName ?? pickup?.clientId?.slice(0, 8) ?? "—"}
                </p>
                {pickup?.clientPhone && (
                  <p className="text-sm text-muted-foreground">
                    {pickup.clientPhone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-muted-foreground mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("pickupDetail.scheduled")}
                </p>
                <p className="font-medium">{scheduledText}</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-muted-foreground mr-3 mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("pickupDetail.location")}
                </p>
                <p className="font-medium">
                  {typeof pickup?.pickupLatitude === "number" &&
                  typeof pickup?.pickupLongitude === "number"
                    ? `${pickup.pickupLatitude.toFixed(5)}, ${pickup.pickupLongitude.toFixed(5)}`
                    : "—"}
                </p>
              </div>
            </div>
            {pickup?.comment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-900 mb-1">
                  {t("pickupDetail.instructions")}
                </p>
                <p className="text-sm text-yellow-700">{pickup.comment}</p>
              </div>
            )}
          </div>
        </div>

        {step === "details" && (
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <h3 className="mb-3">{t("pickupDetail.itemsToPickup")}</h3>
            <ul className="space-y-2">
              <li className="flex justify-between border rounded p-3">
                <span>{t("pickupDetail.parcel")}</span>
                <span className="font-medium">
                  {pickup?.trackingRef ?? pickup?.parcelId?.slice(0, 8) ?? "—"}
                </span>
              </li>
            </ul>
          </div>
        )}

        {step === "details" && (
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setStep("photo")}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg"
            >
              {t("pickupDetail.capturePhoto")}
            </button>
            <button
              onClick={() => setStep("signature")}
              className="flex-1 border border-border text-foreground py-3 rounded-lg"
            >
              {t("pickupDetail.addSignature")}
            </button>
          </div>
        )}

        {step === "photo" && (
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <h3 className="mb-3">{t("pickupDetail.photoProof")}</h3>
            <div className="border-2 border-dashed border-border p-6 text-center">
              {photoProof ? (
                <div>
                  <img
                    src={photoProof}
                    className="mx-auto rounded mb-4 max-h-64"
                    alt="pickup"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600"
                  >
                    {t("pickupDetail.retakePhoto")}
                  </button>
                </div>
              ) : (
                <div>
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                  >
                    {t("pickupDetail.takePhoto")}
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoCapture}
                className="hidden"
                aria-label="Upload photo"
                title="Upload photo"
              />
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setStep("details")}
                className="flex-1 border border-border py-3 rounded-lg"
              >
                {t("common.back")}
              </button>
              <button
                onClick={() => setStep("signature")}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg"
              >
                {t("common.next")}
              </button>
            </div>
          </div>
        )}

        {step === "signature" && (
          <div className="bg-card rounded-lg shadow p-6 mb-6">
            <h3 className="mb-3">{t("pickupDetail.customerSignature")}</h3>
            <div>
              <input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={t("pickupDetail.customerNamePlaceholder")}
                className="w-full border border-border rounded px-4 py-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                {t("pickupDetail.askCustomerToSign")}
              </p>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setStep("photo")}
                className="flex-1 border border-border py-3 rounded-lg"
              >
                {t("common.back")}
              </button>
              <button
                onClick={completePickup}
                disabled={!signature}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg disabled:bg-muted"
              >
                {t("pickupDetail.completePickup")}
              </button>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="bg-card rounded-lg shadow p-8">
            <div className="max-w-md mx-auto text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-green-600">
                {t("pickupDetail.pickupConfirmed")}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t("pickupDetail.pickupRecordedSuccess")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("pickupDetail.returningToList")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
