package com.smartcampost.backend.automation;

import com.smartcampost.backend.model.enums.ParcelStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Manual override endpoints for all automations.
 * Every autonomous automation has a corresponding manual trigger here.
 * This ensures the DUAL MODE rule: automation enhances but never replaces manual control.
 */
@RestController
@RequestMapping("/api/automation")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public class AutomationManualController {

    private final DelayedParcelDetectionScheduler delayedParcelScheduler;
    private final CourierAvailabilityScheduler courierAvailabilityScheduler;
    private final EtaRecalculationScheduler etaRecalculationScheduler;
    private final SmartNotificationEngine smartNotificationEngine;
    private final SmartParcelAutoAssignment smartParcelAutoAssignment;
    private final AgencyZoneAutoRouter agencyZoneAutoRouter;
    private final GeofenceAutoProgressionService geofenceService;

    // ==================== Automation C: Delayed Parcel Detection ====================

    @PostMapping("/delayed-parcels/detect")
    public ResponseEntity<Map<String, Object>> triggerDelayedParcelDetection() {
        int count = delayedParcelScheduler.detectAndEscalateDelayedParcels();
        return ResponseEntity.ok(Map.of("detectedDelayed", count, "mode", "MANUAL"));
    }

    @PostMapping("/delayed-parcels/{parcelId}/mark-delayed")
    public ResponseEntity<Map<String, String>> markParcelDelayed(@PathVariable UUID parcelId) {
        delayedParcelScheduler.manualMarkDelayed(parcelId);
        return ResponseEntity.ok(Map.of("status", "DELAYED", "parcelId", parcelId.toString(), "mode", "MANUAL"));
    }

    // ==================== Automation D: Courier Availability ====================

    @PostMapping("/courier-availability/detect")
    public ResponseEntity<Map<String, Object>> triggerCourierAvailabilityCheck() {
        return ResponseEntity.ok(courierAvailabilityScheduler.detectUnavailableCouriers());
    }

    @PostMapping("/courier-availability/{courierId}/set")
    public ResponseEntity<Map<String, String>> setCourierAvailability(
            @PathVariable String courierId,
            @RequestParam boolean available
    ) {
        courierAvailabilityScheduler.manualSetAvailability(courierId, available);
        return ResponseEntity.ok(Map.of(
                "courierId", courierId,
                "available", String.valueOf(available),
                "mode", "MANUAL"
        ));
    }

    @GetMapping("/courier-availability/unavailable")
    public ResponseEntity<?> getUnavailableCouriers() {
        return ResponseEntity.ok(Map.of("unavailableCouriers", courierAvailabilityScheduler.getUnavailableCouriers()));
    }

    // ==================== Automation F: Smart Notification Engine ====================

    @PostMapping("/notifications/trigger/{parcelId}")
    public ResponseEntity<Map<String, String>> triggerNotification(
            @PathVariable UUID parcelId,
            @RequestParam String status
    ) {
        ParcelStatus parcelStatus = ParcelStatus.valueOf(status.toUpperCase());
        smartNotificationEngine.manualTrigger(parcelId, parcelStatus);
        return ResponseEntity.ok(Map.of(
                "parcelId", parcelId.toString(),
                "status", parcelStatus.name(),
                "mode", "MANUAL"
        ));
    }

    // ==================== Automation G: ETA Recalculation ====================

    @PostMapping("/eta/recalculate-all")
    public ResponseEntity<Map<String, Object>> triggerEtaRecalculation() {
        int updated = etaRecalculationScheduler.recalculateAllActiveEtas();
        return ResponseEntity.ok(Map.of("updatedParcels", updated, "mode", "MANUAL"));
    }

    @PostMapping("/eta/recalculate/{parcelId}")
    public ResponseEntity<Map<String, String>> recalculateParcelEta(@PathVariable UUID parcelId) {
        etaRecalculationScheduler.manualRecalculateEta(parcelId);
        return ResponseEntity.ok(Map.of("parcelId", parcelId.toString(), "status", "RECALCULATED", "mode", "MANUAL"));
    }

    // ==================== Automation A: Smart Auto-Assignment ====================

    @GetMapping("/auto-assign/{parcelId}/scores")
    public ResponseEntity<?> getCourierScores(@PathVariable UUID parcelId) {
        var scores = smartParcelAutoAssignment.manualGetScores(parcelId);
        return ResponseEntity.ok(Map.of("parcelId", parcelId.toString(), "courierScores", scores, "mode", "MANUAL"));
    }

    // ==================== Automation B: Geofence Auto-Progression ====================

    @PostMapping("/geofence/check-all")
    public ResponseEntity<Map<String, Integer>> triggerGeofenceCheck() {
        return ResponseEntity.ok(geofenceService.checkAllActiveParcels());
    }

    @PostMapping("/geofence/check/{parcelId}")
    public ResponseEntity<Map<String, String>> checkParcelGeofence(@PathVariable UUID parcelId) {
        String result = geofenceService.checkSingleParcel(parcelId);
        return ResponseEntity.ok(Map.of("parcelId", parcelId.toString(), "result", result, "mode", "MANUAL"));
    }

    // ==================== Automation E: Agency Zone Auto-Routing ====================

    @PostMapping("/zone-route/{parcelId}/auto")
    public ResponseEntity<Map<String, String>> autoRouteParcel(@PathVariable UUID parcelId) {
        var agency = agencyZoneAutoRouter.manualAutoRoute(parcelId);
        return ResponseEntity.ok(Map.of(
                "parcelId", parcelId.toString(),
                "assignedAgency", agency != null ? agency.getAgencyName() : "NONE",
                "mode", "MANUAL_AUTO_ROUTE"
        ));
    }

    @PostMapping("/zone-route/{parcelId}/assign/{agencyId}")
    public ResponseEntity<Map<String, String>> manualRouteParcel(@PathVariable UUID parcelId, @PathVariable UUID agencyId) {
        agencyZoneAutoRouter.manualRoute(parcelId, agencyId);
        return ResponseEntity.ok(Map.of("parcelId", parcelId.toString(), "agencyId", agencyId.toString(), "mode", "MANUAL"));
    }

    // ==================== Status Overview ====================

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAutomationStatus() {
        return ResponseEntity.ok(Map.of(
                "automations", Map.ofEntries(
                        Map.entry("A_smartAutoAssignment", "ACTIVE — event-driven on ACCEPTED status"),
                        Map.entry("B_geofenceAutoProgression", "ACTIVE — scheduled every 2 minutes"),
                        Map.entry("C_delayedParcelDetection", "ACTIVE — scheduled every 15 minutes"),
                        Map.entry("D_courierAvailability", "ACTIVE — scheduled every 5 minutes"),
                        Map.entry("E_agencyZoneRouting", "ACTIVE — event-driven on CREATED status"),
                        Map.entry("F_smartNotificationEngine", "ACTIVE — event-driven on status changes"),
                        Map.entry("G_etaRecalculation", "ACTIVE — scheduled every 5 minutes")
                ),
                "unavailableCouriers", courierAvailabilityScheduler.getUnavailableCouriers().size()
        ));
    }
}
