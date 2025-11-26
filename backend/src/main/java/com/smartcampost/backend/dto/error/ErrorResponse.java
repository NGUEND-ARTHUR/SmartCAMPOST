package com.smartcampost.backend.dto.error;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ErrorResponse {

    private Instant timestamp;  // moment de l’erreur
    private int status;         // code HTTP (ex: 400, 401, 429)
    private String error;       // "Bad Request", "Unauthorized", ...
    private String code;        // code fonctionnel (ex: "OTP_INVALID")
    private String message;     // message lisible pour le front
    private String path;        // URL appelée (ex: /api/auth/login)
}
