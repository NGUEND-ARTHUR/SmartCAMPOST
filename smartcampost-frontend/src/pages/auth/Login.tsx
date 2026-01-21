import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Package } from "lucide-react";
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
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { routeByRole } from "@/lib/routeByRole";
import { API_ERROR_CODES, ApiError } from "@/lib/api";

interface LoginRequest {
  phoneOrEmail: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login, isLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const getErrorMessage = (err: unknown): string => {
    // Check if it's an ApiError with a code
    if (err && typeof err === "object" && "code" in err) {
      const apiError = err as ApiError;
      const i18nKey = API_ERROR_CODES[apiError.code];
      if (i18nKey) {
        return t(i18nKey);
      }
      // If we have a message from the server, use it
      if (apiError.message) {
        return apiError.message;
      }
    }
    // Fallback for Error objects
    if (err instanceof Error) {
      return err.message;
    }
    // Default fallback
    return t("errors.loginFailed");
  };

  const onSubmit = async (data: LoginRequest) => {
    setIsSubmitting(true);
    try {
      const res = await login({
        email: data.phoneOrEmail,
        password: data.password,
      });
      toast.success(t("messages.loginSuccess"));
      navigate(routeByRole(res.user.role), { replace: true });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-between items-start mb-4">
            <div></div>
            <Package className="w-12 h-12 text-blue-600" />
            <LanguageSwitcher variant="compact" />
          </div>
          <CardTitle>{t("common.welcome")}</CardTitle>
          <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneOrEmail">
                {t("common.phone")} / {t("common.email")}
              </Label>
              <Input
                id="phoneOrEmail"
                placeholder={t("common.phone")}
                {...register("phoneOrEmail", {
                  required: t("errors.required"),
                })}
              />
              {errors.phoneOrEmail && (
                <p className="text-sm text-destructive">
                  {errors.phoneOrEmail.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">{t("common.password")}</Label>
                <Link
                  to="/auth/reset-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder={t("common.password")}
                {...register("password", { required: t("errors.required") })}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading
                ? t("common.loading")
                : t("auth.signIn")}
            </Button>

            <div className="text-center space-y-2">
              <Link
                to="/auth/login-otp"
                className="text-sm text-blue-600 hover:underline block"
              >
                {t("auth.sendOtp")}
              </Link>
              <p className="text-sm text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <Link
                  to="/auth/register"
                  className="text-blue-600 hover:underline"
                >
                  {t("auth.signUp")}
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
