package com.smartcampost.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger UI configuration.
 * Swagger UI available at: /swagger-ui.html
 * OpenAPI JSON spec at: /v3/api-docs
 */
@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "SmartCAMPOST API",
        version = "1.0.0",
        description = "REST API for SmartCAMPOST — Cameroon Postal Logistics Platform. " +
                      "Authenticate via POST /api/auth/login to obtain a Bearer token, then " +
                      "click 'Authorize' and paste it below.",
        contact = @Contact(
            name = "SmartCAMPOST Team",
            email = "admin@smartcampost.cm"
        )
    ),
    servers = {
        @Server(url = "http://localhost:8082", description = "Local development"),
        @Server(url = "https://smartcampost-backend.onrender.com", description = "Production (Render)")
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    description = "JWT token obtained from POST /api/auth/login. Paste only the token value (without 'Bearer ')."
)
public class OpenApiConfig {
    // Configuration is fully annotation-driven.
    // All controllers are auto-discovered by springdoc.
}
