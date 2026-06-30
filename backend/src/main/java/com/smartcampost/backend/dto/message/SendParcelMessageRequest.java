package com.smartcampost.backend.dto.message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendParcelMessageRequest {

    @NotBlank(message = "Message content is required")
    @Size(max = 2000, message = "Message is too long")
    private String content;
}
