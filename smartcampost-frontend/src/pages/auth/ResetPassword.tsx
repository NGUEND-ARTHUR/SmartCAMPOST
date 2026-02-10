import { useEffect, useMemo, useState } from "react";
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

  // WebOTP auto-fill (Android Chrome) when OTP is received on the same device.
  useEffect(() => {
    if (step !== "confirm") return;
    const nav: any = navigator as any;
    if (!nav?.credentials?.get) return;
    if (!("OTPCredential" in window)) return;

    const controller = new AbortController();
    (nav.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: controller.signal,
      }) as Promise<any>)
      .then((cred) => {
        const code = cred?.code;
        if (typeof code === "string" && code.trim()) {
          setOtp(code.trim());
        }
      })
      .catch(() => {
        // ignore
      });

    return () => controller.abort();
  }, [step]);

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
      toast.success(t("auth.toasts.otpSent"));
      setStep("confirm");
    } catch (e: unknown) {
      const msg =
        (e as { message?: string } | undefined)?.message ??
        t("auth.toasts.resetRequestFailed");
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
      toast.success(t("auth.toasts.passwordResetSuccess"));
      navigate("/auth/login", { replace: true });
    } catch (e: unknown) {
      const msg =
        (e as { message?: string } | undefined)?.message ??
        t("auth.toasts.passwordResetFailed");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Package className="w-12 h-12 text-primary" />
          </div>
          <CardTitle>{t("auth.resetPasswordOtpTitle")}</CardTitle>
          <CardDescription>
            {step === "request"
              ? t("auth.resetPasswordOtpSubtitleRequest")
              : t("auth.resetPasswordOtpSubtitleConfirm")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">{t("common.phone")}</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237 6XX XXX XXX"
              autoComplete="tel"
            />
          </div>

          {step === "confirm" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">{t("auth.otp")}</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder={t("auth.otpPlaceholder")}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  name="otp"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">{t("auth.newPassword")}</Label>
                <Input
                  id="pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("auth.newPasswordPlaceholder")}
                  autoComplete="new-password"
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
              {busy ? t("auth.requesting") : t("auth.requestOtp")}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={confirm}
              disabled={busy || !canConfirm}
            >
              {busy ? t("auth.saving") : t("auth.confirmReset")}
            </Button>
          )}

          <div className="text-sm text-center text-muted-foreground">
            <Link to="/auth/login" className="text-primary hover:underline">
              {t("auth.backToLogin")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
