package com.smartcampost.backend.service;

import org.springframework.data.domain.Page;

import java.util.UUID;

public interface RiskService {
    Page<?> listRiskAlerts(int page, int size);
    Object updateRiskAlert(UUID alertId, String description, Object severity);
    Object freezeUser(UUID userId, boolean frozen);
}
