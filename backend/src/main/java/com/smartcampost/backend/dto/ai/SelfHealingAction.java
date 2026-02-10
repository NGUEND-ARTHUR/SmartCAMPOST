package com.smartcampost.backend.dto.ai;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Self-healing action suggested by the system.
 */
@Data
@Builder
public class SelfHealingAction {
    private String actionId;
    private String actionType;
    private String description;
    private UUID sourceAgencyId;
    private UUID targetAgencyId;
    private List<UUID> affectedParcels;
    private String priority;
    private boolean requiresConfirmation;
    private String status;
}
