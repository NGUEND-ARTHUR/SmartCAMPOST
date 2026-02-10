package com.smartcampost.backend.dto.scan;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * Request to sync offline scan events.
 * Used when device was offline and events were queued locally.
 */
@Data
public class OfflineSyncRequest {

    @NotEmpty(message = "events list cannot be empty")
    @Valid
    private List<ScanEventCreateRequest> events;

    /**
     * Device identifier for audit
     */
    private String deviceId;

    /**
     * Sync batch identifier
     */
    private String batchId;
}
