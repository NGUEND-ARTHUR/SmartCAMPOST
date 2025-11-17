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
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceType serviceType;

    @Column(nullable = false)
    private String originZone;

    @Column(nullable = false)
    private String destinationZone;

    @Column(nullable = false)
    private String weightBracket;

    // 🔹 THIS is what was missing:
    @Column(nullable = false)
    private BigDecimal price;
}
