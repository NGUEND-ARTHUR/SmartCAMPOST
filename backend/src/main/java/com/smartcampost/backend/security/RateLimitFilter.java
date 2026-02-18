package com.smartcampost.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Rate limiting filter to prevent brute force attacks and API abuse.
 * Uses a simple token bucket algorithm per IP address.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${smartcampost.security.rate-limit.requests-per-minute:60}")
    private int requestsPerMinute;

    @Value("${smartcampost.security.rate-limit.auth-requests-per-minute:10}")
    private int authRequestsPerMinute;

    @Value("${smartcampost.security.rate-limit.enabled:true}")
    private boolean enabled;

    // Simple in-memory rate limiting (use Redis in production for multi-instance)
    private final Map<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();

    // Sensitive endpoints that need stricter rate limiting
    private static final String[] AUTH_ENDPOINTS = {
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/send-otp",
        "/api/auth/verify-otp",
        "/api/auth/password/reset"
    };

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        // Determine rate limit based on endpoint type
        int limit = isAuthEndpoint(path) ? authRequestsPerMinute : requestsPerMinute;
        String bucketKey = clientIp + ":" + (isAuthEndpoint(path) ? "auth" : "general");

        RateLimitBucket bucket = buckets.computeIfAbsent(bucketKey, 
            k -> new RateLimitBucket(limit));

        if (!bucket.tryConsume()) {
            log.warn("Rate limit exceeded for IP: {} on path: {}", maskIp(clientIp), path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"error\":\"Too many requests\",\"code\":\"RATE_LIMIT_EXCEEDED\",\"message\":\"Please try again later\"}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAuthEndpoint(String path) {
        for (String endpoint : AUTH_ENDPOINTS) {
            if (path.startsWith(endpoint)) {
                return true;
            }
        }
        return false;
    }

    private String getClientIp(HttpServletRequest request) {
        // Check for proxy headers
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private String maskIp(String ip) {
        if (ip == null) return "unknown";
        int lastDot = ip.lastIndexOf('.');
        if (lastDot > 0) {
            return ip.substring(0, lastDot) + ".***";
        }
        return "***";
    }

    /**
     * Simple token bucket implementation for rate limiting.
     */
    private static class RateLimitBucket {
        private final int maxTokens;
        private final AtomicInteger tokens;
        private final AtomicLong lastRefillTime;
        private static final long REFILL_INTERVAL_MS = 60_000; // 1 minute

        RateLimitBucket(int maxTokens) {
            this.maxTokens = maxTokens;
            this.tokens = new AtomicInteger(maxTokens);
            this.lastRefillTime = new AtomicLong(System.currentTimeMillis());
        }

        boolean tryConsume() {
            refillIfNeeded();
            return tokens.getAndUpdate(t -> t > 0 ? t - 1 : 0) > 0;
        }

        private void refillIfNeeded() {
            long now = System.currentTimeMillis();
            long lastRefill = lastRefillTime.get();
            if (now - lastRefill >= REFILL_INTERVAL_MS) {
                if (lastRefillTime.compareAndSet(lastRefill, now)) {
                    tokens.set(maxTokens);
                }
            }
        }
    }
}
