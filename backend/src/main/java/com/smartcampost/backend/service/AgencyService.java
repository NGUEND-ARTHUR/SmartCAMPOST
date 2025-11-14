package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.agency.AgencyRequest;
import com.smartcampost.backend.dto.agency.AgencyResponse;

import java.util.List;
import java.util.UUID;

public interface AgencyService {

    AgencyResponse createAgency(AgencyRequest request);

    List<AgencyResponse> listAgencies();

    AgencyResponse getAgency(UUID agencyId);

    AgencyResponse updateAgency(UUID agencyId, AgencyRequest request);
}
