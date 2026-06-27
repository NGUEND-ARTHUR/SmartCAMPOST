import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Marker, Popup, useMap } from "react-map-gl/maplibre";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";
import { type GeoSearchResult } from "@/services/common/geolocation.api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { CameroonMap } from "@/components/maps/core/CameroonMap";
import { isWithinCameroon } from "@/components/maps/core/cameroon";

/** Reverse geocode via Nominatim (no key needed, respects usage policy) */
async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<LocationPickerResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en&zoom=14&addressdetails=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    return {
      city:
        addr.city || addr.town || addr.municipality || addr.village || addr.hamlet,
      region: addr.state || addr.region || addr.county,
      displayName: data.display_name,
      street: addr.road || addr.street || addr.pedestrian || addr.path || addr.cycleway || addr.footway,
      quarter: addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.subdivision,
    };
  } catch {
    return null;
  }
}

/** Fast autocomplete search via Nominatim */
async function searchPlaces(query: string, limit = 6): Promise<GeoSearchResult[]> {
  try {
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
  } catch {
    return [];
  }
}

export interface LocationPickerResult {
  city?: string;
  region?: string;
  displayName?: string;
  street?: string;
  quarter?: string;
}

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (latitude: number, longitude: number) => void;
  onLocationResolved?: (result: LocationPickerResult) => void;
  onClose?: () => void;
  allowManualInput?: boolean;
  allowSearch?: boolean;
  restrictToCameroon?: boolean;
  compact?: boolean;
}

// Component to center map on marker position
function SetViewOnMarker({
  center,
  zoom = 13,
}: {
  center: [number, number];
  zoom?: number;
}) {
  const { current: map } = useMap();

  React.useEffect(() => {
    map?.flyTo({ center: [center[1], center[0]], zoom, duration: 900 });
  }, [center, zoom, map]);

  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  onLocationResolved,
  onClose,
  allowManualInput = true,
  allowSearch = true,
  restrictToCameroon = true,
  compact = false,
}: LocationPickerProps) {
  const { t } = useTranslation();
  const [isLocating, setIsLocating] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const hasWarnedOutsideRef = useRef(false);
  const [isFollowingUser, setIsFollowingUser] = useState(
    latitude == null || longitude == null,
  );

  const [manualLat, setManualLat] = useState(latitude?.toString() || "");
  const [manualLng, setManualLng] = useState(longitude?.toString() || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultLabel, setSearchResultLabel] = useState<string | null>(
    null,
  );
  const [searchResults, setSearchResults] = useState<GeoSearchResult[]>([]);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [resolvedLabel, setResolvedLabel] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Current position for map center
  const currentPosition: [number, number] = useMemo(() => {
    if (latitude != null && longitude != null) {
      return [latitude, longitude];
    }
    // Default to Douala, Cameroon (major delivery hub)
    return [4.0511, 9.7679];
  }, [latitude, longitude]);

  const stopFollowingUser = useCallback(() => {
    if (watchIdRef.current != null && typeof navigator !== "undefined") {
      navigator.geolocation?.clearWatch?.(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  /** Resolve lat/lng → city/region via reverse geocoding, notify parent */
  const resolveLocation = useCallback(
    async (lat: number, lng: number) => {
      setIsResolving(true);
      const result = await reverseGeocode(lat, lng);
      setIsResolving(false);
      if (result) {
        const label = [result.city, result.region].filter(Boolean).join(", ");
        setResolvedLabel(label || result.displayName || null);
        onLocationResolved?.(result);
      } else {
        setResolvedLabel(null);
        toast.warning(
          t(
            "locationPicker.reverseGeocodeFailed",
            "Couldn't auto-fill city/region for this location — please enter them manually.",
          ),
        );
      }
    },
    [onLocationResolved, t],
  );

  // Follow device GPS location in real-time (until user selects a point)
  useEffect(() => {
    if (!isFollowingUser) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    stopFollowingUser();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (restrictToCameroon && !isWithinCameroon(lat, lng)) {
          if (!hasWarnedOutsideRef.current) {
            hasWarnedOutsideRef.current = true;
            toast.error(t("maps.errors.outsideCameroon"));
          }
          setIsFollowingUser(false);
          stopFollowingUser();
          return;
        }

        onLocationChange(lat, lng);
        setManualLat(String(lat));
        setManualLng(String(lng));
        setSearchResultLabel(null);
      },
      () => {
        setIsFollowingUser(false);
        stopFollowingUser();
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
    );

    return () => {
      stopFollowingUser();
    };
  }, [
    isFollowingUser,
    onLocationChange,
    restrictToCameroon,
    stopFollowingUser,
  ]);

  // Get device GPS location (one-shot) + re-enable follow
  const getCurrentLocation = useCallback(() => {
    setIsLocating(true);
    hasWarnedOutsideRef.current = false;
    setIsFollowingUser(true);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (restrictToCameroon && !isWithinCameroon(lat, lng)) {
          toast.error(t("maps.errors.outsideCameroon"));
          setIsFollowingUser(false);
          stopFollowingUser();
          setIsLocating(false);
          return;
        }

        onLocationChange(lat, lng);
        setManualLat(String(lat));
        setManualLng(String(lng));
        setSearchResultLabel(null);
        setIsLocating(false);
      },
      () => {
        setIsFollowingUser(false);
        stopFollowingUser();
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [onLocationChange, restrictToCameroon, stopFollowingUser]);

  // Handle map click
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setIsFollowingUser(false);
      stopFollowingUser();
      if (restrictToCameroon && !isWithinCameroon(lat, lng)) {
        toast.error(t("maps.errors.selectWithinCameroon"));
        return;
      }
      onLocationChange(lat, lng);
      setManualLat(lat.toString());
      setManualLng(lng.toString());
      setSearchResultLabel(null);
      void resolveLocation(lat, lng);
    },
    [onLocationChange, restrictToCameroon, stopFollowingUser, resolveLocation],
  );

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    try {
      const filtered = await searchPlaces(query, 6);

      setSearchResults(filtered);
      setIsResultsOpen(true);

      if (filtered.length === 0) {
        toast.error(t("maps.errors.noResults"));
        return;
      }

      // Auto-select the top result for speed (user can still pick another)
      const top = filtered[0];
      setIsFollowingUser(false);
      stopFollowingUser();
      onLocationChange(top.latitude, top.longitude);
      setManualLat(String(top.latitude));
      setManualLng(String(top.longitude));
      setSearchResultLabel(top.displayName || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("maps.errors.searchFailed"));
    } finally {
      setIsSearching(false);
    }
  }, [onLocationChange, restrictToCameroon, searchQuery, stopFollowingUser]);

  // Debounced search suggestions
  useEffect(() => {
    const q = searchQuery.trim();
    if (!allowSearch) return;
    if (q.length < 2) return;

    const id = window.setTimeout(async () => {
      try {
        const filtered = await searchPlaces(q, 6);
        setSearchResults(filtered);
        setIsResultsOpen(true);
      } catch {
        // ignore background suggestion failures
      }
    }, 200);

    return () => window.clearTimeout(id);
  }, [allowSearch, restrictToCameroon, searchQuery]);

  const selectSearchResult = useCallback(
    (r: GeoSearchResult) => {
      if (restrictToCameroon && !isWithinCameroon(r.latitude, r.longitude)) {
        toast.error(t("maps.errors.selectWithinCameroon"));
        return;
      }
      setIsFollowingUser(false);
      stopFollowingUser();
      onLocationChange(r.latitude, r.longitude);
      setManualLat(String(r.latitude));
      setManualLng(String(r.longitude));
      setSearchResultLabel(r.displayName || null);
      setIsResultsOpen(false);
    },
    [onLocationChange, restrictToCameroon, stopFollowingUser],
  );

  // Handle manual coordinate input
  const handleApplyCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error(t("locationPicker.invalidCoordinates"));
      return;
    }

    if (lat < -90 || lat > 90) {
      toast.error(t("locationPicker.latitudeOutOfRange"));
      return;
    }

    if (lng < -180 || lng > 180) {
      toast.error(t("locationPicker.longitudeOutOfRange"));
      return;
    }

    setIsFollowingUser(false);
    stopFollowingUser();
    onLocationChange(lat, lng);
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      <Card>
        <CardHeader className={compact ? "pb-2 pt-3 px-3" : undefined}>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t("locationPicker.title")}
          </CardTitle>
          {!compact && (
            <CardDescription>
              {t("locationPicker.subtitle")}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className={compact ? "space-y-2 px-3 pb-3" : "space-y-4"}>
          {allowSearch && (
            <div className="space-y-2">
              <Label htmlFor="location-search">{t("locationPicker.searchOnMap")}</Label>
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    id="location-search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsResultsOpen(true);
                    }}
                    placeholder={t("locationPicker.searchPlaceholder")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSearch();
                      }
                      if (e.key === "Escape") {
                        setIsResultsOpen(false);
                      }
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) setIsResultsOpen(true);
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void handleSearch()}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>

                {allowSearch &&
                  searchQuery.trim().length >= 2 &&
                  isResultsOpen &&
                  searchResults.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full rounded-md border bg-card shadow">
                      <div className="max-h-60 overflow-auto">
                        {searchResults.map((r, idx) => (
                          <button
                            key={`${r.latitude}-${r.longitude}-${idx}`}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                            onClick={() => selectSearchResult(r)}
                          >
                            <div className="text-sm font-medium">
                              {r.displayName ||
                                [r.city, r.state, r.country]
                                  .filter(Boolean)
                                  .join(", ") ||
                                "Result"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {[r.type, r.category].filter(Boolean).join(" • ")}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              {searchResultLabel && (
                <p className="text-xs text-muted-foreground">
                  Result: {searchResultLabel}
                </p>
              )}
            </div>
          )}

          {/* Map */}
          <div className="rounded-lg overflow-hidden border border-border">
            <CameroonMap
              center={currentPosition}
              zoom={13}
              height={compact ? "350px" : "400px"}
              showControls
              showSearch={false}
              className="rounded-lg"
              onClick={(e) => handleMapClick(e.lngLat.lat, e.lngLat.lng)}
              cursor="crosshair"
            >
              {latitude != null && longitude != null && (
                <Marker
                  longitude={longitude}
                  latitude={latitude}
                  anchor="bottom"
                  draggable
                  onDragEnd={(e) => {
                    const lat = e.lngLat.lat;
                    const lng = e.lngLat.lng;
                    if (restrictToCameroon && !isWithinCameroon(lat, lng)) {
                      toast.error(t("maps.errors.selectWithinCameroon"));
                      return;
                    }
                    setIsFollowingUser(false);
                    stopFollowingUser();
                    onLocationChange(lat, lng);
                    setManualLat(lat.toString());
                    setManualLng(lng.toString());
                    void resolveLocation(lat, lng);
                  }}
                >
                  <div className="flex flex-col items-center cursor-grab active:cursor-grabbing">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="w-2 h-2 bg-primary rotate-45 -mt-1" />
                  </div>
                </Marker>
              )}
              <SetViewOnMarker center={currentPosition} zoom={13} />
            </CameroonMap>
          </div>

          {/* GPS and Instructions */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isLocating}
              className="w-full"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Use My Current Location
                </>
              )}
            </Button>
            {!compact && (
              <p className="text-xs text-muted-foreground">
                💡 Tip: Click anywhere on the map to select a location, or use
                the button above to get your current position.
              </p>
            )}
          </div>

          {/* Current Coordinates + Resolved Location Display */}
          {latitude != null && longitude != null && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Location Captured Successfully
                </span>
              </div>
              {isResolving && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Resolving location...
                </p>
              )}
              {resolvedLabel && !isResolving && (
                <p className="text-xs text-primary mt-1">📍 {resolvedLabel}</p>
              )}
            </div>
          )}

          {/* Manual Coordinate Input */}
          {allowManualInput && !compact && (
            <div className="space-y-3 pt-4 border-t">
              <p className="text-sm font-medium">
                {t("locationPicker.manualCoordinates")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="manual-lat">{t("locationPicker.latitude")}</Label>
                  <Input
                    id="manual-lat"
                    type="number"
                    step="0.000001"
                    placeholder="4.0511"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="manual-lng">{t("locationPicker.longitude")}</Label>
                  <Input
                    id="manual-lng"
                    type="number"
                    step="0.000001"
                    placeholder="9.7679"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleApplyCoordinates}
                className="w-full"
              >
                Apply Coordinates
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Close Button */}
      {onClose && (
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="w-full"
        >
          Done
        </Button>
      )}
    </div>
  );
}
