package com.smartcampost.backend.dto.payment;

import lombok.Data;

@Data
public class MtnTokenResponse {
    private String token;
    private String type = "basic";
}
