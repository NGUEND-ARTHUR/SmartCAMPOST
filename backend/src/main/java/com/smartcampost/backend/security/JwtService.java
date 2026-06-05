package com.smartcampost.backend.security;

import com.smartcampost.backend.model.UserAccount;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key;
    private final long tokenValidityMs;
    private final long refreshTokenValidityMs;

    public JwtService(
            @Value("${smartcampost.jwt.secret:}") String jwtSecret,
            @Value("${smartcampost.jwt.expiration-hours:8}") int expirationHours,
            @Value("${smartcampost.jwt.refresh-token-days:7}") int refreshTokenDays) {
        // SECURITY: JWT secret MUST be provided via environment variable in production
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                "JWT secret not configured! Set SMARTCAMPOST_JWT_SECRET environment variable.");
        }
        if (jwtSecret.length() < 32) {
            throw new IllegalStateException(
                "JWT secret must be at least 32 characters for security.");
        }
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.tokenValidityMs = expirationHours * 60L * 60L * 1000L;
        this.refreshTokenValidityMs = refreshTokenDays * 24L * 60L * 60L * 1000L;
    }

    /** Generate a short-lived access token (default 8h). */
    public String generateToken(UserAccount user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("phone", user.getPhone());
        claims.put("role", user.getRole().name());
        claims.put("entityId", user.getEntityId().toString());
        claims.put("type", "access");
        if (user.getEmail() != null) {
            claims.put("email", user.getEmail());
        }

        long now = System.currentTimeMillis();
        long exp = now + tokenValidityMs;

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getId().toString())
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(exp))
                .signWith(key)
                .compact();
    }

    /** Generate a long-lived refresh token (default 7 days). */
    public String generateRefreshToken(UserAccount user) {
        long now = System.currentTimeMillis();
        long exp = now + refreshTokenValidityMs;

        return Jwts.builder()
                .setClaims(Map.of("type", "refresh"))
                .setSubject(user.getId().toString())
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(exp))
                .signWith(key)
                .compact();
    }

    /** Validate an access token (rejects refresh tokens). */
    public boolean validateToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            // Reject refresh tokens used as access tokens
            return !"refresh".equals(claims.get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    /** Validate a refresh token specifically. */
    public boolean validateRefreshToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return "refresh".equals(claims.get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /** Extract userId (subject) from any token without role validation. */
    public String extractSubject(String token) {
        return extractClaims(token).getSubject();
    }

    /** Returns the access token validity in milliseconds. */
    public long getTokenValidityMs() {
        return tokenValidityMs;
    }
}
