package com.smartcampost.backend.dto.auth;

import lombok.Data;

@Data
public class SendOtpRequest {
    private String phone;
}
