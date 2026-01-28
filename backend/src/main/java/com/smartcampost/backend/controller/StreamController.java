package com.smartcampost.backend.controller;

import com.smartcampost.backend.sse.SseEmitters;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/stream")
public class StreamController {

    private final SseEmitters sseEmitters;

    public StreamController(SseEmitters sseEmitters) { this.sseEmitters = sseEmitters; }

    @GetMapping(value = "/scans", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('CLIENT','AGENT','COURIER','STAFF','ADMIN')")
    public SseEmitter streamScans() {
        return sseEmitters.createEmitter();
    }
}
