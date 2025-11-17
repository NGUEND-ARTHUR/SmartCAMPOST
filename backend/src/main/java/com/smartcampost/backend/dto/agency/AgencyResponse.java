package com.smartcampost.backend.dto.agency;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgencyResponse {
    private UUID id;
    private String agencyName;
    private String agencyCode;
    private String city;
    private String region;
}
