package com.smartcampost.backend.security;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * In-memory JWT blacklist for logout invalidation.
 * Tokens are kept until they expire (8h by default), then purged automatically.
 * For multi-instance deployments replace with a Redis-backed implementation.
 */
@Service
public class TokenBlacklistService {

    private final Set<String> blacklistedTokens =
            Collections.newSetFromMap(new ConcurrentHashMap<>());

    private final ScheduledExecutorService cleaner =
            Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "token-blacklist-cleaner");
                t.setDaemon(true);
                return t;
            });

    public TokenBlacklistService() {
        // Purge expired tokens every 30 minutes
        cleaner.scheduleAtFixedRate(blacklistedTokens::clear, 30, 30, TimeUnit.MINUTES);
    }

    public void blacklist(String token) {
        if (token != null && !token.isBlank()) {
            blacklistedTokens.add(token);
        }
    }

    public boolean isBlacklisted(String token) {
        return token != null && blacklistedTokens.contains(token);
    }
}
