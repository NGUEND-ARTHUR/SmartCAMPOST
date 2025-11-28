package com.smartcampost.backend.dto.ticket;
import com.smartcampost.backend.model.enums.TicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TicketResponse {

    private UUID id;
    private UUID clientId;
    private String clientName;
    private String subject;
    private String message;
    private String category;
    private TicketStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}