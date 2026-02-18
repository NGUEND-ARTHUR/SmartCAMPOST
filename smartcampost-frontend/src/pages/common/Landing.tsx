import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/ui/languageswitcher";
import { Package, Truck, MapPin, Shield } from "lucide-react";

export function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [trackingRef, setTrackingRef] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Package className="w-8 h-8 text-blue-600" />
          <span className="text-2xl font-bold text-blue-600">SmartCAMPOST</span>
        </div>
        <div className="flex gap-3 items-center">
          <LanguageSwitcher variant="default" />
          <Button variant="ghost" onClick={() => navigate("/auth/login")}>
            {t("common.login")}
          </Button>
          <Button onClick={() => navigate("/auth/register")}>
            {t("common.register")}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-6">
          {t("landing.hero.title")
            .split("\n")
            .map((line, i) => (
              <span key={i}>
                {i === 0 ? (
                  line
                ) : (
                  <>
                    <br />
                    <span className="text-blue-600">{line}</span>
                  </>
                )}
              </span>
            ))}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t("landing.hero.subtitle")}
        </p>

        {/* Track Parcel */}
        <div className="max-w-md mx-auto mb-12">
          <div className="flex gap-2">
            <Input
              placeholder={t("parcels.trackingNumber")}
              className="flex-1"
              value={trackingRef}
              onChange={(e) => setTrackingRef(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const trimmed = trackingRef.trim();
                if (!trimmed) return;
                navigate(`/tracking?ref=${encodeURIComponent(trimmed)}`);
              }}
            />
            <Button
              onClick={() => {
                const trimmed = trackingRef.trim();
                if (!trimmed) return;
                navigate(`/tracking?ref=${encodeURIComponent(trimmed)}`);
              }}
            >
              {t("common.search")}
            </Button>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => navigate("/auth/register")}>
            {t("landing.hero.cta")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/auth/login")}
          >
            {t("auth.signIn")}
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          {t("landing.features.title")}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2 text-foreground">
              {t("landing.features.tracking.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("landing.features.tracking.description")}
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2 text-foreground">
              {t("landing.features.delivery.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("landing.features.delivery.description")}
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2 text-foreground">
              {t("landing.features.secure.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("landing.features.secure.description")}
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold mb-2 text-foreground">
              {t("landing.features.support.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("landing.features.support.description")}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2026 SmartCAMPOST. {t("common.all")} rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
