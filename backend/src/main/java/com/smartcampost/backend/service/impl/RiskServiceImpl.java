package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.admin.UserAccountResponse;
import com.smartcampost.backend.dto.compliance.RiskAlertResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.RiskAlert;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.RiskSeverity;
import com.smartcampost.backend.repository.RiskAlertRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.RiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RiskServiceImpl implements RiskService {

    private final RiskAlertRepository riskAlertRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationService notificationService;

    @Override
    public Page<?> listRiskAlerts(int page, int size) {
        return riskAlertRepository.findAll(PageRequest.of(page, size)).map(this::toResponse);
    }

    @Override
    public Object updateRiskAlert(UUID alertId, String description, Object severity) {
        UUID id = java.util.Objects.requireNonNull(alertId, "alertId is required");
        RiskAlert alert = riskAlertRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Risk alert not found", ErrorCode.RISK_ALERT_NOT_FOUND));

        alert.setDescription(description);

        try {
            if (severity instanceof RiskSeverity rs) {
                alert.setSeverity(rs);
            } else if (severity instanceof String s && !s.isBlank()) {
                alert.setSeverity(RiskSeverity.valueOf(s.trim().toUpperCase()));
            }
        } catch (Exception ignored) {
            // Ignore invalid severity values to preserve backward compatibility
        }

        // If your RiskAlert has setSeverity(RiskAlertSeverity) use it directly:
        // alert.setSeverity((RiskAlertSeverity) severity);

        @SuppressWarnings("null")
        RiskAlert saved = riskAlertRepository.save(alert);
        return toResponse(saved);
    }

    @Override
    public Object freezeUser(UUID userId, boolean frozen) {
        UUID id = java.util.Objects.requireNonNull(userId, "userId is required");
        UserAccount account = userAccountRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found", ErrorCode.AUTH_USER_NOT_FOUND));

        account.setFrozen(frozen);
        @SuppressWarnings("null")
        UserAccount saved = userAccountRepository.save(account);
        try {
            if (Boolean.TRUE.equals(saved.isFrozen())) {
                notificationService.notifyAccountFrozen(saved);
            } else {
                notificationService.notifyAccountUnfrozen(saved);
            }
        } catch (Exception ignored) {
            // Notification must never break risk action
        }
        return toUserResponse(saved);
    }

    private RiskAlertResponse toResponse(RiskAlert alert) {
        UUID parcelId = alert.getParcel() != null ? alert.getParcel().getId() : null;
        UUID paymentId = alert.getPayment() != null ? alert.getPayment().getId() : null;
        String entityType = parcelId != null ? "PARCEL" : (paymentId != null ? "PAYMENT" : null);
        UUID entityId = parcelId != null ? parcelId : paymentId;
        return RiskAlertResponse.builder()
                .id(alert.getId())
                .alertType(alert.getAlertType())
                .severity(alert.getSeverity())
                .status(alert.getStatus())
            .parcelId(parcelId)
            .paymentId(paymentId)
            .entityType(entityType)
            .entityId(entityId)
                .description(alert.getDescription())
                .resolved(alert.isResolved())
                .createdAt(alert.getCreatedAt())
                .updatedAt(alert.getUpdatedAt())
                .reviewedByStaffId(alert.getReviewedByStaff() != null ? alert.getReviewedByStaff().getId() : null)
                .build();
    }

    private UserAccountResponse toUserResponse(UserAccount a) {
        Instant createdAt = null;
        try {
            createdAt = a.getCreatedAt();
        } catch (Exception ignored) {
            createdAt = null;
        }
        return UserAccountResponse.builder()
                .id(a.getId())
                .phone(a.getPhone())
                .role(a.getRole())
                .entityId(a.getEntityId())
                .frozen(a.isFrozen())
                .createdAt(createdAt)
                .build();
    }
}
