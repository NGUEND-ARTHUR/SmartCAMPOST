package com.smartcampost.backend.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Account lockout service to prevent brute force attacks.
 * Tracks failed login attempts and locks accounts temporarily.
 */
@Service
@Slf4j
public class AccountLockoutService {

    @Value("${smartcampost.security.lockout.max-attempts:5}")
    private int maxAttempts;

    @Value("${smartcampost.security.lockout.duration-minutes:15}")
    private int lockoutDurationMinutes;

    @Value("${smartcampost.security.lockout.enabled:true}")
    private boolean enabled;

    // In production, use Redis or database for distributed systems
    private final Map<String, LockoutInfo> lockoutMap = new ConcurrentHashMap<>();

    /**
     * Record a failed login attempt for a phone number.
     * @param phone The phone number that failed authentication
     * @return true if the account is now locked
     */
    public boolean recordFailedAttempt(String phone) {
        if (!enabled || phone == null) {
            return false;
        }

        String key = normalizePhone(phone);
        LockoutInfo info = lockoutMap.computeIfAbsent(key, k -> new LockoutInfo());
        
        // Check if already locked
        if (info.isLocked()) {
            return true;
        }

        int attempts = info.incrementAttempts();
        log.warn("Failed login attempt {} for phone: {}", attempts, maskPhone(phone));

        if (attempts >= maxAttempts) {
            info.lock(lockoutDurationMinutes);
            log.warn("Account locked for phone: {} after {} failed attempts", 
                     maskPhone(phone), attempts);
            return true;
        }

        return false;
    }

    /**
     * Check if an account is currently locked.
     * @param phone The phone number to check
     * @return true if the account is locked
     */
    public boolean isLocked(String phone) {
        if (!enabled || phone == null) {
            return false;
        }

        String key = normalizePhone(phone);
        LockoutInfo info = lockoutMap.get(key);
        
        if (info == null) {
            return false;
        }

        if (info.isLocked()) {
            return true;
        }

        // Clean up expired lockouts
        if (info.shouldReset()) {
            lockoutMap.remove(key);
        }

        return false;
    }

    /**
     * Clear lockout after successful login.
     * @param phone The phone number to clear
     */
    public void clearLockout(String phone) {
        if (phone == null) {
            return;
        }
        String key = normalizePhone(phone);
        lockoutMap.remove(key);
        log.info("Lockout cleared for phone: {}", maskPhone(phone));
    }

    /**
     * Get remaining lockout time in seconds.
     * @param phone The phone number to check
     * @return remaining seconds, or 0 if not locked
     */
    public long getRemainingLockoutSeconds(String phone) {
        if (!enabled || phone == null) {
            return 0;
        }

        String key = normalizePhone(phone);
        LockoutInfo info = lockoutMap.get(key);
        
        if (info == null || !info.isLocked()) {
            return 0;
        }

        return info.getRemainingSeconds();
    }

    private String normalizePhone(String phone) {
        return phone.replaceAll("[^0-9+]", "").toLowerCase();
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() <= 4) {
            return "****";
        }
        return "****" + phone.substring(phone.length() - 4);
    }

    /**
     * Internal class to track lockout state.
     */
    private static class LockoutInfo {
        private final AtomicInteger failedAttempts = new AtomicInteger(0);
        private final AtomicReference<Instant> lockedUntil = new AtomicReference<>(null);
        private final AtomicReference<Instant> firstAttempt = new AtomicReference<>(Instant.now());

        int incrementAttempts() {
            return failedAttempts.incrementAndGet();
        }

        void lock(int minutes) {
            lockedUntil.set(Instant.now().plusSeconds(minutes * 60L));
        }

        boolean isLocked() {
            Instant until = lockedUntil.get();
            if (until == null) {
                return false;
            }
            if (Instant.now().isAfter(until)) {
                // Lockout expired, reset
                lockedUntil.set(null);
                failedAttempts.set(0);
                firstAttempt.set(Instant.now());
                return false;
            }
            return true;
        }

        boolean shouldReset() {
            // Reset attempts after 1 hour of no activity
            Instant first = firstAttempt.get();
            return first != null && Instant.now().isAfter(first.plusSeconds(3600));
        }

        long getRemainingSeconds() {
            Instant until = lockedUntil.get();
            if (until == null) {
                return 0;
            }
            long remaining = until.getEpochSecond() - Instant.now().getEpochSecond();
            return Math.max(0, remaining);
        }
    }
}
