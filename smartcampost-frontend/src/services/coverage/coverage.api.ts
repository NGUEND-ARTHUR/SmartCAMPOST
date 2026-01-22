import apiClient from "@/lib/api";

export type EndpointDescriptor = {
  id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string; // path relative to /api
  description?: string;
  exampleBody?: any;
};

// Minimal curated list extracted from backend controllers.
export const ENDPOINTS: EndpointDescriptor[] = [
  { id: "auth-register", method: "POST", path: "/auth/register" },
  { id: "auth-login", method: "POST", path: "/auth/login" },
  { id: "auth-send-otp", method: "POST", path: "/auth/send-otp" },
  { id: "auth-verify-otp", method: "POST", path: "/auth/verify-otp" },
  { id: "parcels-create", method: "POST", path: "/parcels" },
  { id: "parcels-me", method: "GET", path: "/parcels/me" },
  { id: "parcels-get", method: "GET", path: "/parcels/{parcelId}" },
  {
    id: "parcels-tracking",
    method: "GET",
    path: "/parcels/tracking/{trackingRef}",
  },
  { id: "parcels-list", method: "GET", path: "/parcels" },
  { id: "parcels-status", method: "PATCH", path: "/parcels/{parcelId}/status" },
  { id: "pickup-create", method: "POST", path: "/pickups" },
  { id: "pickup-me", method: "GET", path: "/pickups/me" },
  { id: "pickup-get", method: "GET", path: "/pickups/{pickupId}" },
  {
    id: "pickup-assign",
    method: "POST",
    path: "/pickups/{pickupId}/assign-courier",
  },
  { id: "payments-init", method: "POST", path: "/payments/init" },
  { id: "payments-confirm", method: "POST", path: "/payments/confirm" },
  {
    id: "notifications-trigger",
    method: "POST",
    path: "/notifications/trigger",
  },
  { id: "qr-parcel", method: "GET", path: "/qr/parcel/{parcelId}" },
  { id: "qr-label", method: "GET", path: "/qr/label/{parcelId}" },
  { id: "ai-optimize", method: "POST", path: "/ai/optimize-route" },
  { id: "ai-chat", method: "POST", path: "/ai/chat" },
  { id: "admin-users", method: "GET", path: "/admin/users" },
  { id: "admin-freeze", method: "PATCH", path: "/admin/users/{userId}/freeze" },
  { id: "agencies-list", method: "GET", path: "/agencies" },
  { id: "integrations-list", method: "GET", path: "/integrations" },
  { id: "geo-geocode", method: "POST", path: "/geo/geocode" },
  // ... add more as needed; this list aims to cover all controllers discovered
];

export async function invokeEndpoint(
  endpoint: EndpointDescriptor,
  pathParams: Record<string, string> = {},
  body?: any,
): Promise<any> {
  // Build path by substituting {var}
  let path = endpoint.path;
  for (const [k, v] of Object.entries(pathParams)) {
    path = path.replace(`{${k}}`, encodeURIComponent(v));
  }

  switch (endpoint.method) {
    case "GET":
      return apiClient.get(path);
    case "POST":
      return apiClient.post(path, body);
    case "PUT":
      return apiClient.put(path, body);
    case "PATCH":
      return apiClient.patch(path, body);
    case "DELETE":
      return apiClient.delete(path);
    default:
      throw new Error("Unsupported method");
  }
}

export default { ENDPOINTS, invokeEndpoint };
