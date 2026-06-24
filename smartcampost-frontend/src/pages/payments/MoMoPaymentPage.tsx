import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInitPayment, usePayment } from "@/hooks";

export default function MoMoPaymentPage() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initPayment = useInitPayment();
  const payment = usePayment(paymentId || "", { pollWhilePending: true });

  const handlePay = async () => {
    setError(null);
    if (!parcelId) {
      setError("Missing parcel reference");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required");
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
      setError(e instanceof Error ? e.message : "Failed to initiate payment");
    }
  };

  const status = payment.data?.status;

  return (
    <div className="mx-auto max-w-md p-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Pay with MTN Mobile Money</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!paymentId && (
            <>
              <Input
                placeholder="Phone number (e.g. 2376...)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={initPayment.isPending}
              />
              <Button
                className="w-full"
                onClick={handlePay}
                disabled={initPayment.isPending}
              >
                {initPayment.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {initPayment.isPending ? "Initiating..." : "Pay with MoMo"}
              </Button>
            </>
          )}

          {paymentId && status === "PENDING" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="font-medium">Waiting for MTN confirmation</p>
              <p className="text-sm text-muted-foreground">
                Approve the payment prompt on your phone. This page updates
                automatically.
              </p>
            </div>
          )}

          {paymentId && status === "SUCCESS" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
              <p className="font-medium">
                Payment of {payment.data?.amount.toLocaleString()}{" "}
                {payment.data?.currency} confirmed
              </p>
              <Button onClick={() => navigate(`/client/parcels/${parcelId}`)}>
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
                onClick={() => {
                  setPaymentId(null);
                  setError(null);
                }}
              >
                Try again
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
