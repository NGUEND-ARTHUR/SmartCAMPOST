package com.smartcampost.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for tracking-by-QR.
 * Uses POST so raw scanned QR content (JSON or secure payload) can be sent safely.
 */
public class TrackingQrRequest {

    @NotBlank(message = "code is required")
    public String code;
}
