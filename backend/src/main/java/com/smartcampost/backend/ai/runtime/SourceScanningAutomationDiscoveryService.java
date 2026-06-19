package com.smartcampost.backend.ai.runtime;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;
import java.util.stream.Stream;

@Service
public class SourceScanningAutomationDiscoveryService implements ProjectAutomationDiscoveryService {

    private static final Path SOURCE_ROOT = Path.of("src/main/java/com/smartcampost/backend");

    @Override
    public AutomationDiscoveryReport discover() {
        List<SourceSignal> signals = scanSourceSignals();
        Map<String, Integer> domainCounts = new LinkedHashMap<>();
        for (SourceSignal signal : signals) {
            domainCounts.merge(signal.domain(), 1, Integer::sum);
        }

        List<AutomationOpportunity> opportunities = new ArrayList<>();
        addIfPresent(opportunities, signals, "pickup", new AutomationOpportunity(
                "pickup.assignment.optimization",
                "pickup",
                "Pickup services/controllers",
                "PARCEL_CREATED or COURIER_AVAILABLE",
                AiToolName.ASSIGN_COURIER.value(),
                "Recommend nearest eligible courier/agent, require approval before assignment execution.",
                evidence(signals, "pickup"),
                true
        ));
        addIfPresent(opportunities, signals, "delivery", new AutomationOpportunity(
                "delivery.delay.intervention",
                "delivery",
                "Delivery workflow and scan events",
                "DELIVERY_DELAYED",
                AiToolName.GENERATE_REPORT.value(),
                "Detect delayed deliveries from event age/status and generate an operational exception report.",
                evidence(signals, "delivery"),
                false
        ));
        addIfPresent(opportunities, signals, "payment", new AutomationOpportunity(
                "payment.anomaly.review",
                "payment",
                "Payment, refund, MTN and finance services",
                "PAYMENT_FAILED or PAYMENT_RECEIVED",
                AiToolName.VERIFY_PAYMENT.value(),
                "Verify payment state, run anomaly checks, then escalate suspicious patterns to risk.",
                evidence(signals, "payment"),
                false
        ));
        addIfPresent(opportunities, signals, "risk", new AutomationOpportunity(
                "risk.fraud.escalation",
                "risk",
                "Risk, compliance, anomaly and QR verification modules",
                "FRAUD_SUSPECTED",
                AiToolName.DETECT_FRAUD.value(),
                "Create risk alerts from suspicious payment, QR, or parcel behavior without direct database writes.",
                evidence(signals, "risk"),
                false
        ));
        addIfPresent(opportunities, signals, "notification", new AutomationOpportunity(
                "notification.workflow.followup",
                "notification",
                "Notification and support workflows",
                "COURIER_ASSIGNED, DELIVERY_STARTED, DELIVERY_COMPLETED",
                AiToolName.NOTIFY_USER.value(),
                "Notify stakeholders after workflow state changes and AI interventions.",
                evidence(signals, "notification"),
                false
        ));
        addIfPresent(opportunities, signals, "logistics", new AutomationOpportunity(
                "logistics.live.rebalancing",
                "logistics",
                "GPS, map, location, agency and courier modules",
                "SYSTEM_ALERT or COURIER_AVAILABLE",
                AiToolName.GENERATE_REPORT.value(),
                "Use live GPS and inherited parcel locations to detect workload imbalance and route inefficiency.",
                evidence(signals, "logistics"),
                false
        ));

        return new AutomationDiscoveryReport(Instant.now(), signals.size(), domainCounts, opportunities);
    }

    private List<SourceSignal> scanSourceSignals() {
        if (!Files.exists(SOURCE_ROOT)) return List.of();
        List<SourceSignal> signals = new ArrayList<>();
        try (Stream<Path> paths = Files.walk(SOURCE_ROOT)) {
            paths.filter(path -> path.toString().endsWith(".java")).forEach(path -> {
                String fileName = path.getFileName().toString();
                String content;
                try {
                    content = Files.readString(path, StandardCharsets.UTF_8).toLowerCase(Locale.ROOT);
                } catch (IOException ex) {
                    return;
                }
                detectDomain(signals, path, fileName, content, "pickup", List.of("pickup", "assigncourier"));
                detectDomain(signals, path, fileName, content, "delivery", List.of("delivery", "otp", "proof", "delayed"));
                detectDomain(signals, path, fileName, content, "payment", List.of("payment", "refund", "mtn", "orange", "invoice"));
                detectDomain(signals, path, fileName, content, "risk", List.of("risk", "fraud", "compliance", "anomaly"));
                detectDomain(signals, path, fileName, content, "notification", List.of("notification", "support", "ticket", "sms", "email"));
                detectDomain(signals, path, fileName, content, "logistics", List.of("location", "gps", "map", "courier", "agency", "route"));
            });
        } catch (IOException ignored) {
            return signals;
        }
        return signals;
    }

    private void detectDomain(List<SourceSignal> signals, Path path, String fileName, String content, String domain, List<String> keywords) {
        String lowerFile = fileName.toLowerCase(Locale.ROOT);
        boolean matched = keywords.stream().anyMatch(keyword -> lowerFile.contains(keyword) || content.contains(keyword));
        if (matched) {
            signals.add(new SourceSignal(domain, SOURCE_ROOT.relativize(path).toString().replace('\\', '/')));
        }
    }

    private void addIfPresent(List<AutomationOpportunity> opportunities, List<SourceSignal> signals, String domain, AutomationOpportunity opportunity) {
        if (signals.stream().anyMatch(signal -> signal.domain().equals(domain))) {
            opportunities.add(opportunity);
        }
    }

    private List<String> evidence(List<SourceSignal> signals, String domain) {
        return signals.stream()
                .filter(signal -> signal.domain().equals(domain))
                .map(SourceSignal::source)
                .distinct()
                .limit(8)
                .toList();
    }

    private record SourceSignal(String domain, String source) {}
}
