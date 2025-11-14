package com.smartcampost.backend.dto.agency;

import lombok.Data;

@Data
public class AgencyRequest {
    private String agencyName;
    private String agencyCode;
    private String city;
    private String region;
}
