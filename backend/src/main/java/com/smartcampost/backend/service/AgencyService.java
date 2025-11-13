package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Agency;

import java.util.List;
import java.util.UUID;

public interface AgencyService {

    Agency createAgency(Agency agency);

    Agency updateAgency(UUID agencyId, Agency agency);

    Agency getAgency(UUID agencyId);

    List<Agency> listAgencies();
}
