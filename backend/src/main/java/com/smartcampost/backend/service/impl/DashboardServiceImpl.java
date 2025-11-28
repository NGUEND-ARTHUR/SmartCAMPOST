package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.dashboard.DashboardSummaryResponse;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.RiskAlert;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.repository.RiskAlertRepository;
import com.smartcampost.backend.repository.SupportTicketRepository;
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

    @Override
    public DashboardSummaryResponse getSummary() {

        long totalParcels = parcelRepository.count();
        long totalPayments = paymentRepository.count();
        long totalTickets = supportTicketRepository.count();
        long totalRiskAlerts = riskAlertRepository.count();

        // basic revenue sum (mock)
        List<Payment> payments = paymentRepository.findAll();
        double totalRevenue = payments.stream()
                .mapToDouble(Payment::getAmount)
                .sum();

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalParcels", totalParcels);
        metrics.put("totalPayments", totalPayments);
        metrics.put("totalTickets", totalTickets);
        metrics.put("totalRiskAlerts", totalRiskAlerts);
        metrics.put("totalRevenue", totalRevenue);

        // Example extra metric: delivered parcels
        List<Parcel> parcels = parcelRepository.findAll();
        long delivered = parcels.stream()
                .filter(p -> p.getStatus() != null && p.getStatus().name().contains("DELIVERED"))
                .count();
        metrics.put("deliveredParcels", delivered);

        return DashboardSummaryResponse.builder()
                .metrics(metrics)
                .build();
    }
}
