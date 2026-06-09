import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateStaff } from "@/hooks";
import { toast } from "sonner";

export default function CreateFinancePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createStaff = useCreateStaff();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.password.trim()) {
      toast.error(t("createFinancePage.requiredFields", "Full name, phone, and password are required."));
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      password: form.password,
      role: "FINANCE" as const,
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
    };

    createStaff.mutate(payload, {
      onSuccess: () => {
        toast.success(t("createFinancePage.success", "Finance user created successfully."));
        navigate("/admin/users/staff");
      },
      onError: (err) =>
        toast.error(
          err instanceof Error
            ? err.message
            : t("createFinancePage.error", "Failed to create finance user."),
        ),
    });
  };

  return (
    <div className="max-w-lg mx-auto mt-10">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("common.back", "Back")}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t("createFinancePage.title", "Create Finance User")}</CardTitle>
          <CardDescription>
            {t("createFinancePage.subtitle", "Create a new user with the Finance role who can view payments and refunds.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("staffManagement.fullName", "Full Name")} *</Label>
              <Input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder={t("staffManagement.fullNamePlaceholder", "e.g. Jean-Pierre Mbida")}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t("staffManagement.phone", "Phone")} *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+237 6XX XXX XXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("staffManagement.email", "Email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="finance@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("staffManagement.password", "Password")} *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder={t("staffManagement.passwordPlaceholder", "Minimum 8 characters")}
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/users/staff")}
                className="flex-1"
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createStaff.isPending}
                className="flex-1"
              >
                {createStaff.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {t("createFinancePage.submit", "Create Finance User")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
