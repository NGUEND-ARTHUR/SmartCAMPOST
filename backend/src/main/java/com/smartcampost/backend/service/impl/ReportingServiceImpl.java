package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.PaymentStatus;
import com.smartcampost.backend.repository.AgencyRepository;
import com.smartcampost.backend.repository.CourierRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.service.ReportingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportingServiceImpl implements ReportingService {

    private final ParcelRepository parcelRepository;
    private final PaymentRepository paymentRepository;
    private final CourierRepository courierRepository;
    private final AgencyRepository agencyRepository;

    @Override
    public Map<String, Object> getOperationalDashboard(LocalDate from, LocalDate to) {
        Map<String, Object> report = new LinkedHashMap<>();
        try {
            long totalParcels = parcelRepository.count();
            long activeParcels = parcelRepository.countByStatusIn(List.of(
                ParcelStatus.CREATED, ParcelStatus.ACCEPTED, ParcelStatus.TAKEN_IN_CHARGE,
                ParcelStatus.IN_TRANSIT, ParcelStatus.ARRIVED_HUB,
                ParcelStatus.ARRIVED_DEST_AGENCY, ParcelStatus.OUT_FOR_DELIVERY
            ));
            long deliveredParcels = parcelRepository.countByStatusIn(List.of(ParcelStatus.DELIVERED));
            long totalCouriers = courierRepository.count();
            long totalAgencies = agencyRepository.count();

            report.put("period", Map.of("from", from.toString(), "to", to.toString()));
            report.put("totalParcels", totalParcels);
            report.put("activeParcels", activeParcels);
            report.put("deliveredParcels", deliveredParcels);
            report.put("totalCouriers", totalCouriers);
            report.put("totalAgencies", totalAgencies);
            report.put("deliveryRate",
                totalParcels > 0 ? String.format("%.1f%%", (deliveredParcels * 100.0) / totalParcels) : "N/A");
        } catch (Exception e) {
            log.warn("Error computing operational dashboard: {}", e.getMessage());
            report.put("error", "Could not compute all metrics");
        }
        return report;
    }

    @Override
    public Map<String, Object> getFinanceSummary(LocalDate from, LocalDate to) {
        Map<String, Object> report = new LinkedHashMap<>();
        try {
            var fromInstant = from.atStartOfDay().toInstant(ZoneOffset.UTC);
            var toInstant   = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);

            var payments = paymentRepository.findAll().stream()
                .filter(p -> p.getTimestamp() != null
                    && !p.getTimestamp().isBefore(fromInstant)
                    && p.getTimestamp().isBefore(toInstant))
                .toList();

            double totalRevenue = payments.stream()
                .filter(p -> PaymentStatus.SUCCESS.equals(p.getStatus()))
                .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0)
                .sum();

            long successfulPayments = payments.stream()
                .filter(p -> PaymentStatus.SUCCESS.equals(p.getStatus()))
                .count();

            long failedPayments = payments.stream()
                .filter(p -> PaymentStatus.FAILED.equals(p.getStatus()))
                .count();

            report.put("period", Map.of("from", from.toString(), "to", to.toString()));
            report.put("totalRevenue", totalRevenue);
            report.put("successfulPayments", successfulPayments);
            report.put("failedPayments", failedPayments);
            report.put("totalTransactions", payments.size());
            report.put("currency", "XAF");
        } catch (Exception e) {
            log.warn("Error computing finance summary: {}", e.getMessage());
            report.put("error", "Could not compute finance metrics");
        }
        return report;
    }

    @Override
    public Map<String, Object> getParcelVolumeByZone(LocalDate from, LocalDate to) {
        Map<String, Object> report = new LinkedHashMap<>();
        try {
            // Aggregate parcel counts by destination agency city
            var agencies = agencyRepository.findAll();
            Map<String, Long> volumeByZone = new LinkedHashMap<>();
            for (var agency : agencies) {
                String zone = agency.getCity() != null ? agency.getCity() : "Unknown";
                long count = parcelRepository.countByDestinationAgency_Id(agency.getId());
                if (count > 0) volumeByZone.put(zone, count);
            }
            report.put("period", Map.of("from", from.toString(), "to", to.toString()));
            report.put("volumeByZone", volumeByZone);
            report.put("totalZones", volumeByZone.size());
        } catch (Exception e) {
            log.warn("Error computing parcel volume by zone: {}", e.getMessage());
            report.put("error", "Could not compute zone volume metrics");
        }
        return report;
    }
}
