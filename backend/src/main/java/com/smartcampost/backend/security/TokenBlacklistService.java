package com.smartcampost.backend.security;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

/**
 * In-memory JWT blacklist for logout invalidation.
 * Tokens are tracked with their expiry times and automatically purged when they expire.
 * For multi-instance deployments replace with a Redis-backed implementation.
 */
@Service
public class TokenBlacklistService {

    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    private final ScheduledExecutorService cleaner =
            Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "token-blacklist-cleaner");
                t.setDaemon(true);
                return t;
            });

    public TokenBlacklistService() {
        // Purge expired tokens every 15 minutes
        cleaner.scheduleAtFixedRate(this::purgeExpired, 15, 15, TimeUnit.MINUTES);
    }

    public void blacklist(String token) {
        if (token != null && !token.isBlank()) {
            long expiry = getExpirationFromToken(token);
            if (expiry > System.currentTimeMillis()) {
                blacklistedTokens.put(token, expiry);
            }
        }
    }

    public boolean isBlacklisted(String token) {
        if (token == null) return false;
        Long expiry = blacklistedTokens.get(token);
        if (expiry == null) return false;
        if (expiry < System.currentTimeMillis()) {
            blacklistedTokens.remove(token);
            return false;
        }
        return true;
    }

    private void purgeExpired() {
        long now = System.currentTimeMillis();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue() < now);
    }

    private long getExpirationFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length >= 2) {
                String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                Matcher matcher = Pattern.compile("\"exp\"\\s*:\\s*(\\d+)").matcher(payloadJson);
                if (matcher.find()) {
                    return Long.parseLong(matcher.group(1)) * 1000L; // convert to ms
                }
            }
        } catch (Exception e) {
            // ignore and fallback
        }
        // Fallback: 7 days for safety if unable to parse
        return System.currentTimeMillis() + TimeUnit.DAYS.toMillis(7);
    }
}
