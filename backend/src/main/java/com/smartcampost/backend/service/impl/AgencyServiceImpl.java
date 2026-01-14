package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.agency.AgencyRequest;
import com.smartcampost.backend.dto.agency.AgencyResponse;
import com.smartcampost.backend.model.Agency;
import com.smartcampost.backend.repository.AgencyRepository;
import com.smartcampost.backend.service.AgencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgencyServiceImpl implements AgencyService {

    private final AgencyRepository agencyRepository;

    @Override
    public AgencyResponse createAgency(AgencyRequest request) {
        // Auto-generate agencyCode if not provided
        String agencyCode = request.getAgencyCode();
        if (agencyCode == null || agencyCode.isBlank()) {
            agencyCode = "AG-" + System.currentTimeMillis();
        }

        Agency agency = Agency.builder()
                .id(UUID.randomUUID())
                .agencyName(request.getAgencyName())
                .agencyCode(agencyCode)
                .city(request.getCity())
                .region(request.getRegion())
                .build();

        agency = agencyRepository.save(agency);
        return toResponse(agency);
    }

    @Override
    public List<AgencyResponse> listAgencies() {
        return agencyRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AgencyResponse getAgency(UUID id) {
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agency not found: " + id));
        return toResponse(agency);
    }

    @Override
    public AgencyResponse updateAgency(UUID id, AgencyRequest request) {
        Agency agency = agencyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agency not found: " + id));

        agency.setAgencyName(request.getAgencyName());
        agency.setAgencyCode(request.getAgencyCode());
        agency.setCity(request.getCity());
        agency.setRegion(request.getRegion());

        agency = agencyRepository.save(agency);
        return toResponse(agency);
    }

    private AgencyResponse toResponse(Agency agency) {
        AgencyResponse dto = new AgencyResponse();
        dto.setId(agency.getId());
        dto.setAgencyName(agency.getAgencyName());
        dto.setAgencyCode(agency.getAgencyCode());
        dto.setCity(agency.getCity());
        dto.setRegion(agency.getRegion());
        return dto;
    }
}
