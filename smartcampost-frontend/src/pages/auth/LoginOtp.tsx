import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { routeByRole } from "@/lib/routeByRole";

export default function LoginOtp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<"request" | "confirm">("request");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const canRequest = useMemo(() => phone.trim().length >= 6, [phone]);
  const canConfirm = useMemo(
    () => phone.trim().length >= 6 && otp.trim().length >= 4,
    [phone, otp],
  );

  const requestOtp = async () => {
    if (!canRequest) return;
    setBusy(true);
    try {
      await apiClient.requestOtpLogin({ identifier: phone.trim() });
      toast.success("OTP sent");
      setStep("confirm");
    } catch (e: unknown) {
      const msg =
        (e as { message?: string } | undefined)?.message ??
        String(e ?? "Failed to send OTP");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (!canConfirm) return;
    setBusy(true);
    try {
      const res = await apiClient.confirmOtpLogin({
        identifier: phone.trim(),
        otp: otp.trim(),
      });
      setAuth(res.user, res.token);
      navigate(routeByRole(res.user.role), { replace: true });
    } catch (e: unknown) {
      const msg =
        (e as { message?: string } | undefined)?.message ??
        String(e ?? "Invalid OTP");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Package className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle>Login with OTP</CardTitle>
          <CardDescription>
            {step === "request"
              ? "Enter your phone number to receive an OTP"
              : "Enter the OTP you received"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237 6XX XXX XXX"
            />
          </div>

          {step === "confirm" && (
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
              />
            </div>
          )}

          {step === "request" ? (
            <Button
              className="w-full"
              onClick={requestOtp}
              disabled={busy || !canRequest}
            >
              {busy ? "Sending..." : "Send OTP"}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={confirmOtp}
              disabled={busy || !canConfirm}
            >
              {busy ? "Verifying..." : "Verify & Login"}
            </Button>
          )}

          <div className="text-sm text-center text-muted-foreground">
            <Link to="/auth/login" className="text-blue-600 hover:underline">
              Back to password login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
