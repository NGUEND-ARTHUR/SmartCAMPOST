package com.smartcampost.backend.controller;

import com.smartcampost.backend.service.QRService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Objects;

@RestController
@RequestMapping("/api/parcels")
public class QRController {

    private final QRService qrService;

    public QRController(QRService qrService) { this.qrService = qrService; }

    @GetMapping("/{parcelId}/qr")
    @PreAuthorize("hasAnyRole('CLIENT','AGENT','COURIER','STAFF','ADMIN')")
    public ResponseEntity<byte[]> getQr(@PathVariable String parcelId) throws IOException {
        java.util.UUID pid;
        try { pid = java.util.UUID.fromString(parcelId); } catch (Exception e) { return ResponseEntity.badRequest().build(); }
        pid = Objects.requireNonNull(pid, "parcelId is required");
        byte[] png = Objects.requireNonNull(qrService.generateQrPngForParcel(pid), "generated png is null");
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=qr-" + parcelId + ".png")
            .contentType(Objects.requireNonNull(MediaType.IMAGE_PNG))
            .body(png);
    }

    @GetMapping("/{parcelId}/qr/print")
    @PreAuthorize("hasAnyRole('CLIENT','AGENT','COURIER','STAFF','ADMIN')")
    public ResponseEntity<Resource> getQrPrint(@PathVariable String parcelId) throws IOException {
        java.util.UUID pid;
        try { pid = java.util.UUID.fromString(parcelId); } catch (Exception e) { return ResponseEntity.badRequest().build(); }
        pid = Objects.requireNonNull(pid, "parcelId is required");
        Resource pdf = Objects.requireNonNull(qrService.generateQrPdfForParcel(pid), "generated pdf is null");
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=qr-" + parcelId + ".pdf")
            .contentType(Objects.requireNonNull(MediaType.APPLICATION_PDF))
            .body(pdf);
    }
}
