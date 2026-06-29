import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import LeafletMap from "@/components/maps/LeafletMap";
import { agencyService } from "@/services/users/agencies.api";

export default function MapViewer() {
  const { t } = useTranslation();
  const [markers, setMarkers] = useState<Array<{ id: string; position: [number, number]; label?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const agencies = await agencyService.listAll();
        const list = Array.isArray(agencies) ? agencies : [];
        setMarkers(
          list
            .filter((a) => a.latitude && a.longitude)
            .map((a) => ({
              id: `agency-${a.id}`,
              position: [a.latitude!, a.longitude!] as [number, number],
              label: `${a.agencyName} (${a.city || ""})`,
            })),
        );
      } catch {
        setMarkers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t("maps.viewer.title")}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {t("maps.viewer.subtitle")}
      </p>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <LeafletMap markers={markers} height="600px" showSearch />
      )}
    </div>
  );
}
