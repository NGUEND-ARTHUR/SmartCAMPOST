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
    () => phone.trim().length >= 6 && otp.trim().length >= 4,
    [phone, otp],
  );

  const requestOtp = async () => {
    if (!canRequest) return;
    setBusy(true);
    try {
      await apiClient.requestOtpLogin({ identifier: phone.trim() });
      toast.success(t("auth.toasts.otpSent"));
      setStep("confirm");
    } catch (e: unknown) {
      const msg =
        (e as { message?: string } | undefined)?.message ??
        t("auth.toasts.otpSendFailed");
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
        t("auth.toasts.invalidOtp");
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
          <CardTitle>{t("auth.loginWithOtpTitle")}</CardTitle>
          <CardDescription>
            {step === "request"
              ? t("auth.loginWithOtpSubtitleRequest")
              : t("auth.loginWithOtpSubtitleConfirm")}
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
          )}

          {step === "request" ? (
            <Button
              className="w-full"
              onClick={requestOtp}
              disabled={busy || !canRequest}
            >
              {busy ? t("auth.sending") : t("auth.sendOtp")}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={confirmOtp}
              disabled={busy || !canConfirm}
            >
              {busy ? t("auth.verifying") : t("auth.verifyAndLogin")}
            </Button>
          )}

          <div className="text-sm text-center text-muted-foreground">
            <Link to="/auth/login" className="text-primary hover:underline">
              {t("auth.backToPasswordLogin")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
