import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import DeliveryWorkflowStepper from "@/components/delivery/DeliveryWorkflowStepper";

export default function DeliveryDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const delivery = {
    id: id || "D-0000",
    trackingNumber: "PKG789012",
    customerName: "Jane Smith",
    customerPhone: "+1 (555) 987-6543",
    address: "456 Oak Ave",
    deliveryInstructions: "Leave at front door",
    packageDetails: {
      weight: 2.5,
      dimensions: "30x20x15 cm",
      description: "Electronics - Handle with care",
    },
    requirements: {
      requiresOtp: true,
      requiresSignature: true,
      requiresPhoto: true,
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
