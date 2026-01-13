import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Camera,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { TrackingMap } from "@/components/maps";
import { QRCodeDisplay } from "@/components/qrcode";
import { ScanEvent, Parcel } from "@/types";
import { canTransition } from "@/lib/transitions";
import { ActionButton } from "@/components/transitions/ActionButton";
import { EmptyState } from "@/components/EmptyState";
import { useParcel, useScanEventsForParcel } from "@/hooks";
import { toast } from "sonner";

const eventIcons: Record<string, any> = {
  CREATED: Package,
  AT_ORIGIN_AGENCY: MapPin,
  IN_TRANSIT: Truck,
  ARRIVED_HUB: MapPin,
  DEPARTED_HUB: Truck,
  ARRIVED_DESTINATION: MapPin,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle,
  RETURNED: AlertCircle,
};

export default function ParcelDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    data: parcel,
    isLoading: parcelLoading,
    error: parcelError,
  } = useParcel(id || "");
  const { data: scanEvents = [], isLoading: eventsLoading } =
    useScanEventsForParcel(id || "");

  const isLoading = parcelLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (parcelError || !parcel) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/client/parcels")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Parcels
        </Button>
        <EmptyState
          icon={Package}
          title="Parcel not found"
          description={
            parcelError instanceof Error
              ? parcelError.message
              : "The parcel could not be loaded"
          }
        />
      </div>
    );
  }

  const cancelDecision = canTransition(
    { kind: "parcel", status: parcel.status as any },
    { type: "PARCEL_SET_STATUS", to: "CANCELLED" },
  );
  const canCancel = cancelDecision.allowed;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/client/parcels")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Parcels
      </Button>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{parcel.trackingRef}</h1>
          <StatusBadge status={parcel.status} />
        </div>
        <p className="text-muted-foreground">
          Created on {new Date(parcel.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Parcel Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-medium">{parcel.weight} kg</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dimensions</p>
                <p className="font-medium">{parcel.dimensions || "N/A"} cm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Declared Value</p>
                <p className="font-medium">
                  {parcel.declaredValue?.toLocaleString() || "N/A"} XAF
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fragile</p>
                <p className="font-medium">{parcel.fragile ? "Yes" : "No"}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Service Type
                </span>
                <Badge variant="secondary">{parcel.serviceType}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Delivery Option
                </span>
                <Badge variant="secondary">{parcel.deliveryOption}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Payment Option
                </span>
                <Badge variant="secondary">{parcel.paymentOption}</Badge>
              </div>
            </div>

            {parcel.descriptionComment && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm">{parcel.descriptionComment}</p>
                </div>
              </>
            )}

            {parcel.expectedDeliveryAt && (
              <>
                <Separator />
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">
                      Expected Delivery:{" "}
                    </span>
                    <span className="font-medium">
                      {new Date(parcel.expectedDeliveryAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-medium">Sender</p>
              </div>
              <div className="ml-10 text-sm text-muted-foreground">
                <p>John Doe</p>
                <p>123 Main Street</p>
                <p>Douala, Littoral</p>
                <p>Cameroon</p>
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <p className="font-medium">Recipient</p>
              </div>
              <div className="ml-10 text-sm text-muted-foreground">
                <p>Jane Smith</p>
                <p>456 Avenue de l'Indépendance</p>
                <p>Yaoundé, Centre</p>
                <p>Cameroon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code for Printing */}
        <QRCodeDisplay
          trackingRef={parcel.trackingRef}
          parcelId={parcel.id}
          senderCity={parcel.senderCity}
          recipientCity={parcel.recipientCity}
          serviceType={parcel.serviceType}
          createdAt={parcel.createdAt}
          size="medium"
          showLabel={true}
          showActions={true}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Timeline</CardTitle>
          <CardDescription>
            Complete history of your parcel's journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {scanEvents.map((event, index) => {
              const Icon = eventIcons[event.eventType] || Package;
              const isLast = index === scanEvents.length - 1;
              return (
                <div key={event.id} className="relative pb-8">
                  {!isLast && (
                    <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  <div className="flex gap-4">
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${index === 0 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="font-medium">{event.eventType}</p>
                          {event.locationNote && (
                            <p className="text-sm text-muted-foreground">
                              {event.locationNote}
                            </p>
                          )}
                        </div>
                        <time className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleDateString()}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Map</CardTitle>
          <CardDescription>
            Visual representation of your parcel&apos;s journey
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TrackingMap
            trackingId={parcel.trackingRef}
            scanEvents={scanEvents.map((e) => ({
              id: e.id,
              eventType: e.eventType,
              timestamp: e.timestamp,
              agencyName: e.agencyName,
            }))}
            currentStatus={parcel.status}
            showAnimation={true}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <Camera className="w-4 h-4 mr-2" />
              View Photo
            </Button>
            <Button variant="outline">Download Receipt</Button>
            <Button variant="outline">Report Issue</Button>
            <ActionButton
              variant="destructive"
              disabled={!canCancel}
              tooltip={
                !canCancel && "reason" in cancelDecision
                  ? cancelDecision.reason
                  : undefined
              }
              onClick={() => {
                if (!canCancel) return;
                toast.success("Cancel parcel (UI only)", {
                  description: `Parcel ${id}`,
                });
              }}
            >
              Cancel Parcel
            </ActionButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
