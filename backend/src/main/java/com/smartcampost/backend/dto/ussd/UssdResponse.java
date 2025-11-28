package com.smartcampost.backend.dto.ussd;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UssdResponse {

    private String message;
    private boolean endSession;
}