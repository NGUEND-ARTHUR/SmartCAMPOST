package com.smartcampost.backend.dto.message;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ParcelMessageResponse {
    private UUID id;
    private UUID parcelId;
    private UUID senderAccountId;
    private String senderRole;
    private String senderName;
    private String content;
    private Instant createdAt;
    private boolean mine;
    private boolean read;
}
