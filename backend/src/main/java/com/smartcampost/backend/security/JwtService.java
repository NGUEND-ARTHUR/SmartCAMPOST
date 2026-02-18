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

    public JwtService(
            @Value("${smartcampost.jwt.secret:}") String jwtSecret,
            @Value("${smartcampost.jwt.expiration-hours:8}") int expirationHours) {
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
    }

    public String generateToken(UserAccount user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("phone", user.getPhone());
        claims.put("role", user.getRole().name());
        claims.put("entityId", user.getEntityId().toString());

        long now = System.currentTimeMillis();
        long exp = now + tokenValidityMs;

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getId().toString())
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(exp))
                .signWith(key) // ✅ modern style, algorithm inferred
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
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
}
