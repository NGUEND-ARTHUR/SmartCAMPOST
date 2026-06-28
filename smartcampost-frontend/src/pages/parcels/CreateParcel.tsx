import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  CreditCard,
  Camera,
  Loader2,
  Search,
  User,
  Banknote,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCreateParcel, useMyAddresses } from "@/hooks";
import { useAuthStore } from "@/store/authStore";
import LocationPicker from "@/components/maps/LocationPicker";
import { addressService } from "@/services/addressService";
import { paymentService } from "@/services/payments/payments.api";
import {
  tariffService,
  TariffQuoteResponse,
} from "@/services/dashboard/tariffs.api";
import { useQueryClient } from "@tanstack/react-query";

interface ParcelFormData {
  senderAddress: string;
  recipientAddress: string;
  recipientName: string;
  recipientPhone: string;
  recipientCity: string;
  weight: number;
  dimensions: string;
  declaredValue: number;
  isFragile: boolean;
  serviceType: "STANDARD" | "EXPRESS";
  deliveryOption: "AGENCY" | "HOME";
  paymentOption: "PREPAID" | "COD";
  photoUrl?: string;
  descriptionComment?: string;
}

export function CreateParcel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userRole = useAuthStore((s) => s.user?.role?.toUpperCase() ?? "CLIENT");
  const isAgent = userRole !== "CLIENT";

  const [currentStep, setCurrentStep] = useState(0);
  const [isFragile, setIsFragile] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<"STANDARD" | "EXPRESS">(
    "STANDARD",
  );
  const [deliveryOption, setDeliveryOption] = useState<"AGENCY" | "HOME">(
    "AGENCY",
  );
  const [paymentOption, setPaymentOption] = useState<"PREPAID" | "COD">(
    "PREPAID",
  );
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY">("CASH");
  const [momoPhone, setMomoPhone] = useState("");

  // Agent flow: lookup client by phone
  const [clientPhone, setClientPhone] = useState("");
  const [clientPhoneConfirmed, setClientPhoneConfirmed] = useState(false);
  const [clientAddresses, setClientAddresses] = useState<Array<{id: string; label: string; street?: string | null; city: string; region: string; country: string; latitude?: number | null; longitude?: number | null}>>([]);
  const [clientAddressesLoading, setClientAddressesLoading] = useState(false);
  const [clientLookupError, setClientLookupError] = useState("");

  const createParcel = useCreateParcel();

  // Client flow: use own addresses (disabled for agent/staff)
  const {
    data: myAddresses = [],
    isLoading: myAddressesLoading,
    error: myAddressesError,
  } = useMyAddresses(!isAgent);

  // Use client's addresses for agents, own addresses for clients
  const addresses = isAgent ? clientAddresses : myAddresses;
  const addressesLoading = isAgent ? clientAddressesLoading : myAddressesLoading;
  const addressesError = isAgent ? (clientLookupError || null) : myAddressesError;

  const [senderAddressId, setSenderAddressId] = useState<string>("");
  const [recipientAddressId, setRecipientAddressId] = useState<string>("");

  const handleLookupClient = async () => {
    if (!clientPhone.trim()) {
      toast.error("Please enter a client phone number");
      return;
    }
    setClientAddressesLoading(true);
    setClientLookupError("");
    try {
      const addrs = await addressService.getClientAddresses(clientPhone.trim());
      setClientAddresses(addrs as typeof clientAddresses);
      setClientPhoneConfirmed(true);
      setSenderAddressId("");
      setRecipientAddressId("");
      toast.success(`Client found — ${addrs.length} address(es) loaded`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Client not found";
      setClientLookupError(msg);
      setClientPhoneConfirmed(false);
      setClientAddresses([]);
      toast.error(msg);
    } finally {
      setClientAddressesLoading(false);
    }
  };

  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [addAddressTarget, setAddAddressTarget] = useState<
    "sender" | "recipient"
  >("sender");
  const [showMapTab, setShowMapTab] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "",
    street: "",
    city: "",
    region: "",
    country: "Cameroon",
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [priceQuote, setPriceQuote] = useState<TariffQuoteResponse | null>(
    null,
  );
  const [priceLoading, setPriceLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    watch,
  } = useForm<ParcelFormData>();

  const watchedWeight = watch("weight");

  const steps = [
    { title: t("parcels.create.steps.addresses"), icon: MapPin },
    { title: t("parcels.create.steps.parcelDetails"), icon: Package },
    { title: t("parcels.create.steps.service"), icon: Truck },
    { title: t("parcels.create.steps.payment"), icon: CreditCard },
  ];

  const onSubmit = async (data: ParcelFormData) => {
    if (!senderAddressId || !recipientAddressId) {
      toast.error(t("parcels.create.toasts.selectAddresses"));
      return;
    }
    if (isAgent && !clientPhoneConfirmed) {
      toast.error("Please look up a client first");
      return;
    }
    if (paymentMethod === "MOBILE_MONEY" && !momoPhone.trim()) {
      toast.error("Please enter your mobile money phone number");
      return;
    }
    createParcel.mutate(
      {
        ...(isAgent ? { clientPhone: clientPhone.trim() } : {}),
        senderAddressId,
        recipientAddressId,
        weight: data.weight,
        isFragile: isFragile,
        serviceType,
        deliveryOption,
        paymentOption: paymentMethod === "CASH" ? "COD" : "PREPAID",
        description: data.descriptionComment,
        photoUrl: photoPreview || undefined,
      },
      {
        onSuccess: async (parcelResponse) => {
          if (paymentMethod === "MOBILE_MONEY" && momoPhone.trim()) {
            try {
              toast.info("Initiating mobile money payment...");
              const payResult = await paymentService.init({
                parcelId: parcelResponse.id,
                method: "MOBILE_MONEY",
                payerPhone: momoPhone.trim(),
              });
              if (payResult.status === "FAILED") {
                toast.warning("Parcel created! Payment gateway is temporarily unavailable. You can retry from parcel details.");
              } else {
                toast.success("Payment request sent to your phone. Please confirm on your device.");
              }
            } catch {
              toast.success("Parcel created successfully! You can initiate payment from the parcel details page.");
            }
          } else {
            toast.success(t("parcels.create.toasts.created"));
          }
          navigate(isAgent ? `/${userRole.toLowerCase()}/parcels` : "/client/parcels");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : t("parcels.create.toasts.createFailed"),
          );
        },
      },
    );
  };

  /** Validate required fields for the current step before advancing */
  const validateCurrentStep = (): boolean => {
    if (currentStep === 0) {
      if (isAgent && !clientPhoneConfirmed) {
        toast.error("Please look up a client first");
        return false;
      }
      if (!senderAddressId) {
        toast.error(t("parcels.create.toasts.selectSenderAddress"));
        return false;
      }
      if (!recipientAddressId) {
        toast.error(t("parcels.create.toasts.selectRecipientAddress"));
        return false;
      }
      return true;
    }
    if (currentStep === 1) {
      const weight = getValues("weight");
      if (!weight || weight <= 0) {
        toast.error(t("parcels.create.toasts.validWeight"));
        return false;
      }
      return true;
    }
    // Steps 2 (service) and 3 (payment) have defaults, always valid
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
  };

  const canSaveAddress = useMemo(() => {
    return Boolean(
      addressForm.label.trim() &&
      addressForm.city.trim() &&
      addressForm.region.trim() &&
      addressForm.country.trim(),
    );
  }, [addressForm]);

  const openAddAddress = (target: "sender" | "recipient") => {
    setAddAddressTarget(target);
    setShowMapTab(false);
    setSelectedLat(null);
    setSelectedLng(null);
    setAddressForm({
      label: "",
      street: "",
      city: "",
      region: "",
      country: "Cameroon",
    });
    setIsAddAddressOpen(true);
  };

  // ── Dynamic pricing: fetch server-side quote when inputs change ──
  const senderAddr = addresses.find((a) => a.id === senderAddressId);
  const recipientAddr = addresses.find((a) => a.id === recipientAddressId);

  useEffect(() => {
    const weight = getValues("weight");
    if (!weight || weight <= 0) {
      const timer = window.setTimeout(() => {
        setPriceQuote(null);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPriceLoading(true);
      tariffService
        .quote({
          serviceType,
          weight: Number(weight),
          originZone: senderAddr?.region ?? undefined,
          destinationZone: recipientAddr?.region ?? undefined,
          originCity: senderAddr?.city ?? undefined,
          destinationCity: recipientAddr?.city ?? undefined,
        })
        .then((q) => {
          if (!controller.signal.aborted) setPriceQuote(q);
        })
        .catch(() => {
          if (!controller.signal.aborted) setPriceQuote(null);
        })
        .finally(() => {
          if (!controller.signal.aborted) setPriceLoading(false);
        });
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [getValues, recipientAddr?.city, senderAddr?.city, serviceType, watchedWeight]);

  const handleCreateAddress = async () => {
    if (!canSaveAddress) {
      toast.error(t("addresses.toasts.fillLabelCityRegion"));
      return;
    }

    setIsSavingAddress(true);
    try {
      const addrData = {
        label: addressForm.label.trim(),
        street: addressForm.street.trim() || undefined,
        city: addressForm.city.trim(),
        region: addressForm.region.trim(),
        country: addressForm.country.trim(),
        latitude: selectedLat ?? undefined,
        longitude: selectedLng ?? undefined,
      };

      const created = isAgent
        ? await addressService.createAddressForClient(clientPhone.trim(), addrData)
        : await addressService.createAddress(addrData);

      if (isAgent) {
        // Refresh client addresses
        const addrs = await addressService.getClientAddresses(clientPhone.trim());
        setClientAddresses(addrs as typeof clientAddresses);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["myAddresses"] });
      }

      if (addAddressTarget === "sender") {
        setSenderAddressId(created.id);
      } else {
        setRecipientAddressId(created.id);
      }

      toast.success(t("addresses.toasts.added"));
      setIsAddAddressOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("addresses.toasts.requiredFields"));
    } finally {
      setIsSavingAddress(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(isAgent ? `/${userRole.toLowerCase()}` : "/client")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("common.back")}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t("parcels.createTitle")}</CardTitle>
          <CardDescription>{t("parcels.create.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isAddAddressOpen} onOpenChange={setIsAddAddressOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {addAddressTarget === "sender"
                    ? "Add sender address"
                    : "Add recipient address"}
                </DialogTitle>
                <DialogDescription>
                  Add an address manually or pick it on the map.
                </DialogDescription>
              </DialogHeader>

              <Tabs
                value={showMapTab ? "map" : "form"}
                onValueChange={(value) => setShowMapTab(value === "map")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="form">Manual</TabsTrigger>
                  <TabsTrigger value="map">Map</TabsTrigger>
                </TabsList>

                <TabsContent value="form" className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="newAddrLabel">Label</Label>
                    <Input
                      id="newAddrLabel"
                      value={addressForm.label}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          label: e.target.value,
                        })
                      }
                      placeholder="Home / Office / Shop"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newAddrStreet">Street</Label>
                    <Input
                      id="newAddrStreet"
                      value={addressForm.street}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          street: e.target.value,
                        })
                      }
                      placeholder="Street / Landmark"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newAddrCity">City</Label>
                      <Input
                        id="newAddrCity"
                        value={addressForm.city}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            city: e.target.value,
                          })
                        }
                        placeholder="Douala"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newAddrRegion">Region</Label>
                      <Input
                        id="newAddrRegion"
                        value={addressForm.region}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            region: e.target.value,
                          })
                        }
                        placeholder="Littoral"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newAddrCountry">Country</Label>
                    <Input
                      id="newAddrCountry"
                      value={addressForm.country}
                      disabled
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          country: e.target.value,
                        })
                      }
                    />
                  </div>

                  {selectedLat != null && selectedLng != null && (
                    <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        Map Location Captured Successfully
                      </span>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="map" className="py-4">
                  <LocationPicker
                    latitude={selectedLat}
                    longitude={selectedLng}
                    compact
                    allowManualInput={false}
                    onLocationChange={(lat, lng) => {
                      setSelectedLat(lat);
                      setSelectedLng(lng);
                    }}
                    onLocationResolved={(result) => {
                      const fullStreet = [result.street, result.quarter]
                        .filter(Boolean)
                        .join(", ");
                      const autoLabel = [result.city, result.region]
                        .filter(Boolean)
                        .join(", ");
                      setAddressForm((prev) => ({
                        ...prev,
                        label: prev.label || autoLabel || "Map location",
                        street: fullStreet || prev.street,
                        city: result.city || prev.city,
                        region: result.region || prev.region,
                      }));
                    }}
                  />
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddAddressOpen(false)}
                  disabled={isSavingAddress}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleCreateAddress}
                  disabled={isSavingAddress || !canSaveAddress}
                >
                  {isSavingAddress ? "Saving..." : "Save address"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Agent flow: client phone lookup */}
          {isAgent && (
            <div className="mb-6 p-4 rounded-lg border border-border bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-primary" />
                <Label className="text-base font-semibold">Client Phone Number</Label>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Enter the client&apos;s phone number to create a parcel on their behalf.
              </p>
              <div className="flex gap-2">
                <Input
                  value={clientPhone}
                  onChange={(e) => {
                    setClientPhone(e.target.value);
                    if (clientPhoneConfirmed) {
                      setClientPhoneConfirmed(false);
                      setClientAddresses([]);
                      setSenderAddressId("");
                      setRecipientAddressId("");
                    }
                  }}
                  placeholder="+237655189919"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleLookupClient}
                  disabled={clientAddressesLoading || !clientPhone.trim()}
                >
                  {clientAddressesLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Look up
                </Button>
              </div>
              {clientPhoneConfirmed && (
                <p className="text-sm text-green-500 mt-2">
                  Client found — {clientAddresses.length} address(es) available
                </p>
              )}
              {clientLookupError && (
                <p className="text-sm text-red-500 mt-2">{clientLookupError}</p>
              )}
            </div>
          )}

          {/* Error for client address loading */}
          {!isAgent && Boolean(addressesError) && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg dark:bg-red-900/30 dark:text-red-400">
              <p className="font-semibold">Error loading addresses</p>
              <p className="text-sm">
                {addressesError instanceof Error
                  ? addressesError.message
                  : "Failed to load your addresses. Please try again."}
              </p>
            </div>
          )}
          <div className="mb-8">
            <div className="flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : isCompleted
                            ? "bg-green-600 text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-sm ${isActive ? "font-semibold" : ""}`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="relative mt-4">
              <div className="absolute top-0 left-0 h-1 bg-muted w-full" />
              <div
                className={`absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-300 ${
                  currentStep === 0
                    ? "w-0"
                    : currentStep === 1
                      ? "w-1/4"
                      : currentStep === 2
                        ? "w-1/2"
                        : currentStep === 3
                          ? "w-3/4"
                          : "w-full"
                }`}
              />
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senderAddress">Sender Address</Label>
                  <Select
                    value={senderAddressId}
                    onValueChange={setSenderAddressId}
                    disabled={addressesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          addressesLoading
                            ? t("common.loading")
                            : t(
                                "parcels.selectSenderAddress",
                                "Select sender address",
                              )
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((addr) => (
                        <SelectItem key={addr.id} value={addr.id}>
                          {addr.label}, {addr.street ? `${addr.street}, ` : ""}
                          {addr.city}, {addr.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    type="button"
                    onClick={() => openAddAddress("sender")}
                  >
                    + Add new address
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientAddress">Recipient Address</Label>
                  <Select
                    value={recipientAddressId}
                    onValueChange={setRecipientAddressId}
                    disabled={addressesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          addressesLoading
                            ? t("common.loading")
                            : t(
                                "parcels.selectRecipientAddress",
                                "Select recipient address",
                              )
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((addr) => (
                        <SelectItem key={addr.id} value={addr.id}>
                          {addr.label}, {addr.street ? `${addr.street}, ` : ""}
                          {addr.city}, {addr.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    type="button"
                    onClick={() => openAddAddress("recipient")}
                  >
                    + Add new address
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      {...register("weight", {
                        required: "Weight is required",
                        min: 0.1,
                      })}
                    />
                    {errors.weight && (
                      <p className="text-sm text-destructive">
                        {errors.weight.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions (LxWxH cm)</Label>
                    <Input
                      id="dimensions"
                      placeholder="30x20x10"
                      {...register("dimensions")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="declaredValue">Declared Value (XAF)</Label>
                  <Input
                    id="declaredValue"
                    type="number"
                    placeholder="0"
                    {...register("declaredValue", { min: 0 })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFragile"
                    checked={isFragile}
                    onCheckedChange={(checked) =>
                      setIsFragile(checked as boolean)
                    }
                  />
                  <Label htmlFor="isFragile" className="cursor-pointer">
                    Fragile item (requires special handling)
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriptionComment">
                    Description / Comment (Optional)
                  </Label>
                  <Textarea
                    id="descriptionComment"
                    placeholder="Add any special instructions or description..."
                    {...register("descriptionComment")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("parcels.create.parcelPhoto", "Parcel Photo (Optional)")}</Label>
                  <div className="flex items-center gap-4">
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Parcel"
                          className="w-24 h-24 rounded-lg object-cover border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Add photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPhotoFile(file);
                              const reader = new FileReader();
                              reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("parcels.create.photoHint", "Take a photo of your parcel for reference")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("parcels.create.serviceType", "Service Type")}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["STANDARD", "EXPRESS"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setServiceType(type)}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                          serviceType === type
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/30 hover:bg-muted/50"
                        }`}
                      >
                        <Truck className={`h-6 w-6 ${serviceType === type ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-sm font-semibold ${serviceType === type ? "text-primary" : ""}`}>
                          {type === "STANDARD" ? t("parcels.create.standard", "Standard") : t("parcels.create.express", "Express")}
                        </span>
                        <span className="text-xs text-muted-foreground text-center">
                          {type === "STANDARD" ? "3-5 business days" : "1-2 business days"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("parcels.create.deliveryOption", "Delivery Option")}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["AGENCY", "HOME"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDeliveryOption(opt)}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                          deliveryOption === opt
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/30 hover:bg-muted/50"
                        }`}
                      >
                        <MapPin className={`h-6 w-6 ${deliveryOption === opt ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-sm font-semibold ${deliveryOption === opt ? "text-primary" : ""}`}>
                          {opt === "AGENCY" ? t("parcels.create.agencyPickup", "Agency Pickup") : t("parcels.create.homeDelivery", "Home Delivery")}
                        </span>
                        <span className="text-xs text-muted-foreground text-center">
                          {opt === "AGENCY" ? "Pick up at nearest agency" : "Delivered to your door"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <Card className="bg-muted">
                  <CardHeader>
                    <CardTitle className="text-lg">Delivery rates</CardTitle>
                    <CardDescription>
                      Pricing is calculated by the system based on weight,
                      distance, and service type.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {priceLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Calculating price…
                      </div>
                    ) : priceQuote ? (
                      <div className="space-y-2 text-sm">
                        {priceQuote.breakdown && (
                          <>
                            <div className="flex justify-between">
                              <span>Base price</span>
                              <span>
                                {priceQuote.breakdown.basePrice.toLocaleString()}{" "}
                                {priceQuote.currency}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Weight charge</span>
                              <span>
                                {priceQuote.breakdown.weightCharge.toLocaleString()}{" "}
                                {priceQuote.currency}
                              </span>
                            </div>
                            {(priceQuote.breakdown.extras ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Extras</span>
                                <span>
                                  +{" "}
                                  {priceQuote.breakdown.extras!.toLocaleString()}{" "}
                                  {priceQuote.currency}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {deliveryOption === "HOME" && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Home delivery surcharge</span>
                            <span>Calculated at delivery</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-base pt-2 border-t">
                          <span>Estimated total</span>
                          <span>
                            {priceQuote.estimatedPrice.toLocaleString()}{" "}
                            {priceQuote.currency}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Enter parcel weight and select addresses to get a price
                        estimate.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">How would you like to pay?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH")}
                      className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                        paymentMethod === "CASH"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <Banknote className={`h-8 w-8 ${paymentMethod === "CASH" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-semibold ${paymentMethod === "CASH" ? "text-primary" : ""}`}>
                        Cash Payment
                      </span>
                      <span className="text-xs text-muted-foreground text-center">
                        Pay at the agency counter. Accepted by agent or courier.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("MOBILE_MONEY")}
                      className={`flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all ${
                        paymentMethod === "MOBILE_MONEY"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <Smartphone className={`h-8 w-8 ${paymentMethod === "MOBILE_MONEY" ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-semibold ${paymentMethod === "MOBILE_MONEY" ? "text-primary" : ""}`}>
                        Mobile Money
                      </span>
                      <span className="text-xs text-muted-foreground text-center">
                        Pay instantly via MTN MoMo or Orange Money.
                      </span>
                    </button>
                  </div>
                </div>

                {paymentMethod === "MOBILE_MONEY" && (
                  <Card className="border-primary/30">
                    <CardContent className="pt-4 space-y-3">
                      <Label htmlFor="momoPhone">Mobile Money Phone Number</Label>
                      <Input
                        id="momoPhone"
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        placeholder="+237 6XX XXX XXX"
                        type="tel"
                      />
                      <p className="text-xs text-muted-foreground">
                        A payment prompt will be sent to this number after parcel creation. Confirm on your phone to complete payment.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {paymentMethod === "CASH" && (
                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Banknote className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-amber-600 dark:text-amber-400">Cash payment at agency</p>
                          <p className="text-muted-foreground mt-1">
                            Your parcel will be created and you can pay in cash at the nearest agency.
                            An agent or courier will confirm receipt of payment.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-muted">
                  <CardHeader>
                    <CardTitle className="text-lg">Estimated Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {priceLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Calculating…
                      </div>
                    ) : priceQuote ? (
                      <div className="space-y-2 text-sm">
                        {priceQuote.breakdown && (
                          <>
                            <div className="flex justify-between">
                              <span>Base shipping</span>
                              <span>
                                {priceQuote.breakdown.basePrice.toLocaleString()}{" "}
                                {priceQuote.currency}
                              </span>
                            </div>
                            {priceQuote.breakdown.weightCharge > 0 && (
                              <div className="flex justify-between">
                                <span>Weight charge</span>
                                <span>
                                  + {priceQuote.breakdown.weightCharge.toLocaleString()}{" "}
                                  {priceQuote.currency}
                                </span>
                              </div>
                            )}
                            {(priceQuote.breakdown.extras ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span>{serviceType === "EXPRESS" ? "Express service" : "Extras"}</span>
                                <span>
                                  + {priceQuote.breakdown.extras!.toLocaleString()}{" "}
                                  {priceQuote.currency}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex justify-between font-semibold text-base pt-2 border-t">
                          <span>Total</span>
                          <span>
                            {priceQuote.estimatedPrice.toLocaleString()}{" "}
                            {priceQuote.currency}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Price will be calculated based on weight, distance and service type.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit(onSubmit)} disabled={createParcel.isPending}>
                  {createParcel.isPending ? "Creating..." : "Create Parcel"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
