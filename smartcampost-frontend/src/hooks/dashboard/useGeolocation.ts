/**
 * Geolocation React Query Hooks
 */
import { useMutation } from "@tanstack/react-query";
import {
  geolocationService,
  GeocodeRequest,
  RouteEtaRequest,
} from "@/services";

export function useGeocode() {
  return useMutation({
    mutationFn: (data: GeocodeRequest) => geolocationService.geocode(data),
  });
}

export function useRouteEta() {
  return useMutation({
    mutationFn: (data: RouteEtaRequest) => geolocationService.routeEta(data),
  });
}
