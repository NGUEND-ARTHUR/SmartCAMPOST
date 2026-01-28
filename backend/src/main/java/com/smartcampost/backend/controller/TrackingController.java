package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.TrackingResponse;
import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.ScanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/track")
public class TrackingController {

    private final ParcelRepository parcelRepository;
    private final ScanService scanService;

    public TrackingController(ParcelRepository parcelRepository, ScanService scanService) {
        this.parcelRepository = parcelRepository;
        this.scanService = scanService;
    }

    @GetMapping("/parcel/{trackingNumber}")
    public ResponseEntity<TrackingResponse> trackByNumber(@PathVariable String trackingNumber) {
        return parcelRepository.findByTrackingRef(trackingNumber)
                .map(p -> {
                    TrackingResponse r = new TrackingResponse();
                    r.parcelId = p.getId() != null ? p.getId().toString() : null;
                    r.trackingNumber = p.getTrackingRef();
                    r.status = p.getStatus() != null ? p.getStatus().name() : null;
                    r.lastLocation = null;
                    r.updatedAt = null;
                    List<ScanEvent> events = scanService.getScanEventsForParcel(p.getId());
                    r.timeline = List.copyOf(events);
                    return ResponseEntity.ok(r);
                }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/qr/{code}")
    public ResponseEntity<TrackingResponse> trackByQr(@PathVariable String code) {
        // assume QR contains trackingNumber
        return trackByNumber(code);
    }
}
