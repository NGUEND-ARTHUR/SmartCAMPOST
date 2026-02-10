package com.smartcampost.backend.sse;

import com.smartcampost.backend.model.ScanEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class SseEmitters {
    private static final Logger log = LoggerFactory.getLogger(SseEmitters.class);
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    // Prevent duplicate emits when the same ScanEvent is emitted from multiple code paths.
    private final ConcurrentHashMap<UUID, Instant> recentlyEmittedScanIds = new ConcurrentHashMap<>();
    private static final Duration DEDUP_WINDOW = Duration.ofSeconds(30);

    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(0L); // never timeout; client should disconnect
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((e) -> emitters.remove(emitter));
        return emitter;
    }

    public void emitScan(ScanEvent event) {
        Objects.requireNonNull(event, "event is required");

        UUID id = event.getId();
        if (id != null) {
            Instant now = Instant.now();
            Instant previous = recentlyEmittedScanIds.putIfAbsent(id, now);
            if (previous != null && Duration.between(previous, now).compareTo(DEDUP_WINDOW) <= 0) {
                return; // already emitted recently
            }

            // opportunistic cleanup
            recentlyEmittedScanIds.entrySet().removeIf(e -> Duration.between(e.getValue(), now).compareTo(DEDUP_WINDOW.multipliedBy(4)) > 0);
        }

        for (SseEmitter emitter : emitters) {
            try {
                SseEmitter.SseEventBuilder builder = SseEmitter.event()
                        .name("scan-event")
                        .data(event);
                emitter.send(builder);
            } catch (IOException e) {
                log.warn("Removing dead emitter after IO error", e);
                emitters.remove(emitter);
            }
        }
    }
}
