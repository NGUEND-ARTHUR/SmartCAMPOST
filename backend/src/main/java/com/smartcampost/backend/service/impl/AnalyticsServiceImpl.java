package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.analytics.*;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.model.Agency;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.repository.AgencyRepository;
import com.smartcampost.backend.repository.AiDecisionLogRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.repository.ScanEventRepository;
import com.smartcampost.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final ParcelRepository parcelRepository;
    private final PaymentRepository paymentRepository;
    private final ScanEventRepository scanEventRepository;
    private final AgencyRepository agencyRepository;
    private final AiDecisionLogRepository aiDecisionLogRepository;

    // ================== ETA PREDICTION ==================
    @Override
    public EtaPredictionResponse predictEtaForParcel(UUID parcelId) {

        Objects.requireNonNull(parcelId, "parcelId is required");
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found",
                        ErrorCode.PARCEL_NOT_FOUND
                ));

        Instant predicted;
        double confidence;

        ScanEvent lastEvent = null;
        ScanEventType lastType = null;
        Instant lastTs = null;
        String lastLocationNote = null;
        int scanCount = 0;

        try {
            lastEvent = scanEventRepository.findTopByParcel_IdOrderByTimestampDesc(parcelId).orElse(null);
            if (lastEvent != null) {
                lastType = lastEvent.getEventType();
                lastTs = lastEvent.getTimestamp();
                lastLocationNote = lastEvent.getLocationNote();
            }
            scanCount = scanEventRepository.findByParcel_IdOrderByTimestampAsc(parcelId).size();
        } catch (Exception ex) {
            log.warn("Failed to load scan events for parcel {}", parcelId, ex);
            lastEvent = null;
            lastType = null;
            lastTs = null;
            lastLocationNote = null;
            scanCount = 0;
        }

        try {
            if (parcel.getExpectedDeliveryAt() != null) {
                predicted = parcel.getExpectedDeliveryAt();
                confidence = 0.9;
            } else {
                // ScanEvent-based ETA: anchor on last ScanEvent when available
                Instant anchor = (lastTs != null ? lastTs : parcel.getCreatedAt());
                ScanEventType t = lastType;

                long seconds;
                double base;
                if (t == null) {
                    seconds = 3L * 24 * 3600;
                    base = 0.55;
                } else {
                    switch (t) {
                        case OUT_FOR_DELIVERY -> {
                            seconds = 4L * 3600;
                            base = 0.85;
                        }
                        case ARRIVED_DESTINATION, ARRIVED_DEST_AGENCY -> {
                            seconds = 12L * 3600;
                            base = 0.8;
                        }
                        case IN_TRANSIT, DEPARTED_HUB, ARRIVED_HUB -> {
                            seconds = 24L * 3600;
                            base = 0.7;
                        }
                        case TAKEN_IN_CHARGE -> {
                            seconds = 2L * 24 * 3600;
                            base = 0.65;
                        }
                        case DELIVERY_FAILED, RESCHEDULED -> {
                            seconds = 24L * 3600;
                            base = 0.6;
                        }
                        case DELIVERED, PICKED_UP_AT_AGENCY, RETURNED, RETURNED_TO_SENDER, CANCELLED -> {
                            seconds = 0;
                            base = 0.98;
                        }
                        default -> {
                            seconds = 3L * 24 * 3600;
                            base = 0.6;
                        }
                    }
                }

                predicted = anchor.plusSeconds(seconds);

                confidence = base;
                if (scanCount >= 3) confidence += 0.05;
                if (scanCount >= 8) confidence += 0.05;
                if (lastTs != null) {
                    long ageSeconds = Math.max(0L, Instant.now().getEpochSecond() - lastTs.getEpochSecond());
                    if (ageSeconds > 7L * 24 * 3600) confidence -= 0.15;
                }
                if (confidence < 0.1) confidence = 0.1;
                if (confidence > 0.99) confidence = 0.99;
            }
        } catch (Exception ex) {
            // 🔥 Use ETA_CALCULATION_FAILED
            throw new ConflictException(
                    "Could not compute ETA for parcel",
                    ErrorCode.ETA_CALCULATION_FAILED
            );
        }

        return EtaPredictionResponse.builder()
                .parcelId(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .predictedDeliveryAt(predicted)
                .confidence(confidence)
                .lastEventType(lastType != null ? lastType.name() : null)
                .lastEventAt(lastTs)
                .lastLocationNote(lastLocationNote)
                .build();
    }

    // ================== PAYMENT ANOMALY ==================
    @Override
    public AnomalyCheckResponse checkPaymentAnomaly(UUID paymentId) {

        Objects.requireNonNull(paymentId, "paymentId is required");
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found",
                        ErrorCode.PAYMENT_NOT_FOUND
                ));

        double amount = payment.getAmount();
        boolean anomalous = false;
        String reason = "Normal payment";
        double score = 0.1;

        try {
            // Simple rule: amount above threshold = suspicious
            if (amount > 200000) {
                anomalous = true;
                reason = "Amount exceeds anomaly threshold";
                score = 0.8;
            }
        } catch (Exception ex) {
            // 🔥 Use ANOMALY_DETECTION_FAILED
            throw new ConflictException(
                    "Failed to evaluate payment anomaly",
                    ErrorCode.ANOMALY_DETECTION_FAILED
            );
        }

        return AnomalyCheckResponse.builder()
                .anomalous(anomalous)
                .reason(reason)
                .score(score)
                .build();
    }

    // ================== DEMAND FORECASTING ==================
    @Override
    public DemandForecastResponse forecastDemand(DemandForecastRequest request) {
        int days = (request.getForecastDays() != null && request.getForecastDays() > 0)
                ? Math.min(request.getForecastDays(), 30) : 7;

        Agency agency = null;
        String region = request.getRegion();

        if (request.getAgencyId() != null) {
            agency = agencyRepository.findById(request.getAgencyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Agency not found", ErrorCode.AGENCY_NOT_FOUND));
            if (region == null) {
                region = agency.getRegion();
            }
        }

        final UUID filterAgencyId = request.getAgencyId();
        final String filterRegion = region;

        // Analyze historical data: count parcels created in the last 30 days
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        List<Parcel> recentParcels = parcelRepository.findAll().stream()
                .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().isAfter(thirtyDaysAgo))
                .filter(p -> {
                    if (filterAgencyId != null) {
                        return (p.getOriginAgency() != null && p.getOriginAgency().getId().equals(filterAgencyId))
                                || (p.getDestinationAgency() != null && p.getDestinationAgency().getId().equals(filterAgencyId));
                    }
                    if (filterRegion != null && !filterRegion.isBlank()) {
                        return (p.getOriginAgency() != null && filterRegion.equalsIgnoreCase(p.getOriginAgency().getRegion()))
                                || (p.getDestinationAgency() != null && filterRegion.equalsIgnoreCase(p.getDestinationAgency().getRegion()));
                    }
                    return true;
                })
                .toList();

        int totalParcelsLast30 = recentParcels.size();
        double avgDaily = totalParcelsLast30 / 30.0;

        // Count current backlog (non-terminal parcels)
        int backlog = (int) recentParcels.stream()
                .filter(p -> p.getStatus() != null
                        && p.getStatus() != ParcelStatus.DELIVERED
                        && p.getStatus() != ParcelStatus.CANCELLED
                        && p.getStatus() != ParcelStatus.RETURNED)
                .count();

        // Trend detection: compare first 15 days vs last 15 days
        Instant midpoint = Instant.now().minus(15, ChronoUnit.DAYS);
        long firstHalf = recentParcels.stream().filter(p -> p.getCreatedAt().isBefore(midpoint)).count();
        long secondHalf = totalParcelsLast30 - firstHalf;
        String trend;
        if (secondHalf > firstHalf * 1.2) trend = "INCREASING";
        else if (firstHalf > secondHalf * 1.2) trend = "DECREASING";
        else trend = "STABLE";

        // Build daily forecasts
        List<DemandForecastResponse.DailyForecast> forecasts = new ArrayList<>();
        Random seededRandom = new Random(Objects.hash(request.getAgencyId(), region, LocalDate.now().toEpochDay()));
        double growthFactor = trend.equals("INCREASING") ? 1.05 : trend.equals("DECREASING") ? 0.95 : 1.0;

        for (int d = 1; d <= days; d++) {
            double predicted = avgDaily * Math.pow(growthFactor, d);
            // Add day-of-week seasonality (weekends lower)
            LocalDate forecastDate = LocalDate.now(ZoneOffset.UTC).plusDays(d);
            int dow = forecastDate.getDayOfWeek().getValue();
            if (dow == 6) predicted *= 0.7;  // Saturday
            else if (dow == 7) predicted *= 0.4; // Sunday

            // Small variance
            predicted += (seededRandom.nextGaussian() * 0.15 * predicted);
            int vol = Math.max(0, (int) Math.round(predicted));

            String level;
            if (vol > avgDaily * 1.5) level = "PEAK";
            else if (vol > avgDaily * 1.1) level = "HIGH";
            else if (vol < avgDaily * 0.5) level = "LOW";
            else level = "NORMAL";

            forecasts.add(DemandForecastResponse.DailyForecast.builder()
                    .date(forecastDate)
                    .predictedVolume(vol)
                    .confidence(Math.max(0.5, 0.85 - (d * 0.02)))
                    .demandLevel(level)
                    .build());
        }

        // Recommendation
        String recommendation;
        if (trend.equals("INCREASING") && backlog > avgDaily * 2) {
            recommendation = "Volume is rising and backlog is high. Consider adding temporary staff or redistributing parcels to nearby agencies.";
        } else if (trend.equals("INCREASING")) {
            recommendation = "Volume trend is increasing. Monitor capacity and prepare additional resources.";
        } else if (backlog > avgDaily * 3) {
            recommendation = "Backlog is critically high. Prioritize clearing pending parcels before accepting new volumes.";
        } else {
            recommendation = "Demand is stable. Current capacity appears adequate.";
        }

        return DemandForecastResponse.builder()
                .agencyId(request.getAgencyId())
                .agencyName(agency != null ? agency.getAgencyName() : null)
                .region(region)
                .forecasts(forecasts)
                .currentBacklog(backlog)
                .averageDailyVolume(Math.round(avgDaily * 100.0) / 100.0)
                .trend(trend)
                .confidenceScore(totalParcelsLast30 > 10 ? 0.8 : 0.5)
                .recommendation(recommendation)
                .build();
    }

    // ================== SENTIMENT ANALYSIS ==================
    @Override
    public SentimentAnalysisResponse analyzeSentiment() {
        // Analyze AI decision logs to derive sentiment from chat interactions
        var allLogs = aiDecisionLogRepository.findAll();

        // Filter for chat-related decisions
        var chatLogs = allLogs.stream()
                .filter(l -> l.getDecisionType() != null && l.getDecisionType().contains("CHAT"))
                .toList();

        int total = Math.max(chatLogs.size(), 1);

        // Categorize by outcome
        long positive = chatLogs.stream()
                .filter(l -> {
                    String outcome = l.getDecisionOutcome();
                    return outcome != null && (outcome.contains("RESOLVED") || outcome.contains("TRACKING")
                            || outcome.contains("GREETING") || outcome.contains("DELIVERY"));
                }).count();

        long negative = chatLogs.stream()
                .filter(l -> {
                    String outcome = l.getDecisionOutcome();
                    return outcome != null && (outcome.contains("UNKNOWN") || outcome.contains("ERROR")
                            || outcome.contains("COMPLAINT"));
                }).count();

        long neutral = total - positive - negative;

        double score = (positive - negative) / (double) total;

        // Derive top issues from decision types
        Map<String, Long> issueCounts = chatLogs.stream()
                .filter(l -> l.getDecisionOutcome() != null)
                .collect(Collectors.groupingBy(
                        l -> l.getDecisionOutcome().toUpperCase(),
                        Collectors.counting()
                ));

        List<SentimentAnalysisResponse.TopIssue> topIssues = issueCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> SentimentAnalysisResponse.TopIssue.builder()
                        .category(e.getKey())
                        .count(e.getValue().intValue())
                        .percentage(Math.round(e.getValue() * 10000.0 / total) / 100.0)
                        .build())
                .toList();

        String overall;
        if (score > 0.2) overall = "POSITIVE";
        else if (score < -0.2) overall = "NEGATIVE";
        else overall = "NEUTRAL";

        return SentimentAnalysisResponse.builder()
                .overallSentiment(overall)
                .sentimentScore(Math.round(score * 100.0) / 100.0)
                .totalInteractions(total)
                .positiveCount((int) positive)
                .neutralCount((int) neutral)
                .negativeCount((int) negative)
                .topIssues(topIssues)
                .satisfactionRate(Math.round(positive * 10000.0 / total) / 100.0)
                .build();
    }

    // ================== SMART NOTIFICATIONS ==================
    @Override
    public SmartNotificationResponse getSmartNotifications() {
        List<SmartNotificationResponse.SmartAlert> alerts = new ArrayList<>();
        Instant now = Instant.now();

        List<Parcel> activeParcels = parcelRepository.findAll().stream()
                .filter(p -> p.getStatus() != null
                        && p.getStatus() != ParcelStatus.DELIVERED
                        && p.getStatus() != ParcelStatus.CANCELLED
                        && p.getStatus() != ParcelStatus.RETURNED)
                .toList();

        for (Parcel parcel : activeParcels) {
            // 1. Delay Risk: expected delivery in the past but not delivered
            if (parcel.getExpectedDeliveryAt() != null && parcel.getExpectedDeliveryAt().isBefore(now)
                    && parcel.getStatus() != ParcelStatus.DELIVERED) {
                long hoursOverdue = ChronoUnit.HOURS.between(parcel.getExpectedDeliveryAt(), now);
                alerts.add(SmartNotificationResponse.SmartAlert.builder()
                        .parcelId(parcel.getId())
                        .trackingNumber(parcel.getTrackingNumber())
                        .alertType("DELAY_RISK")
                        .severity(hoursOverdue > 48 ? "CRITICAL" : "WARNING")
                        .message("Parcel is " + hoursOverdue + " hours overdue.")
                        .recommendation("Contact the destination agency and check for delivery issues.")
                        .build());
            }

            // 2. Stuck Parcel: no scan event in over 72 hours for in-transit parcels
            if (parcel.getStatus() == ParcelStatus.IN_TRANSIT || parcel.getStatus() == ParcelStatus.ACCEPTED) {
                try {
                    Optional<ScanEvent> lastScan = scanEventRepository.findTopByParcel_IdOrderByTimestampDesc(parcel.getId());
                    Instant lastActivity = lastScan.map(ScanEvent::getTimestamp).orElse(parcel.getCreatedAt());
                    long hoursSinceActivity = ChronoUnit.HOURS.between(lastActivity, now);
                    if (hoursSinceActivity > 72) {
                        alerts.add(SmartNotificationResponse.SmartAlert.builder()
                                .parcelId(parcel.getId())
                                .trackingNumber(parcel.getTrackingNumber())
                                .alertType("STUCK_PARCEL")
                                .severity("WARNING")
                                .message("No activity for " + hoursSinceActivity + " hours.")
                                .recommendation("Investigate parcel location. It may be stuck at a hub.")
                                .build());
                    }
                } catch (Exception ignored) {
                    // Skip if scan events can't be loaded
                }
            }

            // 3. Delivery Soon: expected delivery within 4 hours
            if (parcel.getExpectedDeliveryAt() != null && parcel.getExpectedDeliveryAt().isAfter(now)
                    && ChronoUnit.HOURS.between(now, parcel.getExpectedDeliveryAt()) <= 4) {
                alerts.add(SmartNotificationResponse.SmartAlert.builder()
                        .parcelId(parcel.getId())
                        .trackingNumber(parcel.getTrackingNumber())
                        .alertType("DELIVERY_SOON")
                        .severity("INFO")
                        .message("Parcel expected to arrive within " + ChronoUnit.HOURS.between(now, parcel.getExpectedDeliveryAt()) + " hours.")
                        .recommendation("Ensure recipient is available for delivery.")
                        .build());
            }
        }

        // 4. Peak Congestion: agency with too many parcels
        Map<UUID, Long> agencyParcelCounts = activeParcels.stream()
                .filter(p -> p.getDestinationAgency() != null)
                .collect(Collectors.groupingBy(p -> p.getDestinationAgency().getId(), Collectors.counting()));

        agencyParcelCounts.forEach((agencyId, count) -> {
            if (count > 20) {
                agencyRepository.findById(agencyId).ifPresent(agency ->
                        alerts.add(SmartNotificationResponse.SmartAlert.builder()
                                .alertType("PEAK_CONGESTION")
                                .severity(count > 50 ? "CRITICAL" : "WARNING")
                                .message("Agency '" + agency.getAgencyName() + "' has " + count + " pending parcels.")
                                .recommendation("Consider redistributing parcels to nearby agencies.")
                                .build()));
            }
        });

        return SmartNotificationResponse.builder()
                .alerts(alerts)
                .totalAlerts(alerts.size())
                .build();
    }

    // ================== ADDRESS VALIDATION (AI) ==================
    @Override
    public AddressValidationResponse validateAddress(AddressValidationRequest request) {
        List<String> issues = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();
        double confidence = 1.0;

        String street = request.getStreet() != null ? request.getStreet().trim() : "";
        String city = request.getCity() != null ? request.getCity().trim() : "";
        String region = request.getRegion() != null ? request.getRegion().trim() : "";
        String country = request.getCountry() != null ? request.getCountry().trim() : "";

        // Known Cameroon regions for validation
        Set<String> cameroonRegions = Set.of(
                "Adamaoua", "Centre", "East", "Far North", "Littoral",
                "North", "Northwest", "South", "Southwest", "West"
        );

        // Known major cities mapped to regions
        Map<String, String> cityToRegion = Map.ofEntries(
                Map.entry("douala", "Littoral"), Map.entry("yaounde", "Centre"),
                Map.entry("bamenda", "Northwest"), Map.entry("bafoussam", "West"),
                Map.entry("garoua", "North"), Map.entry("maroua", "Far North"),
                Map.entry("bertoua", "East"), Map.entry("ngaoundere", "Adamaoua"),
                Map.entry("ebolowa", "South"), Map.entry("buea", "Southwest"),
                Map.entry("limbe", "Southwest"), Map.entry("kribi", "South"),
                Map.entry("kumba", "Southwest"), Map.entry("nkongsamba", "Littoral")
        );

        // 1. Street validation
        if (street.length() < 3) {
            issues.add("Street address is too short");
            confidence -= 0.3;
        }

        // 2. City validation
        if (city.isEmpty()) {
            issues.add("City is missing");
            confidence -= 0.3;
        } else {
            String expectedRegion = cityToRegion.get(city.toLowerCase());
            if (expectedRegion != null && !region.isEmpty() && !expectedRegion.equalsIgnoreCase(region)) {
                issues.add("City '" + city + "' is in " + expectedRegion + " region, not " + region);
                suggestions.add("Change region to '" + expectedRegion + "'");
                confidence -= 0.2;
            }
        }

        // 3. Region validation
        if (!region.isEmpty()) {
            boolean validRegion = cameroonRegions.stream().anyMatch(r -> r.equalsIgnoreCase(region));
            if (!validRegion) {
                issues.add("Region '" + region + "' is not a valid Cameroon region");
                String closest = cameroonRegions.stream()
                        .min(Comparator.comparingInt(r -> levenshtein(r.toLowerCase(), region.toLowerCase())))
                        .orElse(null);
                if (closest != null) {
                    suggestions.add("Did you mean '" + closest + "'?");
                }
                confidence -= 0.2;
            }
        }

        // 4. Country normalization
        String normalizedCountry = country;
        if (country.equalsIgnoreCase("cameroun") || country.equalsIgnoreCase("cm") || country.equalsIgnoreCase("cmr")) {
            normalizedCountry = "Cameroon";
        }

        // Normalize city capitalization
        String normalizedCity = city.isEmpty() ? city :
                city.substring(0, 1).toUpperCase() + city.substring(1).toLowerCase();

        // Normalize region
        String normalizedRegion = region;
        if (!region.isEmpty()) {
            normalizedRegion = cameroonRegions.stream()
                    .filter(r -> r.equalsIgnoreCase(region))
                    .findFirst()
                    .orElse(region);
        }

        confidence = Math.max(0.1, Math.min(1.0, confidence));

        return AddressValidationResponse.builder()
                .valid(issues.isEmpty())
                .confidenceScore(Math.round(confidence * 100.0) / 100.0)
                .normalizedAddress(street)
                .normalizedCity(normalizedCity)
                .normalizedRegion(normalizedRegion)
                .normalizedCountry(normalizedCountry)
                .issues(issues)
                .suggestions(suggestions)
                .build();
    }

    private static int levenshtein(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1), dp[i - 1][j - 1] + cost);
            }
        }
        return dp[a.length()][b.length()];
    }
}
