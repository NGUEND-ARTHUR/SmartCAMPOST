package com.smartcampost.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Security headers filter implementing OWASP security header recommendations.
 * Equivalent to Helmet.js for Express.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Prevent MIME type sniffing
        response.setHeader("X-Content-Type-Options", "nosniff");

        // XSS Protection (legacy browsers)
        response.setHeader("X-XSS-Protection", "1; mode=block");

        // Prevent clickjacking
        response.setHeader("X-Frame-Options", "DENY");

        // Referrer policy - don't leak URLs
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Content Security Policy - restrict resource loading
        response.setHeader("Content-Security-Policy", 
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self'; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none'; " +
            "form-action 'self';"
        );

        // Permissions policy - disable unnecessary browser features
        response.setHeader("Permissions-Policy", 
            "camera=(), microphone=(), geolocation=(self), payment=()"
        );

        // Strict Transport Security (HTTPS only)
        // Only set if request is HTTPS or behind a trusted proxy
        if (request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"))) {
            response.setHeader("Strict-Transport-Security", 
                "max-age=31536000; includeSubDomains; preload");
        }

        // Cache control for API responses - prevent caching sensitive data
        if (request.getRequestURI().startsWith("/api/")) {
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Expires", "0");
        }

        filterChain.doFilter(request, response);
    }
}
