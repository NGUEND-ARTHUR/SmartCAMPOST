import { useEffect, useMemo, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { geolocationService, GeoSearchResult } from "@/services/common/geolocation.api";
import { toast } from "sonner";
import { CAMEROON_BOUNDS } from "./cameroon";
import L from "leaflet";

type LatLngTuple = [number, number];

export function MapSearch({
  placeholder = "City, neighborhood, region, landmark, building...",
  onSelect,
}: {
  placeholder?: string;
  onSelect?: (result: GeoSearchResult) => void;
}) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const trimmed = query.trim();

  const containerClass = useMemo(
    () =>
      "pointer-events-none absolute left-3 top-3 z-[500] w-[min(520px,calc(100%-1.5rem))]",
    [],
  );

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const id = window.setTimeout(async () => {
      const now = Date.now();
      // avoid spamming (basic 1req/350ms)
      if (now - lastFetchRef.current < 350) return;
      lastFetchRef.current = now;

      setIsLoading(true);
      try {
        const res = await geolocationService.search({ query: trimmed, limit: 6 });
        setResults(res);
        setOpen(true);
      } catch {
        toast.error("Search failed");
        setResults([]);
        setOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(id);
  }, [trimmed]);

  const select = (r: GeoSearchResult) => {
    const lat = r.latitude;
    const lng = r.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") return;

    const within = CAMEROON_BOUNDS.contains(L.latLng(lat, lng));
    if (!within) {
      toast.error("Result is outside Cameroon");
      return;
    }

    const next: LatLngTuple = [lat, lng];
    map.flyTo(next, Math.max(map.getZoom(), 14), { duration: 0.9 });
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
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {open && results.length > 0 && (
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
                  {r.displayName || `${r.city ?? ""} ${r.state ?? ""}`.trim() || "Result"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {[
                    r.type,
                    r.city,
                    r.state,
                    r.country,
                  ]
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
