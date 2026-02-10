package com.smartcampost.backend.dto.scan;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response for offline sync operation.
 */
@Data
@Builder
public class OfflineSyncResponse {

    private String batchId;
    private int totalEvents;
    private int successCount;
    private int failureCount;
    private List<SyncFailure> failures;
    private Instant syncedAt;

    // New fields for enhanced sync response
    private int syncedCount;
    private int failedCount;
    private List<SyncedEvent> syncedEvents;
    private List<FailedEvent> failedEvents;
    private Instant serverTimestamp;

    @Data
    @Builder
    public static class SyncFailure {
        private int eventIndex;
        private String parcelId;
        private String eventType;
        private String errorMessage;
    }

    /**
     * Details of a successfully synced event
     */
    @Data
    @Builder
    public static class SyncedEvent {
        private String localId;        // Client-side ID for correlation
        private UUID serverId;         // Server-assigned ID
        private Instant serverTimestamp;
    }

    /**
     * Details of a failed sync event
     */
    @Data
    @Builder
    public static class FailedEvent {
        private String localId;        // Client-side ID for correlation
        private String error;          // Error message
        private boolean retryable;     // Whether sync should be retried
    }
}
