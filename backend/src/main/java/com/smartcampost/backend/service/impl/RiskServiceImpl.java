package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.RiskAlert;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.repository.RiskAlertRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.RiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RiskServiceImpl implements RiskService {

    private final RiskAlertRepository riskAlertRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    public Page<?> listRiskAlerts(int page, int size) {
        return riskAlertRepository.findAll(PageRequest.of(page, size));
    }

    @Override
    public Object updateRiskAlert(UUID alertId, String description, Object severity) {
        UUID id = java.util.Objects.requireNonNull(alertId, "alertId is required");
        RiskAlert alert = riskAlertRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Risk alert not found", ErrorCode.RISK_ALERT_NOT_FOUND));

        alert.setDescription(description);

        // If your RiskAlert has setSeverity(RiskAlertSeverity) use it directly:
        // alert.setSeverity((RiskAlertSeverity) severity);

        RiskAlert saved = riskAlertRepository.save(alert);
        if (saved == null) throw new IllegalStateException("failed to save risk alert");
        return saved;
    }

    @Override
    public Object freezeUser(UUID userId, boolean frozen) {
        UUID id = java.util.Objects.requireNonNull(userId, "userId is required");
        UserAccount account = userAccountRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found", ErrorCode.USER_NOT_FOUND));

        account.setFrozen(frozen);
        UserAccount saved = userAccountRepository.save(account);
        if (saved == null) throw new IllegalStateException("failed to save user account");
        return saved;
    }
}
