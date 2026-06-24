package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.dashboard.DashboardSummaryResponse;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.repository.RiskAlertRepository;
import com.smartcampost.backend.repository.SupportTicketRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.repository.ClientRepository;
import com.smartcampost.backend.repository.IntegrationConfigRepository;
import com.smartcampost.backend.model.enums.IntegrationType;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.PaymentStatus;
import com.smartcampost.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ParcelRepository parcelRepository;
    private final PaymentRepository paymentRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final RiskAlertRepository riskAlertRepository;
    private final UserAccountRepository userAccountRepository;
    private final ClientRepository clientRepository;
    private final IntegrationConfigRepository integrationConfigRepository;

    @Override
    public DashboardSummaryResponse getSummary() {

        try {

            long totalParcels = parcelRepository.count();
            long totalPayments = paymentRepository.count();
            long totalTickets = supportTicketRepository.count();
            long totalRiskAlerts = riskAlertRepository.count();

            // ===============================
            // Revenue calculation (analytics)
            // ===============================
            // Only SUCCESS payments count as revenue — PENDING/FAILED payments were
            // previously included by summing every row, overstating revenue.
            double totalRevenue;
            try {
                totalRevenue = paymentRepository.sumAmountByStatus(PaymentStatus.SUCCESS);
            } catch (Exception ex) {
                // ⚠️ Analytics-level failure
                throw new ConflictException(
                        "Failed to compute revenue metrics",
                        ErrorCode.ANALYTICS_ERROR
                );
            }

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalParcels", totalParcels);
            metrics.put("totalPayments", totalPayments);
            metrics.put("totalTickets", totalTickets);
            metrics.put("totalRiskAlerts", totalRiskAlerts);
            metrics.put("totalRevenue", totalRevenue);

            // activeUsers: use countBy query instead of findAll().stream()
            long activeUsers = userAccountRepository.countByFrozenFalseOrFrozenNull();
            metrics.put("activeUsers", activeUsers);

            // === NEW: registeredClients ===
            long registeredClients = clientRepository.count();
            metrics.put("registeredClients", registeredClients);

            // ===============================
            // Delivered parcels metric
            // ===============================
            // ✅ FIX: Use COUNT query - avoids memory bomb
            try {
                long delivered = parcelRepository.countByStatusIn(
                    List.of(ParcelStatus.DELIVERED)
                );
                metrics.put("deliveredParcels", delivered);
            } catch (Exception ex) {
                metrics.put("deliveredParcels", 0L);
            }

            // ===============================
            // External integration metrics (real repository state)
            // ===============================
            try {
                long enabledIntegrations = integrationConfigRepository.findByEnabledTrue().size();
                boolean paymentGatewayEnabled = integrationConfigRepository
                        .findByTypeAndEnabledTrue(IntegrationType.PAYMENT_GATEWAY)
                        .isPresent();

                metrics.put("enabledIntegrations", enabledIntegrations);
                metrics.put("paymentGatewayConfigured", paymentGatewayEnabled);
                metrics.put("externalIntegrationStatus", paymentGatewayEnabled ? "CONFIGURED" : "NOT_CONFIGURED");

            } catch (Exception ex) {
                throw new ConflictException(
                        "External integration failure",
                        ErrorCode.INTEGRATION_GATEWAY_ERROR   // <-- now used!
                );
            }

            return DashboardSummaryResponse.builder()
                    .metrics(metrics)
                    .build();

        } catch (ConflictException ex) {
            // rethrow analytics-level errors exactly as they are
            throw ex;

        } catch (Exception ex) {
            // 🔥 General dashboard failure
            throw new ConflictException(
                    "Failed to load dashboard summary",
                    ErrorCode.DASHBOARD_ERROR
            );
        }
    }
}
