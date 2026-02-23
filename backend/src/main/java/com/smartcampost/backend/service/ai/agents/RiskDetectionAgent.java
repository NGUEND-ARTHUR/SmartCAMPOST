package com.smartcampost.backend.service.ai.agents;

import com.smartcampost.backend.dto.ai.ShipmentRiskRequest;
import com.smartcampost.backend.dto.ai.ShipmentRiskResponse;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.ParcelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskDetectionAgent {

    private final ParcelRepository parcelRepository;

    public ShipmentRiskResponse detect(ShipmentRiskRequest request) {
        if (request == null) {
            return low(List.of("INVALID_REQUEST"), "Provide parcelId or trackingRef.");
        }

        Optional<Parcel> parcelOpt = findParcel(request.getParcelId(), request.getTrackingRef());
        if (parcelOpt.isEmpty()) {
            return low(List.of("PARCEL_NOT_FOUND"), "Verify tracking reference or parcel ID.");
        }

        Parcel parcel = parcelOpt.get();
        ParcelStatus status = parcel.getStatus();
        Instant now = Instant.now();

        if (status == ParcelStatus.DELIVERED || status == ParcelStatus.PICKED_UP_AT_AGENCY) {
            return low(List.of("DELIVERED"), "No action required.");
        }

        if (status == ParcelStatus.CANCELLED || status == ParcelStatus.RETURNED_TO_SENDER || status == ParcelStatus.RETURNED) {
            return low(List.of("CLOSED_LIFECYCLE"), "No delivery risk: shipment is closed (cancelled/returned).");
        }

        int score = 0;
        List<String> reasons = new ArrayList<>();

        // Overdue checks
        if (parcel.getExpectedDeliveryAt() != null) {
            Duration overdueBy = Duration.between(parcel.getExpectedDeliveryAt(), now);
            if (!overdueBy.isNegative() && overdueBy.toHours() >= 48) {
                score += 4;
                reasons.add("SEVERELY_OVERDUE");
            } else if (!overdueBy.isNegative() && overdueBy.toHours() >= 1) {
                score += 3;
                reasons.add("OVERDUE");
            }
        } else {
            reasons.add("MISSING_EXPECTED_DELIVERY");
        }

        // Stalled before dispatch: created/accepted but no progress after 48h
        if ((status == ParcelStatus.CREATED || status == ParcelStatus.ACCEPTED)
                && parcel.getCreatedAt() != null
                && Duration.between(parcel.getCreatedAt(), now).toHours() >= 48) {
            score += 2;
            reasons.add("STALLED_PRE_DISPATCH");
        }

        // Validation anomaly: accepted or later but validatedAt missing
        if (status != null && status.ordinal() >= ParcelStatus.ACCEPTED.ordinal()
                && parcel.getValidatedAt() == null) {
            score += 2;
            reasons.add("MISSING_VALIDATION_TIMESTAMP");
        }

        if (parcel.isFragile()) {
            score += 1;
            reasons.add("FRAGILE_ITEM");
        }

        ShipmentRiskResponse.RiskLevel riskLevel;
        if (score >= 6) {
            riskLevel = ShipmentRiskResponse.RiskLevel.HIGH;
        } else if (score >= 3) {
            riskLevel = ShipmentRiskResponse.RiskLevel.MEDIUM;
        } else {
            riskLevel = ShipmentRiskResponse.RiskLevel.LOW;
        }

        String action = switch (riskLevel) {
            case HIGH -> "Open incident: contact courier/agency, verify last scan, and consider reroute or escalation.";
            case MEDIUM -> "Monitor and verify scans; notify responsible agency if no update within 24 hours.";
            case LOW -> "No immediate action required.";
        };

        log.info("Risk detection for parcel {} (status={}): level={}, reasons={}", parcel.getId(), status, riskLevel, reasons);

        ShipmentRiskResponse response = new ShipmentRiskResponse();
        response.setRiskLevel(riskLevel);
        response.setReasonCodes(reasons);
        response.setRecommendedAction(action);
        return response;
    }

    private Optional<Parcel> findParcel(UUID parcelId, String trackingRef) {
        if (parcelId != null) {
            return parcelRepository.findById(parcelId);
        }
        if (trackingRef != null && !trackingRef.isBlank()) {
            return parcelRepository.findByTrackingRef(trackingRef.trim());
        }
        return Optional.empty();
    }

    private ShipmentRiskResponse low(List<String> reasons, String action) {
        ShipmentRiskResponse resp = new ShipmentRiskResponse();
        resp.setRiskLevel(ShipmentRiskResponse.RiskLevel.LOW);
        resp.setReasonCodes(reasons);
        resp.setRecommendedAction(action);
        return resp;
    }
}
