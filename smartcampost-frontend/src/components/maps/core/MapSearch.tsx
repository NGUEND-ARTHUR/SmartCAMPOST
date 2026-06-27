import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMap } from "react-map-gl/maplibre";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { GeoSearchResult } from "@/services/common/geolocation.api";
import { toast } from "sonner";
import { isWithinCameroon } from "./cameroon";

async function searchNominatim(query: string, limit = 6): Promise<GeoSearchResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", Cameroon")}&format=json&limit=${limit}&addressdetails=1&accept-language=en`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data as any[]).map((r: any) => ({
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
    displayName: r.display_name,
    city: r.address?.city || r.address?.town || r.address?.village || "",
    state: r.address?.state || "",
    country: r.address?.country || "Cameroon",
    type: r.type || "",
    category: r.class || "",
  }));
}

export function MapSearch({
  placeholder = "City, neighborhood, region, landmark, building...",
  onSelect,
}: {
  placeholder?: string;
  onSelect?: (result: GeoSearchResult) => void;
}) {
  const { t } = useTranslation();
  const { current: map } = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const trimmed = query.trim();

  const containerClass = useMemo(
    () =>
      "pointer-events-none absolute left-3 top-3 z-[2] w-[min(520px,calc(100%-1.5rem))]",
    [],
  );

  useEffect(() => {
    if (trimmed.length < 2) return;

    const id = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchNominatim(trimmed, 6);
        setResults(res);
        setOpen(res.length > 0);
      } catch {
        toast.error(t("maps.errors.searchFailed"));
        setResults([]);
        setOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(id);
  }, [trimmed]);

  const select = (r: GeoSearchResult) => {
    const lat = r.latitude;
    const lng = r.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") return;

    if (!isWithinCameroon(lat, lng)) {
      toast.error(t("maps.errors.resultOutsideCameroon"));
      return;
    }

    map?.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom?.() ?? 6, 14),
      duration: 900,
    });
    setQuery(r.displayName || trimmed);
    setOpen(false);
    onSelect?.(r);
  };

  return (
    <div className={containerClass}>
      <div className="pointer-events-auto flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="map-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
            onFocus={() => results.length > 0 && setOpen(true)}
          />
        </div>
        <Button type="button" variant="secondary" disabled>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {trimmed.length >= 2 && open && results.length > 0 && (
        <Card className="pointer-events-auto mt-2 overflow-hidden">
          <div className="max-h-64 overflow-auto">
            {results.map((r, idx) => (
              <button
                key={`${r.latitude}-${r.longitude}-${idx}`}
                type="button"
                data-testid="map-search-result"
                onClick={() => select(r)}
                className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
              >
                <div className="text-sm font-medium">
                  {r.displayName ||
                    `${r.city ?? ""} ${r.state ?? ""}`.trim() ||
                    "Result"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {[r.type, r.city, r.state, r.country]
                    .filter(Boolean)
                    .join(" • ")}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
