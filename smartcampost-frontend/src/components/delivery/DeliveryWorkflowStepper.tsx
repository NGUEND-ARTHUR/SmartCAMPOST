import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Package,
  Phone,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import {
  useCompleteDelivery,
  useMarkDeliveryFailed,
  useRescheduleDelivery,
  useReturnToSender,
  useStartDelivery,
  useVerifyDeliveryOtp,
} from "@/hooks";

export type DeliveryRequirement = {
  requiresOtp?: boolean;
  requiresSignature?: boolean;
  requiresPhoto?: boolean;
};

export type DeliveryWorkflowData = {
  id: string;
  trackingNumber: string;
  status?: string;
  deliveryOption?: string;
  customerName: string;
  customerPhone: string;
  address: string;
  deliveryInstructions?: string;
  packageDetails?: {
    weight?: number;
    dimensions?: string;
    description?: string;
  };
  requirements?: DeliveryRequirement;
};

type StepKey = "DETAILS" | "OTP" | "PROOF" | "CONFIRM" | "DONE";

type FailureAction = "FAILED" | "RESCHEDULE" | "RETURN_TO_SENDER";

type DeliveryResult =
  | {
      status: "DELIVERED";
      otp?: string;
      signature?: string;
      photoDataUrl?: string;
      note?: string;
    }
  | { status: "FAILED"; reason: string; note?: string };

type Props = {
  delivery: DeliveryWorkflowData;
  onExit?: () => void;
  onComplete?: (result: DeliveryResult) => void;
};

function StepIndicator({
  active,
  done,
  label,
  index,
}: {
  active: boolean;
  done: boolean;
  label: string;
  index: number;
}) {
  const circle = done
    ? "bg-blue-600 text-white"
    : active
      ? "bg-blue-600 text-white"
      : "bg-muted text-muted-foreground";
  const text = active
    ? "text-blue-600"
    : done
      ? "text-foreground"
      : "text-muted-foreground";
  return (
    <div className={`flex items-center ${text}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${circle}`}
      >
        {index}
      </div>
      <span className="ml-2 text-sm font-medium">{label}</span>
    </div>
  );
}

export default function DeliveryWorkflowStepper({
  delivery,
  onExit,
  onComplete,
}: Props) {
  const { t } = useTranslation();
  const req = delivery.requirements ?? {};

  const parcelId = delivery.id;

  const startDelivery = useStartDelivery();
  const verifyOtpMutation = useVerifyDeliveryOtp();
  const completeDelivery = useCompleteDelivery();
  const markFailedMutation = useMarkDeliveryFailed();
  const rescheduleMutation = useRescheduleDelivery();
  const returnToSenderMutation = useReturnToSender();

  const initialStep: StepKey = "DETAILS";
  const [step, setStep] = useState<StepKey>(initialStep);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string>("");

  const [signature, setSignature] = useState("");
  const [photoProof, setPhotoProof] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [note, setNote] = useState("");
  const [failureReason, setFailureReason] = useState<string>("");
  const [markFailed, setMarkFailed] = useState(false);

  const [failureAction, setFailureAction] = useState<FailureAction>("FAILED");
  const [rescheduleDate, setRescheduleDate] = useState<string>("");

  const timeline = useMemo(() => {
    const items: { label: string; ok?: boolean }[] = [];
    items.push({ label: "Delivery opened", ok: true });
    if (
      step === "OTP" ||
      step === "PROOF" ||
      step === "CONFIRM" ||
      step === "DONE"
    ) {
      items.push({ label: "Contact customer", ok: true });
    }
    if (
      req.requiresOtp &&
      (step === "PROOF" || step === "CONFIRM" || step === "DONE")
    ) {
      items.push({ label: "OTP verified", ok: true });
    }
    if (req.requiresPhoto && photoProof) {
      items.push({ label: "Photo captured", ok: true });
    }
    if (req.requiresSignature && signature.trim()) {
      items.push({ label: "Signature captured", ok: true });
    }
    if (step === "DONE") {
      items.push({
        label: markFailed ? "Delivery marked failed" : "Delivery completed",
        ok: !markFailed,
      });
    }
    return items;
  }, [
    markFailed,
    photoProof,
    req.requiresOtp,
    req.requiresPhoto,
    req.requiresSignature,
    signature,
    step,
  ]);

  const steps: { key: StepKey; label: string; enabled: boolean }[] = [
    { key: "DETAILS", label: "Details", enabled: true },
    { key: "OTP", label: "OTP", enabled: !!req.requiresOtp },
    { key: "PROOF", label: "Proof", enabled: true },
    { key: "CONFIRM", label: "Confirm", enabled: true },
    { key: "DONE", label: "Done", enabled: true },
  ];

  const visibleSteps = steps.filter(
    (s) =>
      s.enabled ||
      s.key === "DETAILS" ||
      s.key === "PROOF" ||
      s.key === "CONFIRM" ||
      s.key === "DONE",
  );

  const stepIndex = visibleSteps.findIndex((s) => s.key === step);

  const getGpsOrThrow = async (): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      throw new Error("GPS is not available in this environment");
    }
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  };

  const goNextFromDetails = async () => {
    try {
      const gps = await getGpsOrThrow();
      await startDelivery.mutateAsync({
        parcelId,
        latitude: gps.latitude,
        longitude: gps.longitude,
        notes: note.trim() || undefined,
      });

      if (req.requiresOtp) {
        toast.success(t("deliveries.workflow.toasts.startedOtp"));
        setStep("OTP");
      } else {
        toast.success(t("deliveries.workflow.toasts.started"));
        setStep("PROOF");
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string } | undefined)?.message;
      toast.error(msg || t("deliveries.workflow.toasts.startFailed"));
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setOtpError("");

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const verifyOtp = async () => {
    const value = otp.join("");
    if (value.length !== 6) {
      setOtpError(t("deliveries.workflow.errors.otpSixDigits"));
      return;
    }

    try {
      const gps = await getGpsOrThrow();
      const valid = await verifyOtpMutation.mutateAsync({
        parcelId,
        otpCode: value,
        latitude: gps.latitude,
        longitude: gps.longitude,
        notes: note.trim() || undefined,
      });
      if (!valid) {
        setOtpError(t("deliveries.workflow.errors.otpInvalid"));
        return;
      }

      toast.success(t("deliveries.workflow.toasts.otpVerified"));
      setStep("PROOF");
    } catch (e: unknown) {
      const msg = (e as { message?: string } | undefined)?.message;
      setOtpError(msg || t("deliveries.workflow.errors.otpVerifyFailed"));
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoProof(reader.result as string);
      toast.success(t("deliveries.workflow.toasts.photoCaptured"));
    };
    reader.readAsDataURL(file);
  };

  const proofValid = useMemo(() => {
    if (markFailed) {
      return !!failureReason;
    }
    if (req.requiresPhoto && !photoProof) return false;
    if (req.requiresSignature && !signature.trim()) return false;
    return true;
  }, [
    failureReason,
    markFailed,
    photoProof,
    req.requiresPhoto,
    req.requiresSignature,
    signature,
  ]);

  const goConfirm = () => {
    if (!proofValid) {
      toast.error(
        markFailed
          ? t("deliveries.workflow.toasts.selectFailureReason")
          : t("deliveries.workflow.toasts.completeRequiredProof"),
      );
      return;
    }
    setStep("CONFIRM");
  };

  const complete = async () => {
    try {
      const gps = await getGpsOrThrow();

      if (markFailed) {
        if (failureAction === "RESCHEDULE") {
          if (!rescheduleDate) {
            toast.error(t("deliveries.workflow.toasts.selectRescheduleDate"));
            return;
          }
          await rescheduleMutation.mutateAsync({
            parcelId,
            data: {
              newDate: rescheduleDate,
              reason: failureReason,
              deliveryNotes: note.trim() || undefined,
              latitude: gps.latitude,
              longitude: gps.longitude,
            },
          });
          toast.success(t("deliveries.workflow.toasts.rescheduled"));
        } else if (failureAction === "RETURN_TO_SENDER") {
          await returnToSenderMutation.mutateAsync({
            parcelId,
            data: {
              reason: failureReason,
              notes: note.trim() || undefined,
              latitude: gps.latitude,
              longitude: gps.longitude,
            },
          });
          toast.success(t("deliveries.workflow.toasts.returnedToSender"));
        } else {
          await markFailedMutation.mutateAsync({
            parcelId,
            reason: failureReason,
            latitude: gps.latitude,
            longitude: gps.longitude,
            notes: note.trim() || undefined,
          });
          toast.success(t("deliveries.workflow.toasts.markedFailed"));
        }

        onComplete?.({
          status: "FAILED",
          reason: failureReason,
          note: note.trim() || undefined,
        });
        setStep("DONE");
        return;
      }

      const otpValue = req.requiresOtp ? otp.join("") : undefined;
      await completeDelivery.mutateAsync({
        parcelId,
        otpCode: otpValue,
        receiverName: signature.trim() || undefined,
        photoUrl: photoProof || undefined,
        notes: note.trim() || undefined,
        proofType: photoProof
          ? "PHOTO"
          : signature.trim()
            ? "SIGNATURE"
            : "OTP",
        latitude: gps.latitude,
        longitude: gps.longitude,
      });

      toast.success(t("deliveries.workflow.toasts.completed"));
      onComplete?.({
        status: "DELIVERED",
        otp: otpValue,
        signature: signature.trim() || undefined,
        photoDataUrl: photoProof || undefined,
        note: note.trim() || undefined,
      });
      setStep("DONE");
    } catch (e: unknown) {
      const msg = (e as { message?: string } | undefined)?.message;
      toast.error(msg || t("deliveries.workflow.toasts.actionFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Delivery Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-6">
            {visibleSteps.map((s, idx) => (
              <StepIndicator
                key={s.key}
                index={idx + 1}
                label={s.label}
                active={s.key === step}
                done={idx < stepIndex}
              />
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  {step === "DETAILS"
                    ? "Delivery details"
                    : step === "OTP"
                      ? "OTP verification"
                      : step === "PROOF"
                        ? "Proof of delivery"
                        : step === "CONFIRM"
                          ? "Confirm"
                          : "Done"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {step === "DETAILS" && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded border p-3">
                        <div className="text-xs text-muted-foreground">
                          Tracking
                        </div>
                        <div className="font-medium">
                          {delivery.trackingNumber}
                        </div>
                      </div>
                      <div className="rounded border p-3">
                        <div className="text-xs text-muted-foreground">
                          Address
                        </div>
                        <div className="font-medium">{delivery.address}</div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-start gap-2 rounded border p-3">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Customer
                          </div>
                          <div className="font-medium">
                            {delivery.customerName}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded border p-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Phone
                          </div>
                          <div className="font-medium">
                            {delivery.customerPhone}
                          </div>
                        </div>
                      </div>
                    </div>

                    {delivery.deliveryInstructions ? (
                      <div className="rounded border bg-blue-50 p-3">
                        <div className="text-xs font-medium text-blue-900">
                          Instructions
                        </div>
                        <div className="text-sm text-blue-800">
                          {delivery.deliveryInstructions}
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded border p-3">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Requirements
                      </div>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2
                            className={`h-4 w-4 ${req.requiresOtp ? "text-green-600" : "text-muted-foreground"}`}
                          />
                          OTP required
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2
                            className={`h-4 w-4 ${req.requiresSignature ? "text-green-600" : "text-muted-foreground"}`}
                          />
                          Signature required
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2
                            className={`h-4 w-4 ${req.requiresPhoto ? "text-green-600" : "text-muted-foreground"}`}
                          />
                          Photo proof required
                        </li>
                      </ul>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Button variant="outline" onClick={onExit}>
                        Exit
                      </Button>
                      <Button onClick={goNextFromDetails}>
                        Start delivery
                      </Button>
                    </div>
                  </div>
                )}

                {step === "OTP" && (
                  <div className="space-y-4">
                    <div className="rounded border bg-muted/30 p-3 text-sm">
                      Ask the customer for the 6-digit OTP.
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          id={`otp-${index}`}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-12 text-center text-lg font-semibold"
                          inputMode="numeric"
                          maxLength={1}
                        />
                      ))}
                    </div>

                    {otpError ? (
                      <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {otpError}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep("DETAILS")}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={verifyOtp}
                        disabled={verifyOtpMutation.isPending}
                      >
                        Verify OTP
                      </Button>
                    </div>
                  </div>
                )}

                {step === "PROOF" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <Button
                        variant={markFailed ? "outline" : "default"}
                        onClick={() => setMarkFailed(false)}
                      >
                        Mark delivered
                      </Button>
                      <Button
                        variant={markFailed ? "destructive" : "outline"}
                        onClick={() => setMarkFailed(true)}
                      >
                        Mark failed
                      </Button>
                    </div>

                    {markFailed ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Next action</Label>
                          <Select
                            value={failureAction}
                            onValueChange={(v) =>
                              setFailureAction(v as FailureAction)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FAILED">
                                Mark failed
                              </SelectItem>
                              <SelectItem value="RESCHEDULE">
                                Reschedule
                              </SelectItem>
                              <SelectItem value="RETURN_TO_SENDER">
                                Return to sender
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {failureAction === "RESCHEDULE" ? (
                          <div className="space-y-2">
                            <Label>New delivery date</Label>
                            <Input
                              type="date"
                              value={rescheduleDate}
                              onChange={(e) =>
                                setRescheduleDate(e.target.value)
                              }
                            />
                          </div>
                        ) : null}

                        <div className="space-y-2">
                          <Label>Failure reason</Label>
                          <Select
                            value={failureReason}
                            onValueChange={setFailureReason}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CUSTOMER_ABSENT">
                                Customer absent
                              </SelectItem>
                              <SelectItem value="ADDRESS_NOT_FOUND">
                                Address not found
                              </SelectItem>
                              <SelectItem value="CUSTOMER_REFUSED">
                                Customer refused
                              </SelectItem>
                              <SelectItem value="PACKAGE_DAMAGED">
                                Package damaged
                              </SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Notes (optional)</Label>
                          <Textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add details…"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <Button
                            variant="outline"
                            onClick={() =>
                              req.requiresOtp
                                ? setStep("OTP")
                                : setStep("DETAILS")
                            }
                          >
                            Back
                          </Button>
                          <Button onClick={goConfirm} disabled={!failureReason}>
                            Continue
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {req.requiresPhoto && (
                          <div className="space-y-2">
                            <Label>Photo proof *</Label>
                            <div className="rounded-lg border-2 border-dashed p-4 text-center">
                              {photoProof ? (
                                <div className="space-y-3">
                                  <img
                                    src={photoProof}
                                    alt="proof"
                                    className="mx-auto max-h-64 rounded"
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                  >
                                    Retake photo
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <Camera className="h-10 w-10 text-muted-foreground mx-auto" />
                                  <Button
                                    onClick={() =>
                                      fileInputRef.current?.click()
                                    }
                                  >
                                    Take photo
                                  </Button>
                                  <div className="text-xs text-muted-foreground">
                                    Take a photo of the delivered parcel.
                                  </div>
                                </div>
                              )}
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoCapture}
                                className="hidden"
                                aria-label="Upload delivery photo"
                                title="Upload delivery photo"
                              />
                            </div>
                          </div>
                        )}

                        {req.requiresSignature && (
                          <div className="space-y-2">
                            <Label>Customer signature *</Label>
                            <Input
                              value={signature}
                              onChange={(e) => setSignature(e.target.value)}
                              placeholder="Customer full name"
                            />
                            <div className="text-xs text-muted-foreground">
                              Ask customer to type their name.
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Notes (optional)</Label>
                          <Textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add delivery note…"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <Button
                            variant="outline"
                            onClick={() =>
                              req.requiresOtp
                                ? setStep("OTP")
                                : setStep("DETAILS")
                            }
                          >
                            Back
                          </Button>
                          <Button onClick={goConfirm} disabled={!proofValid}>
                            Continue
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === "CONFIRM" && (
                  <div className="space-y-4">
                    <div className="rounded border p-3 text-sm">
                      <div className="font-medium mb-1">Summary</div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>Status: {markFailed ? "FAILED" : "DELIVERED"}</li>
                        {req.requiresOtp ? (
                          <li>OTP: {otp.join("") || "—"}</li>
                        ) : null}
                        {req.requiresPhoto ? (
                          <li>Photo: {photoProof ? "attached" : "—"}</li>
                        ) : null}
                        {req.requiresSignature ? (
                          <li>
                            Signature: {signature.trim() ? "captured" : "—"}
                          </li>
                        ) : null}
                        {markFailed ? (
                          <li>Reason: {failureReason || "—"}</li>
                        ) : null}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep("PROOF")}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={complete}
                        variant={markFailed ? "destructive" : "default"}
                        disabled={
                          startDelivery.isPending ||
                          completeDelivery.isPending ||
                          markFailedMutation.isPending ||
                          rescheduleMutation.isPending ||
                          returnToSenderMutation.isPending
                        }
                      >
                        {markFailed ? "Confirm failure" : "Confirm delivery"}
                      </Button>
                    </div>
                  </div>
                )}

                {step === "DONE" && (
                  <div className="space-y-4">
                    <div
                      className={`rounded border p-4 ${markFailed ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}
                    >
                      <div className="font-medium">
                        {markFailed
                          ? "Delivery recorded as failed"
                          : "Delivery completed"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {markFailed
                          ? "You can return to deliveries to continue work."
                          : "Thank you. The delivery has been recorded."}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <Button onClick={onExit}>Back to list</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {timeline.map((t, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2
                      className={`h-4 w-4 mt-0.5 ${t.ok ? "text-green-600" : "text-muted-foreground"}`}
                    />
                    <div>{t.label}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
