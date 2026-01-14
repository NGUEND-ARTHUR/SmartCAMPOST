import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { RegisterRequest } from "@/types";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export function Register() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<"FR" | "EN">(
    i18n.language === 'fr' ? "FR" : "EN"
  );

  // Sync form language with i18n
  useEffect(() => {
    const lang = i18n.language === 'fr' ? "FR" : "EN";
    setLanguage(lang);
  }, [i18n.language]);

  // When user changes language in form, also update i18n
  const handleLanguageChange = (val: string) => {
    setLanguage(val as "FR" | "EN");
    i18n.changeLanguage(val.toLowerCase());
    localStorage.setItem('i18nextLng', val.toLowerCase());
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterRequest>();
  const password = watch("password");
  const phoneValue = watch("phone");

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const onSubmit = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      // Call backend register
      await apiClient.register({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        preferredLanguage: language,
        password: data.password,
      });

      toast.success(t('messages.createSuccess'));
      navigate("/auth/login");
    } catch (error) {
      toast.error(t('errors.serverError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PackageIcon className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle>{t('auth.registerTitle')}</CardTitle>
          <CardDescription>{t('auth.registerSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Language selector at the top */}
            <div className="space-y-2">
              <Label>{t('auth.preferredLanguage')}</Label>
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
              <Label htmlFor="fullName">{t('auth.fullName')}</Label>
              <Input
                id="fullName"
                placeholder={t('auth.fullName')}
                {...register("fullName", { required: t('errors.required') })}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth.phoneNumber')}</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  placeholder="+237 6XX XXX XXX"
                  {...register("phone", {
                    required: t('errors.required'),
                  })}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!phoneValue) {
                      toast.error(t('errors.required'));
                      return;
                    }
                    setIsSendingOtp(true);
                    try {
                      await apiClient.sendOtp(phoneValue);
                      setOtpSent(true);
                      toast.success(t('messages.success'));
                    } catch (err) {
                      toast.error(t('errors.serverError'));
                    } finally {
                      setIsSendingOtp(false);
                    }
                  }}
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? "..." : t('auth.sendOtp')}
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
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  placeholder="Enter OTP"
                  {...register("otp", { required: t('errors.required') })}
                />
                {errors.otp && (
                  <p className="text-sm text-destructive">
                    {errors.otp.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')} ({t('common.optional')})</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register("email")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('common.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('common.password')}
                {...register("password", {
                  required: t('errors.required'),
                  minLength: {
                    value: 6,
                    message: t('errors.passwordTooShort'),
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
              {isLoading ? t('common.loading') : t('common.register')}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              {t('auth.haveAccount')}{" "}
              <Link to="/auth/login" className="text-blue-600 hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
