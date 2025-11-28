package com.smartcampost.backend.dto.ticket;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TicketReplyRequest {

    @NotBlank
    private String replyMessage;
}
