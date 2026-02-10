import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import DeliveryWorkflowStepper from "@/components/delivery/DeliveryWorkflowStepper";
import EmptyState from "@/components/EmptyState";
import { useParcel } from "@/hooks";

export default function DeliveryDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const parcelId = id ?? "";
  const parcelQuery = useParcel(parcelId);

  if (!parcelId) {
    return (
      <EmptyState
        title={t("Missing delivery id")}
        description={t("Please go back and select a delivery")}
        actionLabel={t("Back to deliveries")}
        onAction={() => navigate("/courier/deliveries")}
      />
    );
  }

  if (parcelQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Delivery</h1>
            <p className="text-muted-foreground">Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  if (parcelQuery.isError || !parcelQuery.data) {
    return (
      <EmptyState
        title={t("Unable to load delivery")}
        description={t("Please try again")}
        actionLabel={t("Back to deliveries")}
        onAction={() => navigate("/courier/deliveries")}
      />
    );
  }

  const parcel = parcelQuery.data;
  const addressParts = [
    parcel.recipientLabel,
    parcel.recipientCity,
    parcel.recipientRegion,
    parcel.recipientCountry,
  ].filter(Boolean);

  const delivery = {
    id: parcel.id,
    trackingNumber: parcel.trackingRef,
    status: parcel.status,
    deliveryOption: parcel.deliveryOption,
    customerName: parcel.recipientLabel || parcel.clientName || t("Recipient"),
    customerPhone: t("—"),
    address: addressParts.join(", ") || t("—"),
    deliveryInstructions: parcel.descriptionComment || undefined,
    packageDetails: {
      weight: parcel.weight,
      dimensions: parcel.dimensions || undefined,
      description: parcel.descriptionComment || undefined,
    },
    requirements: {
      requiresOtp: parcel.deliveryOption === "HOME",
      requiresSignature: false,
      requiresPhoto: false,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery</h1>
          <p className="text-muted-foreground">{delivery.trackingNumber}</p>
        </div>
        <button
          onClick={() => navigate("/courier/deliveries")}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to deliveries
        </button>
      </div>

      <DeliveryWorkflowStepper
        delivery={delivery}
        onExit={() => navigate("/courier/deliveries")}
        onComplete={() => navigate("/courier/deliveries")}
      />
    </div>
  );
}
