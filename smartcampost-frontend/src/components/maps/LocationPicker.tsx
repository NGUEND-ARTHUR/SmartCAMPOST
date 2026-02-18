import React, { useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Initialize marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (latitude: number, longitude: number) => void;
  onClose?: () => void;
}

// Component to handle map clicks
function MapClickHandler({
  onLocationClick,
}: {
  onLocationClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  React.useEffect(() => {
    const handleMapClick = (e: any) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, onLocationClick]);

  return null;
}

// Component to center map on marker
function SetViewOnMarker({
  center,
  zoom = 13,
}: {
  center: [number, number];
  zoom?: number;
}) {
  const map = useMap();

  React.useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);

  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  onClose,
}: LocationPickerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [manualLat, setManualLat] = useState(latitude?.toString() || "");
  const [manualLng, setManualLng] = useState(longitude?.toString() || "");
  const { resolvedTheme } = useTheme();

  // Current position for map center
  const currentPosition: [number, number] = useMemo(() => {
    if (latitude && longitude) {
      return [latitude, longitude];
    }
    // Default to Douala, Cameroon (major delivery hub)
    return [4.0511, 9.7679];
  }, [latitude, longitude]);

  // Get device GPS location
  const getCurrentLocation = useCallback(() => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          onLocationChange(lat, lng);
          setManualLat(lat.toString());
          setManualLng(lng.toString());
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          // Continue with map - user can click
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsLocating(false);
    }
  }, [onLocationChange]);

  // Handle map click
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      onLocationChange(lat, lng);
      setManualLat(lat.toString());
      setManualLng(lng.toString());
    },
    [onLocationChange]
  );

  // Handle manual coordinate input
  const handleApplyCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      alert("Please enter valid coordinates");
      return;
    }

    if (lat < -90 || lat > 90) {
      alert("Latitude must be between -90 and 90");
      return;
    }

    if (lng < -180 || lng > 180) {
      alert("Longitude must be between -180 and 180");
      return;
    }

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
          {/* Map */}
          <div className="rounded-lg overflow-hidden border border-border">
            <MapContainer
              center={currentPosition}
              zoom={13}
              style={{ height: "400px", width: "100%" }}
              className="rounded-lg"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {latitude && longitude && (
                <>
                  <Marker position={[latitude, longitude]}>
                    <Popup>
                      Selected Location
                      <br />
                      Lat: {latitude.toFixed(6)}
                      <br />
                      Lng: {longitude.toFixed(6)}
                    </Popup>
                  </Marker>
                </>
              )}
              <MapClickHandler onLocationClick={handleMapClick} />
              <SetViewOnMarker center={currentPosition} zoom={13} />
            </MapContainer>
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
              💡 Tip: Click anywhere on the map to select a location, or use the button above to get your current position.
            </p>
          </div>

          {/* Current Coordinates Display */}
          {latitude && longitude && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Current Coordinates:</p>
              <p className="text-sm text-muted-foreground">
                Latitude: {latitude.toFixed(6)} | Longitude: {longitude.toFixed(6)}
              </p>
            </div>
          )}

          {/* Manual Coordinate Input */}
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium">Or enter coordinates manually:</p>
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
        </CardContent>
      </Card>

      {/* Close Button */}
      {onClose && (
        <Button type="button" variant="outline" onClick={onClose} className="w-full">
          Done
        </Button>
      )}
    </div>
  );
}
