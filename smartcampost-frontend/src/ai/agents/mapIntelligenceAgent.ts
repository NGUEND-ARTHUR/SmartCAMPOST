import { geolocationService, GeoSearchResult } from "@/services/common/geolocation.api";
import { CAMEROON_BOUNDS } from "@/components/maps/core/cameroon";
import L from "leaflet";
import { rankFuzzy } from "../core/fuzzy";
import { DataOptimizationAgent } from "./dataOptimizationAgent";

export type MapSearchOptions = {
  limit?: number;
  restrictToCameroon?: boolean;
};

export class MapIntelligenceAgent {
  constructor(private readonly dataAgent: DataOptimizationAgent) {}

  async search(query: string, opts?: MapSearchOptions): Promise<GeoSearchResult[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const limit = Math.min(10, Math.max(1, opts?.limit ?? 6));
    const restrict = opts?.restrictToCameroon ?? true;

    const cacheKey = `geo.search:${restrict ? "cm" : "any"}:${limit}:${q.toLowerCase()}`;
    const cached = this.dataAgent.get<GeoSearchResult[]>(cacheKey);
    if (cached) return cached;

    const results = await geolocationService.search({ query: q, limit });
    const filtered = restrict
      ? results.filter((r) => {
          const lat = r.latitude;
          const lng = r.longitude;
          return (
            typeof lat === "number" &&
            typeof lng === "number" &&
            CAMEROON_BOUNDS.contains(L.latLng(lat, lng))
          );
        })
      : results;

    const ranked = rankFuzzy(
      q,
      filtered,
      (r) =>
        r.displayName ||
        [r.type, r.city, r.state, r.country].filter(Boolean).join(" ") ||
        `${r.latitude},${r.longitude}`,
      { limit },
    );

    this.dataAgent.set(cacheKey, ranked, 45_000);
    return ranked;
  }
}
