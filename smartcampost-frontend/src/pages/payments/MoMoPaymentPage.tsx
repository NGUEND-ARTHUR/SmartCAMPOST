import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInitPayment, usePayment } from "@/hooks";
import { useAuthStore } from "@/store/authStore";

export default function MoMoPaymentPage() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const navigate = useNavigate();
  const userPhone = useAuthStore((s) => s.user?.phone || "");
  const role = useAuthStore((s) => s.user?.role?.toUpperCase() || "CLIENT");
  const [phone, setPhone] = useState(userPhone);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initPayment = useInitPayment();
  const payment = usePayment(paymentId ?? "", { pollWhilePending: true });

  const backPath = parcelId
    ? `/${role.toLowerCase()}/parcels/${parcelId}`
    : `/${role.toLowerCase()}/parcels`;

  const handlePay = async () => {
    setError(null);
    if (!parcelId) {
      setError("Missing parcel reference");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter a phone number");
      return;
    }
    try {
      const result = await initPayment.mutateAsync({
        parcelId,
        method: "MOBILE_MONEY",
        payerPhone: phone.trim(),
      });
      setPaymentId(result.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initiate payment. Please try again.");
    }
  };

  const status = payment.data?.status;

  return (
    <div className="mx-auto max-w-md p-4 space-y-4">
      <Button variant="ghost" onClick={() => navigate(backPath)} type="button">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to parcel
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Mobile Money Payment
          </CardTitle>
          <CardDescription>
            Pay via MTN MoMo or Orange Money. A prompt will be sent to your phone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!paymentId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="momo-phone">Mobile Money Phone Number</Label>
                <Input
                  id="momo-phone"
                  placeholder="+237 6XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={initPayment.isPending}
                  type="tel"
                />
                <p className="text-xs text-muted-foreground">
                  A payment prompt will be sent to this number. Confirm on your phone.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={handlePay}
                disabled={initPayment.isPending}
                type="button"
              >
                {initPayment.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {initPayment.isPending ? "Sending payment request..." : "Pay Now"}
              </Button>
            </>
          )}

          {paymentId && status === "PENDING" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="font-medium">Waiting for confirmation</p>
              <p className="text-sm text-muted-foreground">
                Approve the payment prompt on your phone. This page updates automatically.
              </p>
            </div>
          )}

          {paymentId && status === "SUCCESS" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
              <p className="font-medium">
                Payment of {payment.data?.amount?.toLocaleString()}{" "}
                {payment.data?.currency || "XAF"} confirmed!
              </p>
              <Button onClick={() => navigate(backPath)} type="button">
                Back to parcel
              </Button>
            </div>
          )}

          {paymentId && status === "FAILED" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <XCircle className="w-10 h-10 text-red-600" />
              <p className="font-medium">Payment failed or was declined</p>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setPaymentId(null);
                  setError(null);
                }}
              >
                Try again
              </Button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-500">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
