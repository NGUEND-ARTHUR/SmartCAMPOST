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
import { aiAgents } from "@/ai";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { CameroonMap } from "@/components/maps/core/CameroonMap";
import { isWithinCameroon } from "@/components/maps/core/cameroon";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (latitude: number, longitude: number) => void;
  onClose?: () => void;
  allowManualInput?: boolean;
  allowSearch?: boolean;
  restrictToCameroon?: boolean;
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
  onClose,
  allowManualInput = true,
  allowSearch = true,
  restrictToCameroon = true,
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
            toast.error("Your current location appears outside Cameroon");
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
          toast.error("Your current location appears outside Cameroon");
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
        toast.error("Please select a location within Cameroon");
        return;
      }
      onLocationChange(lat, lng);
      setManualLat(lat.toString());
      setManualLng(lng.toString());
      setSearchResultLabel(null);
    },
    [onLocationChange, restrictToCameroon, stopFollowingUser],
  );

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    try {
      const filtered = await aiAgents.mapIntelligence.search(query, {
        limit: 6,
        restrictToCameroon,
      });

      setSearchResults(filtered);
      setIsResultsOpen(true);

      if (filtered.length === 0) {
        toast.error("No results found");
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
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  }, [onLocationChange, restrictToCameroon, searchQuery, stopFollowingUser]);

  // Debounced search suggestions
  useEffect(() => {
    const q = searchQuery.trim();
    if (!allowSearch) return;
    if (q.length < 2) {
      setSearchResults([]);
      setIsResultsOpen(false);
      return;
    }

    const id = window.setTimeout(async () => {
      try {
        const filtered = await aiAgents.mapIntelligence.search(q, {
          limit: 6,
          restrictToCameroon,
        });
        setSearchResults(filtered);
        setIsResultsOpen(true);
      } catch {
        // ignore background suggestion failures
      }
    }, 350);

    return () => window.clearTimeout(id);
  }, [allowSearch, restrictToCameroon, searchQuery]);

  const selectSearchResult = useCallback(
    (r: GeoSearchResult) => {
      if (restrictToCameroon && !isWithinCameroon(r.latitude, r.longitude)) {
        toast.error("Please select a location within Cameroon");
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Select Location
          </CardTitle>
          <CardDescription>
            Click on the map or use the GPS locator to select a location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allowSearch && (
            <div className="space-y-2">
              <Label htmlFor="location-search">Search on map</Label>
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    id="location-search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsResultsOpen(true);
                    }}
                    placeholder="Neighborhood, city, region, landmark, building..."
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

                {isResultsOpen && searchResults.length > 0 && (
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
              height="400px"
              showControls
              showSearch={false}
              className="rounded-lg"
              onClick={(e) => handleMapClick(e.lngLat.lat, e.lngLat.lng)}
              cursor="crosshair"
            >
              {latitude != null && longitude != null && (
                <>
                  <Marker
                    longitude={longitude}
                    latitude={latitude}
                    anchor="bottom"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="30"
                      height="42"
                      viewBox="0 0 30 42"
                      className="cursor-pointer"
                    >
                      <path
                        d="M15 0C6.72 0 0 6.72 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.72 23.28 0 15 0z"
                        fill="#3b82f6"
                      />
                      <circle cx="15" cy="14" r="6" fill="white" />
                    </svg>
                  </Marker>
                  <Popup
                    longitude={longitude}
                    latitude={latitude}
                    anchor="bottom"
                    offset={[0, -42] as [number, number]}
                    closeButton={false}
                  >
                    <div className="text-sm">
                      Selected Location
                      <br />
                      Lat: {latitude.toFixed(6)}
                      <br />
                      Lng: {longitude.toFixed(6)}
                    </div>
                  </Popup>
                </>
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
            <p className="text-xs text-muted-foreground">
              💡 Tip: Click anywhere on the map to select a location, or use the
              button above to get your current position.
            </p>
          </div>

          {/* Current Coordinates Display */}
          {latitude != null && longitude != null && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Current Coordinates:</p>
              <p className="text-sm text-muted-foreground">
                Latitude: {latitude.toFixed(6)} | Longitude:{" "}
                {longitude.toFixed(6)}
              </p>
            </div>
          )}

          {/* Manual Coordinate Input */}
          {allowManualInput && (
            <div className="space-y-3 pt-4 border-t">
              <p className="text-sm font-medium">
                Or enter coordinates manually:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="manual-lat">Latitude</Label>
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
                  <Label htmlFor="manual-lng">Longitude</Label>
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
