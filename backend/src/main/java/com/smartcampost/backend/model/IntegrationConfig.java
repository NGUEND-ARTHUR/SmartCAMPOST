package com.smartcampost.backend.model;
import com.smartcampost.backend.model.enums.IntegrationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "integration_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrationConfig {

    @Id
    @Column(name = "integration_id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "integration_type", nullable = false, length = 50)
    private IntegrationType type; // SMS, EMAIL, PAYMENT_GATEWAY...

    @Column(name = "provider_name", nullable = false, length = 100)
    private String providerName;

    @Column(name = "api_key", length = 255)
    private String apiKey;

    @Column(name = "base_url", length = 255)
    private String endpointUrl;

    @Column(name = "active", nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (!enabled) enabled = true;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}