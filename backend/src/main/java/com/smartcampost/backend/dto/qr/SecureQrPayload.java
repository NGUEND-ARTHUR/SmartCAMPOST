package com.smartcampost.backend.dto.qr;

import lombok.Builder;
import lombok.Data;

/**
 * DTO containing the secure QR code payload.
 * This is what gets encoded in the QR code image.
 */
@Data
@Builder
public class SecureQrPayload {
    
    /**
     * Version of the QR payload format (for backward compatibility)
     */
    private int version;

    /**
     * Type of QR code: "P" for permanent, "T" for temporary
     */
    private String type;

    /**
     * The unique verification token (32 chars, URL-safe Base64)
     */
    private String token;

    /**
     * HMAC-SHA256 signature of the payload (truncated to 16 chars)
     */
    private String sig;

    /**
     * Tracking reference (for display and quick lookup)
     */
    private String ref;

    /**
     * Timestamp when this QR was generated (Unix epoch seconds)
     */
    private long ts;

    /**
     * Convert to a compact string format for QR encoding
     * Format: V1|P|TOKEN|REF|TS|SIG
     */
    public String toCompactString() {
        return String.format("V%d|%s|%s|%s|%d|%s", 
                version, type, token, ref, ts, sig);
    }

    /**
     * Parse a compact string back to SecureQrPayload
     */
    public static SecureQrPayload fromCompactString(String compact) {
        if (compact == null || !compact.startsWith("V")) {
            throw new IllegalArgumentException("Invalid QR payload format");
        }

        String[] parts = compact.split("\\|");
        if (parts.length != 6) {
            throw new IllegalArgumentException("Invalid QR payload: expected 6 parts, got " + parts.length);
        }

        int version = Integer.parseInt(parts[0].substring(1));
        String type = parts[1];
        String token = parts[2];
        String ref = parts[3];
        long ts = Long.parseLong(parts[4]);
        String sig = parts[5];

        return SecureQrPayload.builder()
                .version(version)
                .type(type)
                .token(token)
                .ref(ref)
                .ts(ts)
                .sig(sig)
                .build();
    }

    /**
     * Generate the data string to be signed
     */
    public String getSignableData() {
        return String.format("V%d|%s|%s|%s|%d", version, type, token, ref, ts);
    }
}
