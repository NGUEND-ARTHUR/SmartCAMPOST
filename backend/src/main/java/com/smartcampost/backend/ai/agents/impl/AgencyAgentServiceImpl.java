package com.smartcampost.backend.ai.agents.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.ai.agents.AgencyAgentService;
import com.smartcampost.backend.ai.events.ScanEventRecordedEvent;
import com.smartcampost.backend.dto.ai.CongestionAlert;
import com.smartcampost.backend.dto.ai.SelfHealingAction;
import com.smartcampost.backend.model.Agency;
import com.smartcampost.backend.model.AiAgentRecommendation;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.AiModuleType;
import com.smartcampost.backend.model.enums.AiSubjectType;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.AgencyRepository;
import com.smartcampost.backend.repository.AiAgentRecommendationRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.SelfHealingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgencyAgentServiceImpl implements AgencyAgentService {

    private static final double CONGESTION_TRIGGER_LEVEL = 0.80;
    private static final List<ParcelStatus> CONGESTION_STATUSES = List.of(
            ParcelStatus.ARRIVED_DEST_AGENCY,
            ParcelStatus.ARRIVED_HUB
    );

    private final SelfHealingService selfHealingService;
    private final AgencyRepository agencyRepository;
    private final ParcelRepository parcelRepository;
    private final AiAgentRecommendationRepository recommendationRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void onScanEventRecorded(ScanEventRecordedEvent event) {
        Objects.requireNonNull(event, "event is required");
        UUID agencyId = event.agencyId();
        if (agencyId == null) return;

        // Only react to scan events that typically impact agency load.
        switch (event.eventType()) {
            case ARRIVED_DEST_AGENCY, ARRIVED_HUB, DEPARTED_HUB, IN_TRANSIT -> {
                // continue
            }
            default -> {
                return;
            }
        }

        try {
            CongestionAlert alert = selfHealingService.detectCongestionForAgency(agencyId);
            if (alert == null || alert.getCongestionLevel() < CONGESTION_TRIGGER_LEVEL) return;

            Optional<Agency> sourceAgencyOpt = agencyRepository.findById(agencyId);
            if (sourceAgencyOpt.isEmpty()) return;

            UUID targetAgencyId = selectTargetAgencySameRegion(sourceAgencyOpt.get());
            List<UUID> affectedParcels = selectCandidateParcelsForRedistribution(agencyId);

            SelfHealingAction action = SelfHealingAction.builder()
                    .actionId(UUID.randomUUID().toString())
                    .actionType("REDISTRIBUTE")
                    .description("Redistribute parcels from " + alert.getAgencyName() + " to reduce congestion")
                    .sourceAgencyId(agencyId)
                    .targetAgencyId(targetAgencyId)
                    .affectedParcels(affectedParcels)
                    .priority(alert.getCongestionLevel() > 0.90 ? "HIGH" : "MEDIUM")
                    .requiresConfirmation(true)
                    .status("PENDING")
                    .build();

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("congestionAlert", alert);
            payload.put("suggestedAction", action);

            String payloadJson = objectMapper.writeValueAsString(payload);
            String summary = "Congestion level " + String.format(Locale.ROOT, "%.2f", alert.getCongestionLevel())
                    + " at " + alert.getAgencyName();

            recommendationRepository.save(AiAgentRecommendation.builder()
                    .moduleType(AiModuleType.AGENCY)
                    .subjectType(AiSubjectType.AGENCY)
                    .subjectId(agencyId)
                    .summary(summary)
                    .payloadJson(payloadJson)
                    .build());
        } catch (Exception ex) {
            log.debug("AgencyAgent: failed to compute recommendation for agency {}: {}", agencyId, ex.getMessage());
        }
    }

    private UUID selectTargetAgencySameRegion(Agency sourceAgency) {
        if (sourceAgency == null) return null;
        String region = sourceAgency.getRegion();

        List<Agency> agencies = agencyRepository.findAll();
        long bestCount = Long.MAX_VALUE;
        UUID bestId = null;

        for (Agency candidate : agencies) {
            if (candidate == null || candidate.getId() == null) continue;
            if (candidate.getId().equals(sourceAgency.getId())) continue;
            if (region != null && candidate.getRegion() != null && !region.equalsIgnoreCase(candidate.getRegion())) {
                continue;
            }

            long parcelCount = parcelRepository.countByDestinationAgency_IdAndStatusIn(
                    candidate.getId(),
                    CONGESTION_STATUSES
            );

            if (parcelCount < bestCount) {
                bestCount = parcelCount;
                bestId = candidate.getId();
            }
        }

        return bestId;
    }

    private List<UUID> selectCandidateParcelsForRedistribution(UUID sourceAgencyId) {
        try {
            List<Parcel> parcels = parcelRepository.findByDestinationAgency_IdAndStatusIn(sourceAgencyId, CONGESTION_STATUSES);
            if (parcels == null || parcels.isEmpty()) return List.of();

            // Keep it minimal: propose up to 10 parcels.
            List<UUID> ids = new ArrayList<>();
            for (Parcel p : parcels) {
                if (p != null && p.getId() != null) ids.add(p.getId());
                if (ids.size() >= 10) break;
            }
            return ids;
        } catch (Exception ex) {
            return List.of();
        }
    }
}
