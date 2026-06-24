package com.smartcampost.backend.controller;

import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.ParcelDelegate;
import com.smartcampost.backend.repository.ParcelDelegateRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

/**
 * Delegate/proxy pickup authorization.
 *
 * Flow:
 * 1. Client authorizes a third party: POST /api/parcels/{id}/delegates
 *    → system generates a 4-digit PIN and sends SMS to the delegate
 * 2. At pickup, courier/agent verifies: POST /api/parcels/{id}/delegates/verify
 *    → delegate provides PIN or phone number → system confirms identity
 * 3. Delivery proceeds with delegate info recorded as proof
 */
@RestController
@RequestMapping("/api/parcels/{parcelId}/delegates")
@RequiredArgsConstructor
@Slf4j
public class ParcelDelegateController {

    private final ParcelDelegateRepository delegateRepository;
    private final ParcelRepository parcelRepository;
    private final NotificationService notificationService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> authorizeDelegate(
            @PathVariable UUID parcelId,
            @RequestBody Map<String, String> body
    ) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        String name = Objects.requireNonNull(body.get("delegateName"), "delegateName is required");
        String phone = Objects.requireNonNull(body.get("delegatePhone"), "delegatePhone is required");

        ParcelDelegate delegate = ParcelDelegate.builder()
                .parcel(parcel)
                .delegateName(name)
                .delegatePhone(phone)
                .delegateIdNumber(body.get("delegateIdNumber"))
                .relationship(body.get("relationship"))
                .build();
        delegateRepository.save(delegate);

        try {
            notificationService.sendDeliveryOtp(
                    phone,
                    delegate.getPinCode(),
                    parcel.getTrackingRef()
            );
        } catch (Exception e) {
            log.warn("Failed to send delegate PIN SMS: {}", e.getMessage());
        }

        log.info("Delegate authorized for parcel {}: {} ({})", parcel.getTrackingRef(), name, phone);

        return ResponseEntity.ok(Map.of(
                "delegateId", delegate.getId().toString(),
                "delegateName", name,
                "pinCode", delegate.getPinCode(),
                "expiresAt", delegate.getExpiresAt().toString(),
                "message", "Delegate authorized. PIN sent via SMS to " + phone
        ));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> listDelegates(@PathVariable UUID parcelId) {
        List<ParcelDelegate> delegates = delegateRepository.findByParcelIdAndUsedFalse(parcelId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ParcelDelegate d : delegates) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", d.getId().toString());
            map.put("delegateName", d.getDelegateName());
            map.put("delegatePhone", d.getDelegatePhone());
            map.put("relationship", d.getRelationship());
            map.put("used", d.isUsed());
            map.put("expiresAt", d.getExpiresAt() != null ? d.getExpiresAt().toString() : null);
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('COURIER','AGENT','STAFF','ADMIN')")
    public ResponseEntity<Map<String, Object>> verifyDelegate(
            @PathVariable UUID parcelId,
            @RequestBody Map<String, String> body
    ) {
        String pin = body.get("pinCode");
        String phone = body.get("delegatePhone");

        Optional<ParcelDelegate> found;
        if (pin != null && !pin.isBlank()) {
            found = delegateRepository.findByParcelIdAndPinCode(parcelId, pin.trim());
        } else if (phone != null && !phone.isBlank()) {
            found = delegateRepository.findByParcelIdAndDelegatePhone(parcelId, phone.trim());
        } else {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "error", "Provide pinCode or delegatePhone"));
        }

        if (found.isEmpty()) {
            return ResponseEntity.ok(Map.of("verified", false, "error", "No matching delegate found"));
        }

        ParcelDelegate delegate = found.get();

        if (delegate.isUsed()) {
            return ResponseEntity.ok(Map.of("verified", false, "error", "This delegate authorization has already been used"));
        }

        if (delegate.getExpiresAt() != null && delegate.getExpiresAt().isBefore(Instant.now())) {
            return ResponseEntity.ok(Map.of("verified", false, "error", "Delegate authorization has expired"));
        }

        delegate.setUsed(true);
        delegate.setUsedAt(Instant.now());
        delegateRepository.save(delegate);

        log.info("Delegate verified for parcel {}: {} (PIN: {})", parcelId, delegate.getDelegateName(), delegate.getPinCode());

        return ResponseEntity.ok(Map.of(
                "verified", true,
                "delegateName", delegate.getDelegateName(),
                "delegatePhone", delegate.getDelegatePhone(),
                "relationship", delegate.getRelationship() != null ? delegate.getRelationship() : "",
                "delegateIdNumber", delegate.getDelegateIdNumber() != null ? delegate.getDelegateIdNumber() : ""
        ));
    }
}
