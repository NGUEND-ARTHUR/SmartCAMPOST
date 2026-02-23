package com.smartcampost.backend.service.ai.agents;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

@Service
@Slf4j
public class DataOptimizationAgent {

    private final ConcurrentHashMap<String, Cache<String, Object>> caches = new ConcurrentHashMap<>();

    public <T> T getIfPresent(String cacheName, String key, Duration ttl, Class<T> type) {
        Objects.requireNonNull(cacheName, "cacheName is required");
        Objects.requireNonNull(key, "key is required");
        Objects.requireNonNull(ttl, "ttl is required");
        Objects.requireNonNull(type, "type is required");

        Cache<String, Object> cache = getCache(cacheName, ttl);
        Object value = cache.getIfPresent(key);
        if (value == null) return null;
        try {
            return type.cast(value);
        } catch (ClassCastException ex) {
            log.warn("Cache type mismatch for cacheName={}, key={}, expectedType={}, actualType={}",
                    cacheName, key, type.getName(), value.getClass().getName());
            cache.invalidate(key);
            return null;
        }
    }

    public <T> void put(String cacheName, String key, Duration ttl, T value) {
        Objects.requireNonNull(cacheName, "cacheName is required");
        Objects.requireNonNull(key, "key is required");
        Objects.requireNonNull(ttl, "ttl is required");
        Objects.requireNonNull(value, "value is required");

        Cache<String, Object> cache = getCache(cacheName, ttl);
        cache.put(key, value);
    }

    public <T> T getOrCompute(String cacheName, String key, Duration ttl, Class<T> type, Supplier<T> loader) {
        Objects.requireNonNull(cacheName, "cacheName is required");
        Objects.requireNonNull(key, "key is required");
        Objects.requireNonNull(ttl, "ttl is required");
        Objects.requireNonNull(type, "type is required");
        Objects.requireNonNull(loader, "loader is required");

        Cache<String, Object> cache = getCache(cacheName, ttl);

        Object value = cache.get(key, ignored -> loader.get());
        if (value == null) {
            return null;
        }
        try {
            return type.cast(value);
        } catch (ClassCastException ex) {
            log.warn("Cache type mismatch for cacheName={}, key={}, expectedType={}, actualType={}",
                    cacheName, key, type.getName(), value.getClass().getName());
            cache.invalidate(key);
            T loaded = loader.get();
            cache.put(key, loaded);
            return loaded;
        }
    }

    private Cache<String, Object> getCache(String cacheName, Duration ttl) {
        // Include TTL in the cache id so callers can safely use different TTLS under same logical name.
        String cacheId = cacheName + ":" + ttl.toSeconds();
        return caches.computeIfAbsent(cacheId, ignored ->
                Caffeine.newBuilder()
                        .expireAfterWrite(ttl)
                        .maximumSize(5000)
                        .build()
        );
    }
}
