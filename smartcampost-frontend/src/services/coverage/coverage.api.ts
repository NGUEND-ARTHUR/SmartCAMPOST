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
  // Authentication
  { id: "auth-register", method: "POST", path: "/auth/register" },
  { id: "auth-login", method: "POST", path: "/auth/login" },
  {
    id: "auth-login-otp-request",
    method: "POST",
    path: "/auth/login/otp/request",
  },
  {
    id: "auth-login-otp-confirm",
    method: "POST",
    path: "/auth/login/otp/confirm",
  },
  { id: "auth-send-otp", method: "POST", path: "/auth/send-otp" },
  { id: "auth-verify-otp", method: "POST", path: "/auth/verify-otp" },
  {
    id: "auth-password-reset-request",
    method: "POST",
    path: "/auth/password/reset/request",
  },
  {
    id: "auth-password-reset-confirm",
    method: "POST",
    path: "/auth/password/reset/confirm",
  },

  // Parcels & scanning
  { id: "parcels-create", method: "POST", path: "/parcels" },
  { id: "parcels-me", method: "GET", path: "/parcels/me" },
  { id: "parcels-get", method: "GET", path: "/parcels/{parcelId}" },
  {
    id: "parcels-tracking",
    method: "GET",
    path: "/parcels/tracking/{trackingRef}",
  },
  { id: "parcels-list", method: "GET", path: "/parcels" },
  {
    id: "parcels-scan-events",
    method: "GET",
    path: "/parcels/{parcelId}/scan-events",
  },
  { id: "parcels-scan", method: "POST", path: "/parcels/{parcelId}/scan" },

  // QR / Labels
  { id: "parcel-qr", method: "GET", path: "/parcels/{parcelId}/qr" },
  {
    id: "parcel-qr-print",
    method: "GET",
    path: "/parcels/{parcelId}/qr/print",
  },
  { id: "qr-parcel", method: "GET", path: "/qr/parcel/{parcelId}" },
  { id: "qr-tracking", method: "GET", path: "/qr/tracking/{trackingRef}" },
  { id: "qr-parcel-image", method: "GET", path: "/qr/parcel/{parcelId}/image" },
  {
    id: "qr-tracking-image",
    method: "GET",
    path: "/qr/tracking/{trackingRef}/image",
  },
  {
    id: "qr-pickup-temporary",
    method: "POST",
    path: "/qr/pickup/{pickupId}/temporary",
  },
  {
    id: "qr-validate-temporary",
    method: "GET",
    path: "/qr/validate/{temporaryToken}",
  },
  {
    id: "qr-pickup-convert",
    method: "POST",
    path: "/qr/pickup/{pickupId}/convert",
  },
  {
    id: "qr-label-by-tracking",
    method: "GET",
    path: "/qr/label/tracking/{trackingRef}",
  },
  { id: "qr-verify", method: "POST", path: "/qr/verify" },
  { id: "qr-verify-get", method: "GET", path: "/qr/verify/{qrContent}" },
  { id: "qr-secure-parcel", method: "POST", path: "/qr/secure/{parcelId}" },
  { id: "qr-revoke-token", method: "DELETE", path: "/qr/revoke/{token}" },
  {
    id: "qr-revoke-parcel",
    method: "DELETE",
    path: "/qr/revoke/parcel/{parcelId}",
  },

  // Pickups
  { id: "pickup-create", method: "POST", path: "/pickups" },
  { id: "pickup-get", method: "GET", path: "/pickups/{pickupId}" },
  {
    id: "pickup-by-parcel",
    method: "GET",
    path: "/pickups/by-parcel/{parcelId}",
  },
  { id: "pickup-me", method: "GET", path: "/pickups/me" },
  { id: "pickup-courier-me", method: "GET", path: "/pickups/courier/me" },
  { id: "pickup-list", method: "GET", path: "/pickups" },
  {
    id: "pickup-assign-courier",
    method: "POST",
    path: "/pickups/{pickupId}/assign-courier",
  },
  { id: "pickup-generate-qr", method: "POST", path: "/pickups/{pickupId}/qr" },
  {
    id: "pickup-qr-view",
    method: "GET",
    path: "/pickups/qr/{temporaryQrToken}",
  },
  { id: "pickup-confirm", method: "POST", path: "/pickups/confirm" },

  // Payments & MTN MoMo
  {
    id: "payments-momo-initiate",
    method: "POST",
    path: "/payments/momo/initiate",
  },
  {
    id: "payments-momo-callback",
    method: "POST",
    path: "/payments/momo/callback",
  },
  { id: "payments-get", method: "GET", path: "/payments/{paymentId}" },
  { id: "payments-init", method: "POST", path: "/payments/init" },
  { id: "payments-confirm", method: "POST", path: "/payments/confirm" },
  {
    id: "payments-by-parcel",
    method: "GET",
    path: "/payments/parcel/{parcelId}",
  },
  { id: "payments-list", method: "GET", path: "/payments" },
  {
    id: "payments-registration",
    method: "POST",
    path: "/payments/registration/{parcelId}",
  },
  {
    id: "payments-pickup",
    method: "POST",
    path: "/payments/pickup/{parcelId}",
  },
  {
    id: "payments-delivery",
    method: "POST",
    path: "/payments/delivery/{parcelId}",
  },
  {
    id: "payments-summary",
    method: "GET",
    path: "/payments/summary/{parcelId}",
  },

  // Invoices
  { id: "invoices-me", method: "GET", path: "/invoices/me" },
  { id: "invoices-get", method: "GET", path: "/invoices/{invoiceId}" },
  {
    id: "invoices-by-parcel",
    method: "GET",
    path: "/invoices/by-parcel/{parcelId}",
  },
  { id: "invoices-pdf", method: "GET", path: "/invoices/{invoiceId}/pdf" },

  // Location & Map
  { id: "location-update", method: "POST", path: "/location/update" },
  { id: "location-me", method: "GET", path: "/location/me" },
  { id: "map-parcel", method: "GET", path: "/map/parcels/{parcelId}" },
  { id: "map-couriers-me", method: "GET", path: "/map/couriers/me" },
  { id: "map-admin-overview", method: "GET", path: "/map/admin/overview" },

  // Scan events & stream
  { id: "scan-events-create", method: "POST", path: "/scan-events" },
  {
    id: "scan-events-by-parcel",
    method: "GET",
    path: "/scan-events/parcel/{parcelId}",
  },
  { id: "stream-scans", method: "GET", path: "/stream/scans" },

  // Delivery, OTP and receipts
  { id: "delivery-otp-send", method: "POST", path: "/delivery/otp/send" },
  { id: "delivery-otp-verify", method: "POST", path: "/delivery/otp/verify" },
  { id: "delivery-finalize", method: "POST", path: "/delivery/final" },
  { id: "delivery-start", method: "POST", path: "/delivery/start" },
  {
    id: "delivery-otp-resend",
    method: "POST",
    path: "/delivery/{parcelId}/otp/resend",
  },
  { id: "delivery-complete", method: "POST", path: "/delivery/complete" },
  { id: "delivery-status", method: "GET", path: "/delivery/{parcelId}/status" },
  {
    id: "delivery-failed",
    method: "POST",
    path: "/delivery/{parcelId}/failed",
  },
  {
    id: "delivery-reschedule",
    method: "POST",
    path: "/delivery/{parcelId}/reschedule",
  },
  {
    id: "receipts-by-parcel",
    method: "GET",
    path: "/receipts/parcel/{parcelId}",
  },
  {
    id: "receipt-by-number",
    method: "GET",
    path: "/receipts/number/{receiptNumber}",
  },

  // Notifications
  {
    id: "notifications-trigger",
    method: "POST",
    path: "/notifications/trigger",
  },
  { id: "notifications-get", method: "GET", path: "/notifications/{id}" },
  { id: "notifications-list", method: "GET", path: "/notifications" },
  {
    id: "notifications-retry",
    method: "POST",
    path: "/notifications/{id}/retry",
  },
  {
    id: "notifications-by-parcel",
    method: "GET",
    path: "/notifications/parcel/{parcelId}",
  },
  {
    id: "notifications-by-pickup",
    method: "GET",
    path: "/notifications/pickup/{pickupId}",
  },

  // Tariffs & pricing
  { id: "tariffs-create", method: "POST", path: "/tariffs" },
  { id: "tariffs-list", method: "GET", path: "/tariffs" },
  { id: "tariffs-get", method: "GET", path: "/tariffs/{tariffId}" },
  { id: "tariffs-update", method: "PUT", path: "/tariffs/{tariffId}" },
  { id: "tariffs-delete", method: "DELETE", path: "/tariffs/{tariffId}" },
  { id: "tariffs-quote", method: "POST", path: "/tariffs/quote" },

  // Admin / Staff / Agencies / Agents / Clients
  { id: "admin-users", method: "GET", path: "/admin/users" },
  { id: "admin-users-by-role", method: "GET", path: "/admin/users/by-role" },
  { id: "staff-create", method: "POST", path: "/staff" },
  { id: "staff-get", method: "GET", path: "/staff/{staffId}" },
  { id: "staff-list", method: "GET", path: "/staff" },
  { id: "agents-create", method: "POST", path: "/agents" },
  { id: "agents-get", method: "GET", path: "/agents/{agentId}" },
  { id: "agents-list", method: "GET", path: "/agents" },
  { id: "agencies-create", method: "POST", path: "/agencies" },
  { id: "agencies-list", method: "GET", path: "/agencies" },
  { id: "agencies-get", method: "GET", path: "/agencies/{agencyId}" },
  { id: "agencies-update", method: "PUT", path: "/agencies/{agencyId}" },
  { id: "clients-me", method: "GET", path: "/clients/me" },
  { id: "clients-update-me", method: "PUT", path: "/clients/me" },
  { id: "clients-get", method: "GET", path: "/clients/{clientId}" },
  { id: "clients-list", method: "GET", path: "/clients" },

  // Integrations, compliance, risk, analytics, dashboard
  { id: "integrations-create", method: "POST", path: "/integrations" },
  { id: "integrations-update", method: "PUT", path: "/integrations/{id}" },
  { id: "integrations-get", method: "GET", path: "/integrations/{id}" },
  { id: "integrations-list", method: "GET", path: "/integrations" },
  { id: "compliance-alerts", method: "GET", path: "/compliance/alerts" },
  {
    id: "compliance-alert-get",
    method: "GET",
    path: "/compliance/alerts/{id}",
  },
  { id: "compliance-reports", method: "GET", path: "/compliance/reports" },
  {
    id: "compliance-freeze-account",
    method: "POST",
    path: "/compliance/accounts/{userId}/freeze",
  },
  {
    id: "compliance-unfreeze-account",
    method: "POST",
    path: "/compliance/accounts/{userId}/unfreeze",
  },
  { id: "risk-alerts", method: "GET", path: "/risk/alerts" },
  {
    id: "analytics-eta",
    method: "GET",
    path: "/analytics/parcels/{parcelId}/eta",
  },
  {
    id: "analytics-payment-anomaly",
    method: "GET",
    path: "/analytics/payments/{paymentId}/anomaly",
  },
  { id: "dashboard-summary", method: "GET", path: "/dashboard/summary" },

  // AI
  { id: "ai-optimize", method: "POST", path: "/ai/optimize-route" },
  { id: "ai-chat", method: "POST", path: "/ai/chat" },
  { id: "ai-chat-stream", method: "POST", path: "/ai/chat/stream" },
  { id: "ai-predict-delivery", method: "POST", path: "/ai/predict-delivery" },

  // Mtn token/init utilities
  { id: "mtn-token", method: "POST", path: "/payments/mtn/token" },
  { id: "mtn-init", method: "POST", path: "/payments/mtn/init" },

  // Misc
  { id: "ussd-handle", method: "POST", path: "/ussd/handle" },
  {
    id: "pricing-detail-parcel",
    method: "GET",
    path: "/pricing-details/parcel/{parcelId}",
  },
  {
    id: "pricing-detail-parcel-all",
    method: "GET",
    path: "/pricing-details/parcel/{parcelId}/all",
  },
  { id: "refund-create", method: "POST", path: "/refunds" },
  { id: "refund-get", method: "GET", path: "/refunds/{refundId}" },
  {
    id: "refund-by-payment",
    method: "GET",
    path: "/refunds/payment/{paymentId}",
  },
  { id: "finance-refunds", method: "GET", path: "/finance/refunds" },
  { id: "mcd-geocode", method: "POST", path: "/geo/geocode" },
  { id: "map-viewer", method: "GET", path: "/maps/viewer" },
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
