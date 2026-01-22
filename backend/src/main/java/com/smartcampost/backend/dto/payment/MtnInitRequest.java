package com.smartcampost.backend.dto.payment;

import lombok.Data;

@Data
public class MtnInitRequest {
    private Double amount;
    private String msisdn;
    private String externalId;
}
