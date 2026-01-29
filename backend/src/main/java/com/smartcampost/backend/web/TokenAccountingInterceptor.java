package com.smartcampost.backend.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class TokenAccountingInterceptor implements HandlerInterceptor {

    // In-memory token counters per user; replace with persistent store in production
    private final Map<String, Long> tokenCounters = new ConcurrentHashMap<>();

    // simple token estimate: chars / 4
    private long estimateTokens(String content) {
        if (content == null) return 0;
        return Math.max(1, content.length() / 4);
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) {
        try {
            String user = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "anonymous";
            String body = (String) request.getAttribute("requestBodyContent");
            long tokens = estimateTokens(body);
            tokenCounters.merge(user, tokens, (existing, added) -> {
                long e = existing == null ? 0L : existing.longValue();
                long a = added == null ? 0L : added.longValue();
                return Long.valueOf(e + a);
            });
            long used = tokenCounters.getOrDefault(user, 0L);
            if (used > 100_000) {
                log.warn("User {} exceeded token budget: {} tokens", user, used);
            }
        } catch (Exception e) {
            log.debug("Token accounting skipped: {}", e.getMessage());
        }
        return true;
    }
}
