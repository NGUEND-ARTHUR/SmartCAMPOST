package com.smartcampost.backend.dto.address;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {

    private UUID id;

    private String label;

    private String street;

    private String city;

    private String region;

    private String country;

    private Double latitude;

    private Double longitude;
}
