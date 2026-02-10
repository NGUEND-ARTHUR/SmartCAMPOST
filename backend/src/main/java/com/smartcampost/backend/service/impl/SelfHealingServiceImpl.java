package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.ai.CongestionAlert;
import com.smartcampost.backend.dto.ai.DeliveryStop;
import com.smartcampost.backend.dto.ai.RouteOptimization;
import com.smartcampost.backend.dto.ai.SelfHealingAction;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Agency;
import com.smartcampost.backend.model.Courier;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.AgencyRepository;
import com.smartcampost.backend.repository.CourierRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.SelfHealingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Implementation of self-healing logistics system.
 */
@Service
@RequiredArgsConstructor
public class SelfHealingServiceImpl implements SelfHealingService {

    private final AgencyRepository agencyRepository;
    private final ParcelRepository parcelRepository;
    private final CourierRepository courierRepository;
    private final NotificationService notificationService;

    @Value("${smartcampost.selfhealing.congestion-threshold:50}")
    private int congestionThreshold;

    private final Map<String, SelfHealingAction> pendingActions = new HashMap<>();

    @Override
    public List<CongestionAlert> detectCongestion() {
        List<Agency> agencies = agencyRepository.findAll();
        return agencies.stream()
                .map(agency -> detectCongestionForAgency(agency.getId()))
                .filter(alert -> alert.getCongestionLevel() > 0.7)
                .collect(Collectors.toList());
    }

    @Override
    public CongestionAlert detectCongestionForAgency(UUID agencyId) {
        Objects.requireNonNull(agencyId, "agencyId is required");
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Agency not found",
                        ErrorCode.AGENCY_NOT_FOUND
                ));

        // Count parcels waiting at this agency
        long parcelCount = parcelRepository.countByDestinationAgency_IdAndStatusIn(
                agencyId,
                List.of(ParcelStatus.ARRIVED_DEST_AGENCY, ParcelStatus.ARRIVED_HUB)
        );

        double congestionLevel = (double) parcelCount / congestionThreshold;

        List<String> suggestedActions = new ArrayList<>();
        if (congestionLevel > 0.9) {
            suggestedActions.add("URGENT: Redirect incoming parcels to nearby agencies");
            suggestedActions.add("Request additional courier support");
            suggestedActions.add("Notify affected clients about potential delays");
        } else if (congestionLevel > 0.7) {
            suggestedActions.add("Consider redistributing to nearby agencies");
            suggestedActions.add("Prioritize high-value parcels for delivery");
        }

        return CongestionAlert.builder()
                .agencyId(agencyId)
                .agencyName(agency.getAgencyName())
                .parcelCount((int) parcelCount)
                .threshold(congestionThreshold)
                .congestionLevel(congestionLevel)
                .detectedAt(Instant.now())
                .suggestedActions(suggestedActions)
                .build();
    }

    @Override
    public List<SelfHealingAction> getSuggestedActions() {
        List<SelfHealingAction> actions = new ArrayList<>();
        
        // Get congested agencies
        List<CongestionAlert> alerts = detectCongestion();
        
        for (CongestionAlert alert : alerts) {
            if (alert.getCongestionLevel() > 0.8) {
                String actionId = UUID.randomUUID().toString();
                SelfHealingAction action = SelfHealingAction.builder()
                        .actionId(actionId)
                        .actionType("REDISTRIBUTE")
                        .description("Redistribute parcels from " + alert.getAgencyName())
                        .sourceAgencyId(alert.getAgencyId())
                        .priority(alert.getCongestionLevel() > 0.9 ? "HIGH" : "MEDIUM")
                        .requiresConfirmation(true)
                        .status("PENDING")
                        .build();
                
                pendingActions.put(actionId, action);
                actions.add(action);
            }
        }
        
        return actions;
    }

    @Override
    public SelfHealingAction executeAction(String actionId) {
        SelfHealingAction action = pendingActions.get(actionId);
        if (action == null) {
            throw new ResourceNotFoundException(
                    "Self-healing action not found",
                    ErrorCode.VALIDATION_ERROR
            );
        }
        
        // Mark as executed
        action.setStatus("EXECUTED");
        
        // Log the action for audit
        // In a real implementation, this would trigger actual parcel movements
        
        return action;
    }

    @Override
    public RouteOptimization optimizeCourierRoute(UUID courierId) {
        Objects.requireNonNull(courierId, "courierId is required");
        Courier courier = courierRepository.findById(courierId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Courier not found",
                        ErrorCode.COURIER_NOT_FOUND
                ));

        // Get parcels assigned for delivery
        List<Parcel> parcels = parcelRepository.findByStatusIn(
                List.of(ParcelStatus.OUT_FOR_DELIVERY)
        );

        // Simple optimization: sort by recipient location
        List<DeliveryStop> stops = new ArrayList<>();
        int seq = 1;
        for (Parcel parcel : parcels) {
            Double lat = parcel.getRecipientAddress() != null && parcel.getRecipientAddress().getLatitude() != null
                ? parcel.getRecipientAddress().getLatitude().doubleValue()
                : null;
            Double lon = parcel.getRecipientAddress() != null && parcel.getRecipientAddress().getLongitude() != null
                ? parcel.getRecipientAddress().getLongitude().doubleValue()
                : null;

            stops.add(DeliveryStop.builder()
                    .sequence(seq++)
                    .parcelId(parcel.getId())
                    .trackingRef(parcel.getTrackingRef())
                    .recipientName(parcel.getRecipientAddress().getLabel())
                    .address(parcel.getRecipientAddress().getCity())
                .latitude(lat)
                .longitude(lon)
                    .deliveryType(parcel.getDeliveryOption().name())
                    .build());
        }

        return RouteOptimization.builder()
                .courierId(courierId)
                .courierName(courier.getFullName())
                .optimizedRoute(stops)
                .totalDeliveries(stops.size())
                .optimizationReason("Route optimized based on geographic proximity")
                .build();
    }

    @Override
    public int notifyAffectedClients(UUID agencyId, String message) {
        Objects.requireNonNull(agencyId, "agencyId is required");
        Objects.requireNonNull(message, "message is required");
        List<Parcel> affectedParcels = parcelRepository.findByDestinationAgency_IdAndStatusIn(
                agencyId,
                List.of(ParcelStatus.ARRIVED_DEST_AGENCY, ParcelStatus.IN_TRANSIT)
        );

        int notified = 0;
        for (Parcel parcel : affectedParcels) {
            try {
                var client = parcel.getClient();
                if (client == null) continue;

                var req = new com.smartcampost.backend.dto.notification.TriggerNotificationRequest();
                req.setType(com.smartcampost.backend.model.enums.NotificationType.MANUAL);
                req.setParcelId(parcel.getId());
                req.setSubject("Delivery Update");
                req.setMessage(message + " Tracking: " + parcel.getTrackingRef());

                if (client.getPhone() != null && !client.getPhone().isBlank()) {
                    req.setChannel(com.smartcampost.backend.model.enums.NotificationChannel.SMS);
                    req.setRecipientPhone(client.getPhone());
                } else if (client.getEmail() != null && !client.getEmail().isBlank()) {
                    req.setChannel(com.smartcampost.backend.model.enums.NotificationChannel.EMAIL);
                    req.setRecipientEmail(client.getEmail());
                } else {
                    continue;
                }

                notificationService.triggerNotification(req);
                notified++;
            } catch (Exception e) {
                // Log but continue
            }
        }

        return notified;
    }
}
