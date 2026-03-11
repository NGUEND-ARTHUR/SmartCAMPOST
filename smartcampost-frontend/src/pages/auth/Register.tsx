import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Package as PackageIcon } from "lucide-react";
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

import { RegisterRequest } from "@/types";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export function Register() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"FR" | "EN">(
    i18n.language === "fr" ? "FR" : "EN",
  );

  // Sync form language with i18n
  useEffect(() => {
    const lang = i18n.language === "fr" ? "FR" : "EN";
    setLanguage(lang);
  }, [i18n.language]);

  // When user changes language in form, also update i18n
  const handleLanguageChange = (val: string) => {
    setLanguage(val as "FR" | "EN");
    i18n.changeLanguage(val.toLowerCase());
    localStorage.setItem("i18nextLng", val.toLowerCase());
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterRequest>();
  const phoneValue = watch("phone");

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const otpInputRef = useRef<HTMLInputElement>(null);

  // WebOTP auto-fill (Android Chrome) when OTP is received on the same device.
  useEffect(() => {
    if (!otpSent) return;
    const nav: any = navigator as any;
    if (!nav?.credentials?.get) return;
    if (!("OTPCredential" in window)) return;

    const controller = new AbortController();
    (
      nav.credentials.get({
        otp: { transport: ["sms"] },
        signal: controller.signal,
      }) as Promise<any>
    )
      .then((cred) => {
        const code = cred?.code;
        if (typeof code === "string" && code.trim()) {
          setOtpValue(code.trim());
          otpInputRef.current?.focus();
        }
      })
      .catch(() => {
        // ignore (unsupported, cancelled, or timed out)
      });

    return () => controller.abort();
  }, [otpSent]);

  const onSubmit = async (data: RegisterRequest) => {
    if (!otpSent || !otpValue.trim()) {
      toast.error(t("errors.otpRequired"));
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.register({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        preferredLanguage: language,
        password: data.password,
        otp: otpValue,
      });
      toast.success(t("messages.createSuccess"));
      navigate("/auth/login");
    } catch (error: unknown) {
      const apiErr = error as { code?: string; message?: string } | undefined;
      if (apiErr && apiErr.code && apiErr.message) {
        const translated = t(`errors.${apiErr.code}`, { defaultValue: "" });
        toast.error(translated || apiErr.message);
      } else {
        toast.error(t("errors.serverError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PackageIcon className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle>{t("auth.registerTitle")}</CardTitle>
          <CardDescription>{t("auth.registerSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Language selector at the top */}
            <div className="space-y-2">
              <Label>{t("auth.preferredLanguage")}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={language === "FR" ? "default" : "outline"}
                  onClick={() => handleLanguageChange("FR")}
                  className="flex-1"
                >
                  🇫🇷 Français
                </Button>
                <Button
                  type="button"
                  variant={language === "EN" ? "default" : "outline"}
                  onClick={() => handleLanguageChange("EN")}
                  className="flex-1"
                >
                  🇬🇧 English
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">{t("auth.fullName")}</Label>
              <Input
                id="fullName"
                placeholder={t("auth.fullName")}
                {...register("fullName", { required: t("errors.required") })}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("auth.phoneNumber")}</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  placeholder="+237 6XX XXX XXX"
                  autoComplete="tel"
                  {...register("phone", {
                    required: t("errors.required"),
                    pattern: {
                      value: /^\+?[0-9]{8,15}$/,
                      message: t("errors.invalidPhone"),
                    },
                  })}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!phoneValue) {
                      toast.error(t("errors.required"));
                      return;
                    }
                    setIsSendingOtp(true);
                    try {
                      await apiClient.sendOtp(phoneValue);
                      setOtpSent(true);
                      setTimeout(() => otpInputRef.current?.focus(), 50);
                      toast.success(t("messages.success"));
                    } catch (err: unknown) {
                      const msg =
                        (err as { message?: string } | undefined)?.message ??
                        t("errors.serverError");
                      toast.error(msg);
                    } finally {
                      setIsSendingOtp(false);
                    }
                  }}
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? "..." : t("auth.sendOtp")}
                </Button>
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {otpSent && (
              <div className="space-y-2">
                <Label htmlFor="otp">{t("auth.otp")}</Label>
                <Input
                  id="otp"
                  placeholder={t("auth.otpPlaceholder")}
                  value={otpValue}
                  ref={otpInputRef}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  name="otp"
                  maxLength={6}
                  onChange={(e) =>
                    setOtpValue(e.target.value.replace(/\D/g, ""))
                  }
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                {t("common.email")} ({t("common.optional")})
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register("email")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("common.password")}
                autoComplete="new-password"
                {...register("password", {
                  required: t("errors.required"),
                  minLength: {
                    value: 8,
                    message: t("errors.passwordTooShort"),
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                    message: t("errors.passwordComplexity"),
                  },
                })}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("common.loading") : t("common.register")}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              {t("auth.haveAccount")}{" "}
              <Link to="/auth/login" className="text-blue-600 hover:underline">
                {t("auth.signIn")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
