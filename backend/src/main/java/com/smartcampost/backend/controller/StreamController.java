package com.smartcampost.backend.controller;

import com.smartcampost.backend.security.ParcelAuthorizationService;
import com.smartcampost.backend.sse.SseEmitters;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stream")
public class StreamController {

    private final SseEmitters sseEmitters;
    private final ParcelAuthorizationService parcelAuthorizationService;

    public StreamController(SseEmitters sseEmitters, ParcelAuthorizationService parcelAuthorizationService) {
        this.sseEmitters = sseEmitters;
        this.parcelAuthorizationService = parcelAuthorizationService;
    }

    @GetMapping(value = "/scans", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('CLIENT','AGENT','COURIER','STAFF','ADMIN')")
    public SseEmitter streamScans() {
        return sseEmitters.createScanEmitter();
    }

    @GetMapping(value = "/ai", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('CLIENT','AGENT','COURIER','STAFF','ADMIN')")
    public SseEmitter streamAi() {
        return sseEmitters.createAiEmitter(connectionAuthorities());
    }

    private Set<String> connectionAuthorities() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return Set.of();
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
    }

    @GetMapping(value = "/tracking/{trackingRef}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamTracking(@PathVariable String trackingRef) {
        return sseEmitters.createTrackingEmitter(trackingRef);
    }

    @GetMapping(value = "/parcels/{parcelId}/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter streamParcelMessages(@PathVariable UUID parcelId, Authentication authentication) {
        parcelAuthorizationService.requireReadableParcel(parcelId, authentication);
        return sseEmitters.createParcelMessageEmitter(parcelId);
    }
}
