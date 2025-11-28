package com.smartcampost.backend.dto.ticket;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateTicketRequest {

    @NotBlank
    private String subject;

    @NotBlank
    private String message;

    private String category;
}