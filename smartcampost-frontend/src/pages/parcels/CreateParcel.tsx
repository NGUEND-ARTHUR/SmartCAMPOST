import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Package, MapPin, Truck, CreditCard } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCreateParcel, useMyAddresses } from "@/hooks";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isFragile, setIsFragile] = useState(false);
  const [serviceType, setServiceType] = useState<"STANDARD" | "EXPRESS">(
    "STANDARD",
  );
  const [deliveryOption, setDeliveryOption] = useState<"AGENCY" | "HOME">(
    "AGENCY",
  );
  const [paymentOption, setPaymentOption] = useState<"PREPAID" | "COD">(
    "PREPAID",
  );

  const createParcel = useCreateParcel();
  const { data: addresses = [], isLoading: addressesLoading } =
    useMyAddresses();
  const [senderAddressId, setSenderAddressId] = useState<string>("");
  const [recipientAddressId, setRecipientAddressId] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ParcelFormData>();

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
    createParcel.mutate(
      {
        senderAddressId,
        recipientAddressId,
        weight: data.weight,
        isFragile: isFragile,
        serviceType,
        deliveryOption,
        paymentOption,
        description: data.descriptionComment,
      },
      {
        onSuccess: () => {
          toast.success(t("parcels.create.toasts.created"));
          navigate("/client/parcels");
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

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate("/client")}
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

          <form onSubmit={handleSubmit(onSubmit)}>
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
                            ? "Loading..."
                            : "Select sender address"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((addr) => (
                        <SelectItem key={addr.id} value={addr.id}>
                          {addr.label || addr.addressLine}, {addr.city},{" "}
                          {addr.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="link" className="p-0 h-auto">
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
                            ? "Loading..."
                            : "Select recipient address"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((addr) => (
                        <SelectItem key={addr.id} value={addr.id}>
                          {addr.label || addr.addressLine}, {addr.city},{" "}
                          {addr.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="link" className="p-0 h-auto">
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
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Tabs
                    value={serviceType}
                    onValueChange={(v: string) =>
                      setServiceType(v as "STANDARD" | "EXPRESS")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="STANDARD">Standard</TabsTrigger>
                      <TabsTrigger value="EXPRESS">Express</TabsTrigger>
                    </TabsList>
                    <TabsContent value="STANDARD" className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Delivery in 3-5 business days. Economical option for
                        non-urgent parcels.
                      </p>
                    </TabsContent>
                    <TabsContent value="EXPRESS" className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Delivery in 1-2 business days. Priority handling and
                        faster delivery.
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label>Delivery Option</Label>
                  <Tabs
                    value={deliveryOption}
                    onValueChange={(v: string) =>
                      setDeliveryOption(v as "AGENCY" | "HOME")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="AGENCY">Agency Pickup</TabsTrigger>
                      <TabsTrigger value="HOME">Home Delivery</TabsTrigger>
                    </TabsList>
                    <TabsContent value="AGENCY" className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Recipient picks up parcel at nearest agency. Lower cost
                        option.
                      </p>
                    </TabsContent>
                    <TabsContent value="HOME" className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Parcel delivered directly to recipient's address.
                        Additional fees may apply.
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Option</Label>
                  <Tabs
                    value={paymentOption}
                    onValueChange={(v: string) =>
                      setPaymentOption(v as "PREPAID" | "COD")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="PREPAID">Prepaid</TabsTrigger>
                      <TabsTrigger value="COD">Cash on Delivery</TabsTrigger>
                    </TabsList>
                    <TabsContent value="PREPAID" className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Pay now before shipping. Faster processing time.
                      </p>
                    </TabsContent>
                    <TabsContent value="COD" className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Recipient pays upon delivery. Additional fees may apply.
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>

                <Card className="bg-muted">
                  <CardHeader>
                    <CardTitle className="text-lg">Estimated Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Base shipping</span>
                        <span>2,500 XAF</span>
                      </div>
                      {serviceType === "EXPRESS" && (
                        <div className="flex justify-between">
                          <span>Express service</span>
                          <span>+ 1,000 XAF</span>
                        </div>
                      )}
                      {deliveryOption === "HOME" && (
                        <div className="flex justify-between">
                          <span>Home delivery</span>
                          <span>+ 500 XAF</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-base pt-2 border-t">
                        <span>Total</span>
                        <span>
                          {2500 +
                            (serviceType === "EXPRESS" ? 1000 : 0) +
                            (deliveryOption === "HOME" ? 500 : 0)}{" "}
                          XAF
                        </span>
                      </div>
                    </div>
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
                <Button
                  type="button"
                  onClick={() =>
                    setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
                  }
                >
                  Next
                </Button>
              ) : (
                <Button type="submit">Create Parcel</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
