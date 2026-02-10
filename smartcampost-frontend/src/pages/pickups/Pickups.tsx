import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Truck, Plus, Calendar, Clock, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { PickupState } from "@/types";
import { toast } from "sonner";
import {
  useMyPickups,
  useCreatePickup,
  useMyParcels,
  useGeolocation,
} from "@/hooks";

const stateColors: Record<PickupState, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function Pickups() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeWindow, setSelectedTimeWindow] = useState("");
  const [comment, setComment] = useState("");
  const [manualOverride, setManualOverride] = useState(false);
  const [pickupLatitude, setPickupLatitude] = useState("");
  const [pickupLongitude, setPickupLongitude] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useMyPickups(page, 20);
  const { data: parcelsData } = useMyParcels(0, 100);
  const createPickup = useCreatePickup();
  const { getCurrent } = useGeolocation(false);

  const pickups = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const parcels = parcelsData?.content ?? [];

  const handleRequestPickup = () => {
    if (!selectedParcel || !selectedDate || !selectedTimeWindow) {
      toast.error("Please fill in all required fields");
      return;
    }

    (async () => {
      try {
        let lat: number;
        let lng: number;

        if (manualOverride) {
          lat = Number(pickupLatitude);
          lng = Number(pickupLongitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            toast.error("Please provide valid latitude/longitude");
            return;
          }
        } else {
          const pos = await getCurrent();
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          setPickupLatitude(String(lat));
          setPickupLongitude(String(lng));
        }

        await createPickup.mutateAsync({
          parcelId: selectedParcel,
          requestedDate: selectedDate,
          timeWindow: selectedTimeWindow,
          comment,
          pickupLatitude: lat,
          pickupLongitude: lng,
          locationMode: manualOverride ? "MANUAL_OVERRIDE" : "GPS_DEFAULT",
        });

        toast.success("Pickup request submitted successfully!");
        setIsDialogOpen(false);
        setSelectedParcel("");
        setSelectedDate("");
        setSelectedTimeWindow("");
        setComment("");
        setManualOverride(false);
        setPickupLatitude("");
        setPickupLongitude("");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to create pickup",
        );
      }
    })();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pickup Requests</h1>
          <p className="text-muted-foreground">
            Schedule pickups for your parcels
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Request Pickup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Pickup</DialogTitle>
              <DialogDescription>
                Schedule a courier to pick up your parcel
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="parcel">Select Parcel *</Label>
                <Select
                  value={selectedParcel}
                  onValueChange={setSelectedParcel}
                >
                  <SelectTrigger id="parcel">
                    <SelectValue placeholder="Choose a parcel" />
                  </SelectTrigger>
                  <SelectContent>
                    {parcels.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.trackingRef} - {p.weight}kg
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Pickup Date *</Label>
                <input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  title="Select pickup date"
                  placeholder="Select date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeWindow">Time Window *</Label>
                <Select
                  value={selectedTimeWindow}
                  onValueChange={setSelectedTimeWindow}
                >
                  <SelectTrigger id="timeWindow">
                    <SelectValue placeholder="Choose a time window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00-12:00">
                      Morning (09:00 - 12:00)
                    </SelectItem>
                    <SelectItem value="12:00-15:00">
                      Afternoon (12:00 - 15:00)
                    </SelectItem>
                    <SelectItem value="15:00-18:00">
                      Evening (15:00 - 18:00)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">
                  Additional Instructions (Optional)
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Any special instructions for the courier..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="manualOverride"
                    checked={manualOverride}
                    onCheckedChange={setManualOverride}
                    title="Manual location override"
                    aria-label="Manual location override"
                  />
                  <Label htmlFor="manualOverride">
                    Manual location override
                  </Label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="pickupLatitude">Latitude</Label>
                    <Input
                      id="pickupLatitude"
                      value={pickupLatitude}
                      onChange={(e) => setPickupLatitude(e.target.value)}
                      placeholder="e.g. 4.0511"
                      disabled={!manualOverride}
                      inputMode="decimal"
                      title="Pickup latitude"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pickupLongitude">Longitude</Label>
                    <Input
                      id="pickupLongitude"
                      value={pickupLongitude}
                      onChange={(e) => setPickupLongitude(e.target.value)}
                      placeholder="e.g. 9.7679"
                      disabled={!manualOverride}
                      inputMode="decimal"
                      title="Pickup longitude"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestPickup}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <EmptyState
          icon={Truck}
          title="Error loading pickups"
          description={
            error instanceof Error ? error.message : "An error occurred"
          }
        />
      ) : pickups.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No pickup requests"
          description="Schedule a pickup for your parcels"
          actionLabel="Request Pickup"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4">
          {pickups.map((pickup) => (
            <Card key={pickup.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Truck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">
                          Pickup #{pickup.id.slice(0, 8)}
                        </h3>
                        <Badge
                          className={
                            stateColors[pickup.state as PickupState] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {pickup.state}
                        </Badge>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Package className="w-4 h-4" />
                          <span>
                            Parcel:{" "}
                            <span className="font-medium text-foreground">
                              {pickup.parcelId.slice(0, 8)}
                            </span>
                          </span>
                        </div>
                        {pickup.requestedDate && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(
                                pickup.requestedDate,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {pickup.courierId && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Truck className="w-4 h-4" />
                            <span>
                              Courier:{" "}
                              <span className="font-medium text-foreground">
                                {pickup.courierId.slice(0, 8)}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                      {pickup.comment && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            Instructions:{" "}
                          </span>
                          <span>{pickup.comment}</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Requested on{" "}
                        {new Date(pickup.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {pickup.state === "REQUESTED" && (
                      <Button variant="outline" size="sm">
                        Cancel
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/client/pickups/${pickup.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground self-center">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
