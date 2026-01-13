package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.compliance.ComplianceReportResponse;
import com.smartcampost.backend.dto.compliance.ResolveRiskAlertRequest;
import com.smartcampost.backend.dto.compliance.RiskAlertResponse;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.RiskAlert;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.RiskSeverity;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.RiskAlertRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.ComplianceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplianceServiceImpl implements ComplianceService {

    private final RiskAlertRepository riskAlertRepository;
    private final UserAccountRepository userAccountRepository;

    // ================== LIST ALERTS ==================
    @Override
    public Page<RiskAlertResponse> listRiskAlerts(int page, int size) {
        ensureBackoffice();
        return riskAlertRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ================== GET ONE ALERT ==================
    @Override
    public RiskAlertResponse getRiskAlertById(UUID id) {
        ensureBackoffice();

        RiskAlert alert = riskAlertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Risk alert not found",
                        ErrorCode.RISK_ALERT_NOT_FOUND
                ));

        return toResponse(alert);
    }

    // ================== RESOLVE ALERT ==================
    @Override
    public RiskAlertResponse resolveRiskAlert(UUID id, ResolveRiskAlertRequest request) {
        ensureBackoffice();

        RiskAlert alert = riskAlertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Risk alert not found",
                        ErrorCode.RISK_ALERT_NOT_FOUND
                ));

        alert.setResolved(request.isResolved());
        riskAlertRepository.save(alert);

        return toResponse(alert);
    }

    // ================== REPORT ==================
    @Override
    public ComplianceReportResponse generateComplianceReport(LocalDate from, LocalDate to) {
        ensureBackoffice();

        if (from == null || to == null || from.isAfter(to)) {
            throw new ConflictException(
                    "Invalid date range for compliance report",
                    ErrorCode.RISK_EVALUATION_FAILED
            );
        }

        Instant fromInstant = from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toInstant = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

        List<RiskAlert> all = riskAlertRepository.findAll();

        long total = all.stream()
                .filter(a -> isBetween(a.getCreatedAt(), fromInstant, toInstant))
                .count();

        long unresolved = all.stream()
                .filter(a -> isBetween(a.getCreatedAt(), fromInstant, toInstant))
                .filter(a -> !a.isResolved())
                .count();

        long highCritical = all.stream()
                .filter(a -> isBetween(a.getCreatedAt(), fromInstant, toInstant))
                .filter(a -> a.getSeverity() == RiskSeverity.HIGH
                        || a.getSeverity() == RiskSeverity.CRITICAL)
                .count();

        long amlCount = all.stream()
                .filter(a -> isBetween(a.getCreatedAt(), fromInstant, toInstant))
                .filter(a -> a.getAlertType() != null
                        && a.getAlertType().name().toUpperCase().contains("AML"))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAlerts", total);
        stats.put("unresolvedAlerts", unresolved);
        stats.put("highOrCriticalAlerts", highCritical);
        stats.put("amlAlerts", amlCount);

        Map<String, Long> byType = all.stream()
                .filter(a -> isBetween(a.getCreatedAt(), fromInstant, toInstant))
                .collect(Collectors.groupingBy(
                        a -> a.getAlertType().name(),
                        Collectors.counting()
                ));
        stats.put("byType", byType);

        // Use the existing error codes in the report context
        if (total == 0) {
            stats.put("noAlertsCode", ErrorCode.COMPLIANCE_ALERT_NOT_FOUND.name());
        }
        if (amlCount == 0) {
            stats.put("amlStatusCode", ErrorCode.AML_ALERT_NOT_FOUND.name());
        }

        // 🔥 NEW: use COMPLIANCE_RULE_VIOLATION when there are unresolved HIGH/CRITICAL alerts
        if (highCritical > 0 && unresolved > 0) {
            stats.put("complianceRuleStatusCode", ErrorCode.COMPLIANCE_RULE_VIOLATION.name());
        }

        return ComplianceReportResponse.builder()
                .generatedAt(Instant.now())
                .period(from + " to " + to)
                .stats(stats)
                .build();
    }

    // ================== FREEZE ACCOUNT ==================
    @Override
    public void freezeAccount(UUID userId) {
        ensureBackoffice();

        UserAccount account = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found",
                        ErrorCode.AUTH_USER_NOT_FOUND
                ));

        if (Boolean.TRUE.equals(account.isFrozen())) {
            throw new ConflictException(
                    "Account already frozen",
                    ErrorCode.ACCOUNT_ALREADY_FROZEN
            );
        }

        // account.setFrozen(true);
        userAccountRepository.save(account);
    }

    // ================== UNFREEZE ACCOUNT ==================
    @Override
    public void unfreezeAccount(UUID userId) {
        ensureBackoffice();

        UserAccount account = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found",
                        ErrorCode.AUTH_USER_NOT_FOUND
                ));

        if (!Boolean.TRUE.equals(account.isFrozen())) {
            throw new ConflictException(
                    "Account is not frozen",
                    ErrorCode.ACCOUNT_NOT_FROZEN
            );
        }

        // account.setFrozen(false);
        userAccountRepository.save(account);
    }

    // ================== HELPERS ==================
    private void ensureBackoffice() {
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(
                    ErrorCode.AUTH_FORBIDDEN,
                    "Not allowed to access compliance resources"
            );
        }
    }

    private boolean isBetween(Instant value, Instant from, Instant to) {
        return (value.equals(from) || value.isAfter(from))
                && value.isBefore(to);
    }

    private UserAccount getCurrentUserAccount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(
                    ErrorCode.AUTH_UNAUTHORIZED,
                    "Unauthenticated"
            );
        }

        String subject = auth.getName();

        try {
            UUID userId = UUID.fromString(subject);
            return userAccountRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found",
                            ErrorCode.AUTH_USER_NOT_FOUND
                    ));
        } catch (IllegalArgumentException ex) {
            return userAccountRepository.findByPhone(subject)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found",
                            ErrorCode.AUTH_USER_NOT_FOUND
                    ));
        }
    }

    private RiskAlertResponse toResponse(RiskAlert alert) {
        return RiskAlertResponse.builder()
                .id(alert.getId())
                .alertType(alert.getAlertType())
                .severity(alert.getSeverity())
                .status(alert.getStatus())
                .parcelId(alert.getParcel() != null ? alert.getParcel().getId() : null)
                .paymentId(alert.getPayment() != null ? alert.getPayment().getId() : null)
                .description(alert.getDescription())
                .resolved(alert.isResolved())
                .createdAt(alert.getCreatedAt())
                .updatedAt(alert.getUpdatedAt())
                .reviewedByStaffId(alert.getReviewedByStaff() != null ? alert.getReviewedByStaff().getId() : null)
                .build();
    }
}
