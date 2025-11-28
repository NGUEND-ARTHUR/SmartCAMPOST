package com.smartcampost.backend.dto.ticket;
import com.smartcampost.backend.model.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateTicketStatusRequest {

    @NotNull
    private TicketStatus status;
}