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

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const canRequest = useMemo(() => phone.trim().length >= 6, [phone]);
  const canConfirm = useMemo(
    () =>
      phone.trim().length >= 6 &&
      otp.trim().length >= 4 &&
      newPassword.length >= 6,
    [phone, otp, newPassword],
  );

  const request = async () => {
    if (!canRequest) return;
    setBusy(true);
    try {
      await apiClient.requestPasswordReset({ identifier: phone.trim() });
      toast.success("OTP sent");
      setStep("confirm");
    } catch (e: unknown) {
      const msg =
        (e as { message?: string } | undefined)?.message ??
        String(e ?? "Failed to request reset");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!canConfirm) return;
    setBusy(true);
    try {
      await apiClient.confirmPasswordReset({
        identifier: phone.trim(),
        otp: otp.trim(),
        newPassword,
      });
      toast.success("Password reset successful");
      navigate("/auth/login", { replace: true });
    } catch (e: unknown) {
      const msg =
        (e as { message?: string } | undefined)?.message ??
        String(e ?? "Failed to reset password");
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
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            {step === "request"
              ? "Request an OTP to reset your password"
              : "Confirm OTP and set a new password"}
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
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">New password</Label>
                <Input
                  id="pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>
            </>
          )}

          {step === "request" ? (
            <Button
              className="w-full"
              onClick={request}
              disabled={busy || !canRequest}
            >
              {busy ? "Requesting..." : "Request OTP"}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={confirm}
              disabled={busy || !canConfirm}
            >
              {busy ? "Saving..." : "Confirm reset"}
            </Button>
          )}

          <div className="text-sm text-center text-muted-foreground">
            <Link to="/auth/login" className="text-blue-600 hover:underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
