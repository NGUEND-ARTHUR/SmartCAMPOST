package com.smartcampost.backend.sse;

import com.smartcampost.backend.model.ScanEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class SseEmitters {
    private static final Logger log = LoggerFactory.getLogger(SseEmitters.class);

    // /api/stream/scans subscribers only ever receive ScanEvent objects.
    private final List<SseEmitter> scanEmitters = new CopyOnWriteArrayList<>();

    // /api/stream/ai subscribers, keyed to the granted authorities they connected with so
    // role-sensitive event types (e.g. nationwide gps-update) can be withheld from roles that
    // have no business seeing them (a CLIENT can open this stream for AI chat, but must not
    // receive every courier's live position alongside it).
    private final ConcurrentHashMap<SseEmitter, Set<String>> aiEmitters = new ConcurrentHashMap<>();

    // Emitters scoped to a single public tracking reference. Kept separate from the scan/AI
    // pools so anonymous tracking-page visitors never receive scan events, AI agent payloads,
    // or GPS data belonging to other parcels/actors.
    private final ConcurrentHashMap<SseEmitter, String> trackingEmitters = new ConcurrentHashMap<>();

    // Prevent duplicate emits when the same ScanEvent is emitted from multiple code paths.
    private final ConcurrentHashMap<UUID, Instant> recentlyEmittedScanIds = new ConcurrentHashMap<>();
    private static final Duration DEDUP_WINDOW = Duration.ofSeconds(30);

    public SseEmitter createScanEmitter() {
        SseEmitter emitter = new SseEmitter(0L); // never timeout; client should disconnect
        scanEmitters.add(emitter);
        emitter.onCompletion(() -> scanEmitters.remove(emitter));
        emitter.onTimeout(() -> scanEmitters.remove(emitter));
        emitter.onError((e) -> scanEmitters.remove(emitter));
        return emitter;
    }

    public SseEmitter createAiEmitter(Set<String> grantedAuthorities) {
        SseEmitter emitter = new SseEmitter(0L); // never timeout; client should disconnect
        aiEmitters.put(emitter, grantedAuthorities == null ? Set.of() : Set.copyOf(grantedAuthorities));
        emitter.onCompletion(() -> aiEmitters.remove(emitter));
        emitter.onTimeout(() -> aiEmitters.remove(emitter));
        emitter.onError((e) -> aiEmitters.remove(emitter));
        return emitter;
    }

    public SseEmitter createTrackingEmitter(String trackingRef) {
        Objects.requireNonNull(trackingRef, "trackingRef is required");
        SseEmitter emitter = new SseEmitter(0L); // never timeout; client should disconnect
        trackingEmitters.put(emitter, trackingRef);
        emitter.onCompletion(() -> trackingEmitters.remove(emitter));
        emitter.onTimeout(() -> trackingEmitters.remove(emitter));
        emitter.onError((e) -> trackingEmitters.remove(emitter));
        return emitter;
    }

    /** Sends a payload only to public tracking-page clients subscribed to this exact trackingRef. */
    public void emitTrackingUpdate(String eventName, String trackingRef, Object payload) {
        Objects.requireNonNull(eventName, "eventName is required");
        Objects.requireNonNull(trackingRef, "trackingRef is required");
        Objects.requireNonNull(payload, "payload is required");

        trackingEmitters.forEach((emitter, ref) -> {
            if (!trackingRef.equalsIgnoreCase(ref)) return;
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload));
            } catch (IOException e) {
                log.warn("Removing dead tracking emitter after IO error", e);
                trackingEmitters.remove(emitter);
            }
        });
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

        for (SseEmitter emitter : scanEmitters) {
            try {
                SseEmitter.SseEventBuilder builder = SseEmitter.event()
                        .name("scan-event")
                        .data(event);
                emitter.send(builder);
            } catch (IOException e) {
                log.warn("Removing dead scan emitter after IO error", e);
                scanEmitters.remove(emitter);
            }
        }
    }

    public void emitAiEvent(String eventName, Object payload) {
        Objects.requireNonNull(eventName, "eventName is required");
        Objects.requireNonNull(payload, "payload is required");

        aiEmitters.forEach((emitter, roles) -> {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload));
            } catch (IOException e) {
                log.warn("Removing dead ai emitter after IO error", e);
                aiEmitters.remove(emitter);
            }
        });
    }

    /** Like {@link #emitAiEvent(String, Object)} but withheld from connections without one of the given authorities. */
    public void emitAiEventToRoles(String eventName, Object payload, Set<String> allowedAuthorities) {
        Objects.requireNonNull(eventName, "eventName is required");
        Objects.requireNonNull(payload, "payload is required");
        Objects.requireNonNull(allowedAuthorities, "allowedAuthorities is required");

        aiEmitters.forEach((emitter, roles) -> {
            if (Collections.disjoint(roles, allowedAuthorities)) return;
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload));
            } catch (IOException e) {
                log.warn("Removing dead ai emitter after IO error", e);
                aiEmitters.remove(emitter);
            }
        });
    }

    public void emitAiEvent(String eventName, String correlationId, Object payload) {
        Objects.requireNonNull(eventName, "eventName is required");
        Objects.requireNonNull(payload, "payload is required");

        LinkedHashMap<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("correlationId", correlationId);
        envelope.put("payload", payload);
        emitAiEvent(eventName, envelope);
    }
}
