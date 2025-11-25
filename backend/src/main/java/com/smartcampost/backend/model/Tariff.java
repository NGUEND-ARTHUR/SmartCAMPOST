package com.smartcampost.backend.model;

import com.smartcampost.backend.model.enums.ServiceType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tariff")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tariff {

    @Id
    @Column(name = "id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false)
    private ServiceType serviceType; // STANDARD, EXPRESS

    @Column(name = "origin_zone", nullable = false, length = 255)
    private String originZone;

    @Column(name = "destination_zone", nullable = false, length = 255)
    private String destinationZone;

    @Column(name = "weight_bracket", nullable = false, length = 255)
    private String weightBracket;

    @Column(name = "price", nullable = false, precision = 38, scale = 2)
    private BigDecimal price;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID(); // corresponds to BINARY(16)
        }
    }
}
