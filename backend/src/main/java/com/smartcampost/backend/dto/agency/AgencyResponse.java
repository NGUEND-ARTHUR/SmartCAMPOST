package com.smartcampost.backend.dto.agency;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AgencyResponse {
    private UUID agencyId;
    private String agencyName;
    private String agencyCode;
    private String city;
    private String region;
}
