package com.smartcampost.backend.dto.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VerifyOtpResponse {
    private boolean verified;
}
