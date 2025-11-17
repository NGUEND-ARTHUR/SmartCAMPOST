package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.scan.ScanEventCreateRequest;
import com.smartcampost.backend.dto.scan.ScanEventResponse;
import com.smartcampost.backend.model.Agency;
import com.smartcampost.backend.model.Agent;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.repository.AgencyRepository;
import com.smartcampost.backend.repository.AgentRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.ScanEventRepository;
import com.smartcampost.backend.service.ScanEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScanEventServiceImpl implements ScanEventService {

    private final ScanEventRepository scanEventRepository;
    private final ParcelRepository parcelRepository;
    private final AgencyRepository agencyRepository;
    private final AgentRepository agentRepository;

    @Override
    public ScanEventResponse recordScanEvent(ScanEventCreateRequest request) {
        Parcel parcel = parcelRepository.findById(request.getParcelId())
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + request.getParcelId()));

        Agency agency = null;
        if (request.getAgencyId() != null) {
            agency = agencyRepository.findById(request.getAgencyId())
                    .orElseThrow(() -> new IllegalArgumentException("Agency not found: " + request.getAgencyId()));
        }

        Agent agent = null;
        if (request.getAgentId() != null) {
            agent = agentRepository.findById(request.getAgentId())
                    .orElseThrow(() -> new IllegalArgumentException("Agent not found: " + request.getAgentId()));
        }

        // 🔁 String -> Enum (ScanEventType)
        ScanEventType type = ScanEventType.valueOf(request.getEventType().toUpperCase());

        ScanEvent event = ScanEvent.builder()
                .id(UUID.randomUUID())
                .parcel(parcel)
                .agency(agency)
                .agent(agent)
                .eventType(type)
                .timestamp(Instant.now())
                .locationNote(request.getLocationNote())
                .build();

        event = scanEventRepository.save(event);
        return toResponse(event);
    }

    @Override
    public List<ScanEventResponse> getHistoryForParcel(UUID parcelId) {
        return scanEventRepository.findByParcel_IdOrderByTimestampAsc(parcelId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private ScanEventResponse toResponse(ScanEvent event) {
        return ScanEventResponse.builder()
                .id(event.getId())
                .parcelId(event.getParcel().getId())
                .agencyId(event.getAgency() != null ? event.getAgency().getId() : null)
                .agentId(event.getAgent() != null ? event.getAgent().getId() : null)
                .eventType(event.getEventType().name())
                .timestamp(event.getTimestamp())
                .locationNote(event.getLocationNote())
                .build();
    }
}
