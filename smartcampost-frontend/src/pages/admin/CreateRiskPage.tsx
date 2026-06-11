import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { riskService } from "@/services";
import { toast } from "sonner";

const RISK_TYPES = [
  "FRAUD",
  "AML",
  "OPERATIONAL",
  "REGULATORY",
  "CREDIT",
  "MARKET",
  "OTHER",
] as const;

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export default function CreateRiskPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !severity || !description.trim()) {
      toast.error(t("createRiskPage.requiredFields", "All fields are required."));
      return;
    }

    try {
      setIsLoading(true);
      await riskService.createAlert({ type, severity, description });
      toast.success(t("createRiskPage.success", "Risk alert created successfully."));
      navigate("/admin/risk");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("createRiskPage.createFailed", "Failed to create risk alert."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("common.back", "Back")}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t("createRiskPage.title", "Create Risk Alert")}</CardTitle>
          <CardDescription>
            {t(
              "createRiskPage.subtitle",
              "Flag a compliance or operational risk for review.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="risk-type">
                {t("createRiskPage.riskType", "Risk Type")} *
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="risk-type">
                  <SelectValue
                    placeholder={t(
                      "createRiskPage.selectType",
                      "Select risk type",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {RISK_TYPES.map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      {t(`riskType.${rt.toLowerCase()}`, rt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk-severity">
                {t("createRiskPage.severity", "Severity")} *
              </Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger id="risk-severity">
                  <SelectValue
                    placeholder={t(
                      "createRiskPage.selectSeverity",
                      "Select severity",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`severity.${s.toLowerCase()}`, s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk-description">
                {t("createRiskPage.description", "Description")} *
              </Label>
              <Textarea
                id="risk-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t(
                  "createRiskPage.descriptionPlaceholder",
                  "Describe the risk in detail...",
                )}
                rows={4}
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("createRiskPage.submit", "Create Alert")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
