package com.smartcampost.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "agency")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agency {

    @Id
    @Column(name = "agency_id", columnDefinition = "CHAR(36)")
    private UUID id;

    @Column(name = "agency_name", nullable = false, length = 150)
    private String agencyName;

    @Column(name = "agency_code", nullable = false, length = 50, unique = true)
    private String agencyCode;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "region", nullable = false, length = 100)
    private String region;

    @Column(name = "country", nullable = false, length = 100)
    private String country;
}
