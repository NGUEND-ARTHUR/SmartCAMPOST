import { httpClient } from "../apiClient";

// ==================== TYPES ====================

export interface QrVerificationRequest {
  token: string;
  signature?: string;
  trackingRef?: string;
}

export interface QrVerificationResponse {
  valid: boolean;
  status: VerificationStatus;
  message: string;
  errorCode?: string;

  // Token info
  tokenId?: string;
  tokenType?: "PERMANENT" | "TEMPORARY";
  tokenCreatedAt?: string;
  tokenExpiresAt?: string;
  verificationCount?: number;

  // Parcel info
  parcelId?: string;
  trackingRef?: string;
  parcelStatus?: string;
  serviceType?: string;
  weight?: number;
  dimensions?: string;
  fragile?: boolean;
  clientName?: string;
  originAgency?: string;
  destinationAgency?: string;

  // Pickup info (for temporary QR)
  pickupId?: string;
  pickupStatus?: string;
  requestedDate?: string;
  timeWindow?: string;

  // Security info
  verifiedAt?: string;
  tamperingDetected?: boolean;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
}

export type VerificationStatus =
  | "VALID"
  | "TOKEN_NOT_FOUND"
  | "TOKEN_REVOKED"
  | "TOKEN_EXPIRED"
  | "SIGNATURE_INVALID"
  | "PARCEL_NOT_FOUND"
  | "PICKUP_NOT_FOUND"
  | "RATE_LIMIT_EXCEEDED"
  | "VERIFICATION_ERROR";

export interface SecureQrPayload {
  version: number;
  type: "P" | "T"; // Permanent or Temporary
  token: string;
  sig: string;
  ref: string;
  ts: number;
}

// ==================== API FUNCTIONS ====================

/**
 * Verify a QR code by its token (anti-forgery check)
 */
export async function verifyQrCode(
  request: QrVerificationRequest,
): Promise<QrVerificationResponse> {
  return httpClient.post<QrVerificationResponse>(
    "/api/qr/verify",
    request,
  );
}

/**
 * Verify a QR code from scanned content
 * @param qrContent The raw content scanned from the QR code
 */
export async function verifyQrCodeContent(
  qrContent: string,
): Promise<QrVerificationResponse> {
  const encodedContent = encodeURIComponent(qrContent);
  return httpClient.get<QrVerificationResponse>(
    `/api/qr/verify/${encodedContent}`,
  );
}

/**
 * Generate a new secure QR code for a parcel (invalidates previous QR codes)
 */
export async function regenerateSecureQrCode(
  parcelId: string,
): Promise<SecureQrPayload> {
  return httpClient.post<SecureQrPayload>(
    `/api/qr/secure/${parcelId}`,
  );
}

/**
 * Revoke a specific QR code
 */
export async function revokeQrCode(
  token: string,
  reason?: string,
): Promise<void> {
  const reasonParam = encodeURIComponent(reason || "Manual revocation");
  await httpClient.delete(`/api/qr/revoke/${token}?reason=${reasonParam}`);
}

/**
 * Revoke all QR codes for a parcel
 */
export async function revokeAllQrCodesForParcel(
  parcelId: string,
  reason?: string,
): Promise<void> {
  const reasonParam = encodeURIComponent(reason || "Bulk revocation");
  await httpClient.delete(`/api/qr/revoke/parcel/${parcelId}?reason=${reasonParam}`);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Parse a secure QR payload from its compact string format
 * Format: V1|P|TOKEN|REF|TS|SIG
 */
export function parseSecureQrPayload(compact: string): SecureQrPayload | null {
  try {
    if (!compact || !compact.startsWith("V")) {
      return null;
    }

    const parts = compact.split("|");
    if (parts.length !== 6) {
      return null;
    }

    return {
      version: parseInt(parts[0].substring(1), 10),
      type: parts[1] as "P" | "T",
      token: parts[2],
      ref: parts[3],
      ts: parseInt(parts[4], 10),
      sig: parts[5],
    };
  } catch {
    return null;
  }
}

/**
 * Check if the QR content is a secure SmartCAMPOST QR code
 */
export function isSecureQrCode(content: string): boolean {
  return content?.startsWith("V1|") || content?.startsWith("V2|");
}

/**
 * Check if the verification response indicates a potential forgery
 */
export function isForgeryAttempt(response: QrVerificationResponse): boolean {
  return (
    response.tamperingDetected ||
    response.status === "SIGNATURE_INVALID" ||
    response.status === "TOKEN_NOT_FOUND"
  );
}

/**
 * Get a user-friendly message for the verification status
 */
export function getVerificationStatusMessage(
  status: VerificationStatus,
): string {
  const messages: Record<VerificationStatus, string> = {
    VALID: "QR code vérifié avec succès",
    TOKEN_NOT_FOUND: "QR code non reconnu - possible falsification",
    TOKEN_REVOKED: "Ce QR code a été révoqué",
    TOKEN_EXPIRED: "Ce QR code temporaire a expiré",
    SIGNATURE_INVALID: "Signature invalide - QR code falsifié",
    PARCEL_NOT_FOUND: "Colis non trouvé",
    PICKUP_NOT_FOUND: "Demande de collecte non trouvée",
    RATE_LIMIT_EXCEEDED: "Trop de tentatives de vérification",
    VERIFICATION_ERROR: "Erreur lors de la vérification",
  };
  return messages[status] || "Statut inconnu";
}

/**
 * Get the risk level color for UI display
 */
export function getRiskLevelColor(
  riskLevel?: "LOW" | "MEDIUM" | "HIGH",
): string {
  switch (riskLevel) {
    case "LOW":
      return "green";
    case "MEDIUM":
      return "yellow";
    case "HIGH":
      return "red";
    default:
      return "gray";
  }
}
