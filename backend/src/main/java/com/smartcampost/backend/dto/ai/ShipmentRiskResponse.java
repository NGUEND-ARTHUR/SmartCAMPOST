package com.smartcampost.backend.dto.ai;

import lombok.Data;

import java.util.List;

@Data
public class ShipmentRiskResponse {
    public enum RiskLevel {LOW, MEDIUM, HIGH}

    private RiskLevel riskLevel;
    private List<String> reasonCodes;
    private String recommendedAction;
}
