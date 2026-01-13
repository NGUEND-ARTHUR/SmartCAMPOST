package com.smartcampost.backend.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatRequest {

    @NotBlank
    private String message;

    private String sessionId;
    
    private String language; // "en" or "fr"
    
    private String context; // Optional context like tracking ID
}
