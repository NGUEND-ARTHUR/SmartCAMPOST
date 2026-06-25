package com.smartcampost.backend.ai.runtime;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.dto.ai.ChatRequest;
import com.smartcampost.backend.dto.ai.ChatResponse;
import com.smartcampost.backend.model.AiDecisionLog;
import com.smartcampost.backend.model.AiExecutionLog;
import com.smartcampost.backend.model.AiAgentState;
import com.smartcampost.backend.model.enums.AiExecutionStatus;
import com.smartcampost.backend.model.enums.AiModuleType;
import com.smartcampost.backend.model.enums.AiSubjectType;
import com.smartcampost.backend.model.enums.NotificationChannel;
import com.smartcampost.backend.model.enums.NotificationType;
import com.smartcampost.backend.model.enums.RiskAlertType;
import com.smartcampost.backend.model.enums.RiskSeverity;
import com.smartcampost.backend.repository.AiAgentStateRepository;
import com.smartcampost.backend.repository.AiDecisionLogRepository;
import com.smartcampost.backend.repository.AiExecutionLogRepository;
import com.smartcampost.backend.repository.ApprovalRequestRepository;
import com.smartcampost.backend.service.AIService;
import com.smartcampost.backend.service.AnalyticsService;
import com.smartcampost.backend.service.DeliveryService;
import com.smartcampost.backend.service.NotificationService;
import com.smartcampost.backend.service.ParcelService;
import com.smartcampost.backend.service.PaymentService;
import com.smartcampost.backend.service.AssignmentService;
import com.smartcampost.backend.service.ReportingService;
import com.smartcampost.backend.service.RiskService;
import com.smartcampost.backend.sse.SseEmitters;
import com.smartcampost.backend.dto.delivery.CompleteDeliveryRequest;
import com.smartcampost.backend.dto.delivery.PickupAtAgencyRequest;
import com.smartcampost.backend.dto.delivery.RescheduleDeliveryRequest;
import com.smartcampost.backend.dto.delivery.ReturnToSenderRequest;
import com.smartcampost.backend.dto.delivery.StartDeliveryRequest;
import com.smartcampost.backend.dto.notification.TriggerNotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DefaultAiRuntimeService implements AiRuntimeService {

    private static final String SYSTEM_ROLE = "SYSTEM";

    private final AIService aiService;
    private final ParcelService parcelService;
    private final DeliveryService deliveryService;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final ReportingService reportingService;
    private final RiskService riskService;
    private final AnalyticsService analyticsService;
    private final AiPolicyService aiPolicyService;
    private final AiDecisionLogRepository aiDecisionLogRepository;
    private final AiExecutionLogRepository aiExecutionLogRepository;
    private final AiAgentStateRepository aiAgentStateRepository;
    private final SseEmitters sseEmitters;
    private final ObjectMapper objectMapper;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final AssignmentService assignmentService;

    @Override
    public ChatResponse answer(ChatRequest request) {
        return aiService.processChat(request);
    }

    @Override
    public List<AiToolDescriptor> listTools() {
        List<AiToolDescriptor> descriptors = new ArrayList<>();
        for (AiToolName toolName : AiToolName.values()) {
            descriptors.add(AiToolDescriptor.from(toolName));
        }
        return descriptors;
    }

    @Override
    public AiToolResult executeTool(AiToolRequest request) {
        Objects.requireNonNull(request, "request is required");
        AiToolName toolName = AiToolName.fromValue(request.toolName());
        AiToolDescriptor descriptor = AiToolDescriptor.from(toolName);
        AiPolicyDecision decision = aiPolicyService.evaluate(descriptor, request);
        UUID targetId = resolveTargetId(request.parameters(), request.actor());
        AiSubjectType subjectType = resolveSubjectType(toolName, request.parameters());
        AiModuleType moduleType = resolveModuleType(toolName);

        AiDecisionLog decisionLog = persistDecision(toolName, request, targetId, subjectType, moduleType, decision);
        sseEmitters.emitAiEvent("ai-decision", request.correlationId(), mapOf(
                "tool", toolName.value(),
                "decisionOutcome", decision.allowed() ? (request.approvalGranted() ? "APPROVED" : "ALLOWED") : (decision.requiresApproval() ? "PENDING_APPROVAL" : "DENIED"),
                "reason", decision.reason(),
                "subjectType", subjectType.name(),
                "targetId", targetId != null ? targetId.toString() : null
        ));

        if (!decision.allowed()) {
            persistExecution(toolName, request, targetId, subjectType, moduleType, AiExecutionStatus.FAILED, decision.reason(), null, decisionLog);
            AiToolResult result;
            if (decision.requiresApproval()) {
                // persist an approval request for human review
                try {
                    com.smartcampost.backend.approval.ApprovalRequest approval = new com.smartcampost.backend.approval.ApprovalRequest();
                    approval.setToolName(toolName.value());
                    if (request.actor() != null && request.actor().actorId() != null) approval.setActorId(request.actor().actorId().toString());
                    if (request.actor() != null) approval.setActorRole(request.actor().role());
                    java.util.Map<String, Object> payload = new java.util.LinkedHashMap<>();
                    payload.put("parameters", request.parameters());
                    payload.put("tool", toolName.value());
                    payload.put("actor", request.actor());
                    approval.setParametersJson(objectMapper.writeValueAsString(payload));
                    approval.setReason(decision.reason());
                    approval.setProcessed(false);
                    approval.setApproved(false);
                    // save via repository
                    approvalRequestRepository.save(approval);
                    result = AiToolResult.pendingApproval(toolName.value(), decision.reason(), mapOf("tool", toolName.value()), decisionLog.getId().toString());
                } catch (Exception ex) {
                    log.error("Failed to enqueue approval request", ex);
                    result = AiToolResult.denied(toolName.value(), "Failed to enqueue approval request", decisionLog.getId().toString());
                }
            } else {
                result = AiToolResult.denied(toolName.value(), decision.reason(), decisionLog.getId().toString());
            }
            sseEmitters.emitAiEvent("ai-execution", request.correlationId(), result);
            return result;
        }

        AiToolResult result = switch (toolName) {
            case TRACK_PARCEL -> executeTrackParcel(request, decisionLog);
            case ASSIGN_COURIER -> executeAssignCourier(request, decisionLog);
            case UPDATE_DELIVERY_STATUS -> executeUpdateDeliveryStatus(request, decisionLog);
            case VERIFY_PAYMENT -> executeVerifyPayment(request, decisionLog);
            case GENERATE_REPORT -> executeGenerateReport(request, decisionLog);
            case NOTIFY_USER -> executeNotifyUser(request, decisionLog);
            case DETECT_FRAUD -> executeDetectFraud(request, decisionLog);
        };

        persistExecution(toolName, request, targetId, subjectType, moduleType,
                result.success() ? AiExecutionStatus.COMPLETED : AiExecutionStatus.FAILED,
                result.message(), result.data(), decisionLog);
        updateAgentState(moduleType, subjectType, targetId, result.success());
        sseEmitters.emitAiEvent("ai-execution", request.correlationId(), result);
        return result;
    }

    @Override
    public AiRuntimeOutcome processEvent(OperationalEventRequest request) {
        Objects.requireNonNull(request, "request is required");
        List<AiToolResult> actions = new ArrayList<>();
        OperationalEventType eventType = request.eventType() != null ? request.eventType() : OperationalEventType.SYSTEM_ALERT;

        switch (eventType) {
            case PARCEL_CREATED -> {
                if (isHighValueParcel(request.payload())) {
                        actions.add(executeTool(buildToolRequest(AiToolName.DETECT_FRAUD, request, mapOf(
                            "type", RiskAlertType.AML.name(),
                            "severity", RiskSeverity.MEDIUM.name(),
                            "description", "High-value parcel created"
                    ))));
                }
                if (isCodParcel(request.payload()) || isHomeDelivery(request.payload())) {
                        actions.add(executeTool(buildToolRequest(AiToolName.NOTIFY_USER, request, mapOf(
                            "channel", NotificationChannel.EMAIL.name(),
                            "type", NotificationType.AI_RECOMMENDATION.name(),
                            "subject", "Parcel created",
                            "message", "Your parcel has been registered and is now under automated monitoring."
                    ))));
                }
            }
                    case COURIER_AVAILABLE -> actions.add(executeTool(buildToolRequest(AiToolName.ASSIGN_COURIER, request, mapOf(
                    "parcelId", request.entityId(),
                    "reason", "Courier availability detected from the event stream"
            ))));
                    case COURIER_ASSIGNED, DELIVERY_STARTED -> actions.add(executeTool(buildToolRequest(AiToolName.NOTIFY_USER, request, mapOf(
                    "channel", NotificationChannel.SMS.name(),
                    "type", NotificationType.AI_RECOMMENDATION.name(),
                    "subject", eventType.name(),
                    "message", "A delivery operation has progressed to " + eventType.name().toLowerCase(Locale.ROOT).replace('_', ' ') + "."
            ))));
            case DELIVERY_DELAYED -> {
                    actions.add(executeTool(buildToolRequest(AiToolName.GENERATE_REPORT, request, mapOf(
                        "reportKind", "operational",
                        "from", LocalDate.now().minusDays(7).toString(),
                        "to", LocalDate.now().toString()
                ))));
                    actions.add(executeTool(buildToolRequest(AiToolName.NOTIFY_USER, request, mapOf(
                        "channel", NotificationChannel.SMS.name(),
                        "type", NotificationType.DELAY_WARNING.name(),
                        "subject", "Delivery delay detected",
                        "message", "The AI runtime detected a delivery delay and raised an operational review."
                ))));
            }
                    case DELIVERY_COMPLETED, PAYMENT_RECEIVED -> actions.add(executeTool(buildToolRequest(AiToolName.NOTIFY_USER, request, mapOf(
                    "channel", NotificationChannel.SMS.name(),
                    "type", NotificationType.PARCEL_DELIVERED.name(),
                    "subject", eventType.name(),
                    "message", "The operational event was processed successfully: " + eventType.name()
            ))));
                    case PAYMENT_FAILED -> actions.add(executeTool(buildToolRequest(AiToolName.DETECT_FRAUD, request, mapOf(
                    "type", RiskAlertType.CREDIT.name(),
                    "severity", RiskSeverity.HIGH.name(),
                    "description", "Payment failure observed in the event stream"
            ))));
                    case FRAUD_SUSPECTED -> actions.add(executeTool(buildToolRequest(AiToolName.DETECT_FRAUD, request, mapOf(
                    "type", RiskAlertType.OTHER.name(),
                    "severity", RiskSeverity.CRITICAL.name(),
                    "description", "Potential fraud detected from event stream"
            ))));
                    case SYSTEM_ALERT -> actions.add(executeTool(buildToolRequest(AiToolName.GENERATE_REPORT, request, mapOf(
                    "reportKind", "operational",
                    "from", LocalDate.now().minusDays(1).toString(),
                    "to", LocalDate.now().toString()
            ))));
        }

        String summary = actions.stream()
                .map(AiToolResult::message)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(" | "));
        boolean interventionRequired = actions.stream().anyMatch(result -> result.approvalRequired() || !result.success());

        AiRuntimeOutcome outcome = new AiRuntimeOutcome(eventType, summary.isBlank() ? "Event processed" : summary, interventionRequired, actions, Instant.now());
        sseEmitters.emitAiEvent("ai-runtime", request.correlationId(), outcome);
        return outcome;
    }

    private AiToolResult executeTrackParcel(AiToolRequest request, AiDecisionLog decisionLog) {
        Map<String, Object> parameters = safeParameters(request);
        UUID parcelId = readUuid(parameters, "parcelId");
        String trackingRef = readString(parameters, "trackingRef");
        Object parcel;
        if (trackingRef != null && !trackingRef.isBlank()) {
            parcel = parcelService.getParcelByTracking(trackingRef);
        } else if (parcelId != null) {
            parcel = parcelService.getParcelById(parcelId);
        } else {
            return AiToolResult.denied(AiToolName.TRACK_PARCEL.value(), "parcelId or trackingRef is required", decisionLog.getId().toString());
        }

        return AiToolResult.success(
                AiToolName.TRACK_PARCEL.value(),
                "Parcel tracked successfully",
                mapOf("parcel", parcel),
                decisionLog.getId().toString()
        );
    }

    private AiToolResult executeAssignCourier(AiToolRequest request, AiDecisionLog decisionLog) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("parcelId", readUuid(safeParameters(request), "parcelId"));
        data.put("courierId", readUuid(safeParameters(request), "courierId"));
        data.put("reason", readString(safeParameters(request), "reason"));
        UUID parcelId = (UUID) data.get("parcelId");
        UUID courierId = (UUID) data.get("courierId");
        String reason = (String) data.get("reason");

        if (courierId == null) {
            return new AiToolResult(
                    AiToolName.ASSIGN_COURIER.value(),
                    true,
                    "RECOMMENDED",
                    "Courier assignment recommendation generated; no courierId provided",
                    data,
                    decisionLog.getId().toString(),
                    true,
                    Instant.now()
            );
        }

        // If approval was granted (by human reviewer) or the request indicates ownership/approval, execute assignment
        if (request.approvalGranted()) {
            try {
                var resp = assignmentService.assignCourier(parcelId, courierId, reason);
                return AiToolResult.success(AiToolName.ASSIGN_COURIER.value(), "Courier assigned and delivery started", mapOf("delivery", resp), decisionLog.getId().toString());
            } catch (Exception ex) {
                return AiToolResult.denied(AiToolName.ASSIGN_COURIER.value(), "Assignment failed: " + ex.getMessage(), decisionLog.getId().toString());
            }
        }

        data.put("status", "RECOMMENDED");
        return new AiToolResult(
                AiToolName.ASSIGN_COURIER.value(),
                true,
                "RECOMMENDED",
                "Courier assignment recommendation generated; execution requires approval or explicit approval flag",
                data,
                decisionLog.getId().toString(),
                true,
                Instant.now()
        );
    }

    private AiToolResult executeUpdateDeliveryStatus(AiToolRequest request, AiDecisionLog decisionLog) {
        Map<String, Object> parameters = safeParameters(request);
        String action = Optional.ofNullable(readString(parameters, "action")).orElse("STARTED").toUpperCase(Locale.ROOT);
        UUID parcelId = readUuid(parameters, "parcelId");

        if (parcelId == null) {
            return AiToolResult.denied(AiToolName.UPDATE_DELIVERY_STATUS.value(), "parcelId is required", decisionLog.getId().toString());
        }

        switch (action) {
            case "STARTED" -> {
                StartDeliveryRequest startDeliveryRequest = new StartDeliveryRequest();
                startDeliveryRequest.setParcelId(parcelId);
                startDeliveryRequest.setTrackingRef(readString(parameters, "trackingRef"));
                startDeliveryRequest.setCourierId(readUuid(parameters, "courierId"));
                startDeliveryRequest.setLatitude(readDouble(parameters, "latitude"));
                startDeliveryRequest.setLongitude(readDouble(parameters, "longitude"));
                startDeliveryRequest.setNotes(readString(parameters, "notes"));
                return AiToolResult.success(AiToolName.UPDATE_DELIVERY_STATUS.value(), "Delivery started", mapOf("result", deliveryService.startDelivery(startDeliveryRequest)), decisionLog.getId().toString());
            }
            case "COMPLETED" -> {
                CompleteDeliveryRequest completeDeliveryRequest = new CompleteDeliveryRequest();
                completeDeliveryRequest.setParcelId(parcelId);
                completeDeliveryRequest.setTrackingRef(readString(parameters, "trackingRef"));
                completeDeliveryRequest.setOtpCode(readString(parameters, "otpCode"));
                completeDeliveryRequest.setNotes(readString(parameters, "notes"));
                completeDeliveryRequest.setLatitude(readDouble(parameters, "latitude"));
                completeDeliveryRequest.setLongitude(readDouble(parameters, "longitude"));
                completeDeliveryRequest.setPaymentCollected(Boolean.TRUE.equals(parameters.get("paymentCollected")));
                completeDeliveryRequest.setAmountCollected(readDouble(parameters, "amountCollected"));
                completeDeliveryRequest.setPaymentMethod(readString(parameters, "paymentMethod"));
                completeDeliveryRequest.setReceiverName(readString(parameters, "receiverName"));
                completeDeliveryRequest.setPhotoUrl(readString(parameters, "photoUrl"));
                return AiToolResult.success(AiToolName.UPDATE_DELIVERY_STATUS.value(), "Delivery completed", mapOf("result", deliveryService.completeDelivery(completeDeliveryRequest)), decisionLog.getId().toString());
            }
            case "FAILED" -> {
                String reason = Optional.ofNullable(readString(parameters, "reason")).orElse("Delivery failed");
                return AiToolResult.success(AiToolName.UPDATE_DELIVERY_STATUS.value(), "Delivery failure recorded", mapOf("result", deliveryService.markDeliveryFailed(parcelId, reason, readDouble(parameters, "latitude"), readDouble(parameters, "longitude"), readString(parameters, "notes"))), decisionLog.getId().toString());
            }
            case "RESCHEDULED" -> {
                RescheduleDeliveryRequest rescheduleRequest = new RescheduleDeliveryRequest();
                String newDate = readString(parameters, "newDate");
                if (newDate != null && !newDate.isBlank()) {
                    rescheduleRequest.setNewDate(LocalDate.parse(newDate));
                }
                rescheduleRequest.setTimeWindow(readString(parameters, "timeWindow"));
                rescheduleRequest.setReason(readString(parameters, "reason"));
                rescheduleRequest.setContactPhone(readString(parameters, "contactPhone"));
                rescheduleRequest.setDeliveryNotes(readString(parameters, "deliveryNotes"));
                rescheduleRequest.setLatitude(readDouble(parameters, "latitude"));
                rescheduleRequest.setLongitude(readDouble(parameters, "longitude"));
                return AiToolResult.success(AiToolName.UPDATE_DELIVERY_STATUS.value(), "Delivery rescheduled", mapOf("result", deliveryService.rescheduleDelivery(parcelId, rescheduleRequest)), decisionLog.getId().toString());
            }
            case "PICKED_UP_AT_AGENCY" -> {
                PickupAtAgencyRequest pickupRequest = new PickupAtAgencyRequest();
                pickupRequest.setParcelId(parcelId);
                pickupRequest.setTrackingRef(readString(parameters, "trackingRef"));
                pickupRequest.setOtpCode(readString(parameters, "otpCode"));
                pickupRequest.setLatitude(readDouble(parameters, "latitude"));
                pickupRequest.setLongitude(readDouble(parameters, "longitude"));
                pickupRequest.setNotes(readString(parameters, "notes"));
                return AiToolResult.success(AiToolName.UPDATE_DELIVERY_STATUS.value(), "Agency pickup completed", mapOf("result", deliveryService.pickupAtAgency(pickupRequest)), decisionLog.getId().toString());
            }
            case "RETURNED" -> {
                ReturnToSenderRequest returnRequest = new ReturnToSenderRequest();
                returnRequest.setReason(readString(parameters, "reason"));
                returnRequest.setNotes(readString(parameters, "notes"));
                returnRequest.setLatitude(readDouble(parameters, "latitude"));
                returnRequest.setLongitude(readDouble(parameters, "longitude"));
                return AiToolResult.success(AiToolName.UPDATE_DELIVERY_STATUS.value(), "Return to sender executed", mapOf("result", deliveryService.returnToSender(parcelId, returnRequest)), decisionLog.getId().toString());
            }
            default -> {
                return AiToolResult.denied(AiToolName.UPDATE_DELIVERY_STATUS.value(), "Unsupported delivery action: " + action, decisionLog.getId().toString());
            }
        }
    }

    private AiToolResult executeVerifyPayment(AiToolRequest request, AiDecisionLog decisionLog) {
        Map<String, Object> parameters = safeParameters(request);
        UUID paymentId = readUuid(parameters, "paymentId");
        UUID parcelId = readUuid(parameters, "parcelId");
        Map<String, Object> data = new LinkedHashMap<>();

        if (paymentId != null) {
            data.put("payment", paymentService.getPaymentById(paymentId));
            data.put("anomalyCheck", analyticsService.checkPaymentAnomaly(paymentId));
        }
        if (parcelId != null) {
            data.put("summary", paymentService.getPaymentSummary(parcelId));
        }

        if (data.isEmpty()) {
            return AiToolResult.denied(AiToolName.VERIFY_PAYMENT.value(), "paymentId or parcelId is required", decisionLog.getId().toString());
        }

        return AiToolResult.success(AiToolName.VERIFY_PAYMENT.value(), "Payment verification completed", data, decisionLog.getId().toString());
    }

    private AiToolResult executeGenerateReport(AiToolRequest request, AiDecisionLog decisionLog) {
        Map<String, Object> parameters = safeParameters(request);
        String reportKind = Optional.ofNullable(readString(parameters, "reportKind")).orElse("operational").toLowerCase(Locale.ROOT);
        LocalDate from = readDate(parameters, "from", LocalDate.now().minusDays(7));
        LocalDate to = readDate(parameters, "to", LocalDate.now());
        Map<String, Object> data = new LinkedHashMap<>();

        switch (reportKind) {
            case "finance" -> data.put("report", reportingService.getFinanceSummary(from, to));
            case "zone" -> data.put("report", reportingService.getParcelVolumeByZone(from, to));
            default -> data.put("report", reportingService.getOperationalDashboard(from, to));
        }

        return AiToolResult.success(AiToolName.GENERATE_REPORT.value(), "Report generated", data, decisionLog.getId().toString());
    }

    private AiToolResult executeNotifyUser(AiToolRequest request, AiDecisionLog decisionLog) {
        Map<String, Object> parameters = safeParameters(request);
        TriggerNotificationRequest notifyRequest = new TriggerNotificationRequest();
        notifyRequest.setChannel(NotificationChannel.valueOf(Optional.ofNullable(readString(parameters, "channel")).orElse("EMAIL").toUpperCase(Locale.ROOT)));
        notifyRequest.setType(NotificationType.valueOf(Optional.ofNullable(readString(parameters, "type")).orElse(NotificationType.AI_RECOMMENDATION.name()).toUpperCase(Locale.ROOT)));
        notifyRequest.setParcelId(readUuid(parameters, "parcelId"));
        notifyRequest.setPickupId(readUuid(parameters, "pickupId"));
        notifyRequest.setRecipientPhone(readString(parameters, "recipientPhone"));
        notifyRequest.setRecipientEmail(readString(parameters, "recipientEmail"));
        notifyRequest.setSubject(Optional.ofNullable(readString(parameters, "subject")).orElse("SmartCAMPOST AI notification"));
        notifyRequest.setMessage(Optional.ofNullable(readString(parameters, "message")).orElse("A SmartCAMPOST AI event was processed."));
        return AiToolResult.success(AiToolName.NOTIFY_USER.value(), "Notification sent", mapOf("notification", notificationService.triggerNotification(notifyRequest)), decisionLog.getId().toString());
    }

    private AiToolResult executeDetectFraud(AiToolRequest request, AiDecisionLog decisionLog) {
        Map<String, Object> parameters = safeParameters(request);
        RiskAlertType type = RiskAlertType.valueOf(Optional.ofNullable(readString(parameters, "type")).orElse(RiskAlertType.OTHER.name()).toUpperCase(Locale.ROOT));
        RiskSeverity severity = RiskSeverity.valueOf(Optional.ofNullable(readString(parameters, "severity")).orElse(RiskSeverity.MEDIUM.name()).toUpperCase(Locale.ROOT));
        String description = Optional.ofNullable(readString(parameters, "description")).orElse("AI-detected risk event");
        return AiToolResult.success(AiToolName.DETECT_FRAUD.value(), "Risk alert recorded", mapOf("alert", riskService.createRiskAlert(type, severity, description)), decisionLog.getId().toString());
    }

    private AiToolRequest buildToolRequest(AiToolName toolName, OperationalEventRequest eventRequest, Map<String, Object> parameters) {
        return new AiToolRequest(
                toolName.preferredMode(),
                toolName.value(),
                eventRequest.actor() != null ? eventRequest.actor() : systemActor(),
                parameters,
                true,
                false,
                eventRequest.correlationId(),
                eventRequest.correlationId(),
                eventRequest.eventType() != null ? eventRequest.eventType().name() : null,
                Instant.now()
        );
    }

    private AiDecisionLog persistDecision(AiToolName toolName, AiToolRequest request, UUID targetId, AiSubjectType subjectType, AiModuleType moduleType, AiPolicyDecision decision) {
        AiDecisionLog decisionLog = AiDecisionLog.builder()
                .moduleType(moduleType)
                .decisionType(toolName.value())
                .subjectType(subjectType)
                .subjectId(targetId)
                .inputData(writeJson(mapOf(
                        "tool", toolName.value(),
                        "mode", request.mode().name(),
                        "parameters", safeParameters(request),
                        "approvalGranted", request.approvalGranted(),
                        "ownershipVerified", request.ownershipVerified(),
                        "sourceEventType", request.sourceEventType()
                )))
                .decisionOutcome(decision.allowed() ? (request.approvalGranted() ? "APPROVED" : "ALLOWED") : (decision.requiresApproval() ? "PENDING_APPROVAL" : "DENIED"))
                .confidenceScore(decision.allowed() ? 0.95f : 0.25f)
                .reasoning(decision.reason())
                .build();
        return aiDecisionLogRepository.save(decisionLog);
    }

    private void persistExecution(AiToolName toolName, AiToolRequest request, UUID targetId, AiSubjectType subjectType, AiModuleType moduleType, AiExecutionStatus status, String message, Map<String, Object> data, AiDecisionLog decisionLog) {
        AiExecutionLog executionLog = AiExecutionLog.builder()
                .decision(decisionLog)
                .actionType(toolName.value())
                .targetType(subjectType)
                .targetId(targetId)
                .executionStatus(status)
                .completedAt(Instant.now())
                .resultSummary(message)
                .rollbackData(writeJson(data != null ? data : Map.of()))
                .build();
        aiExecutionLogRepository.save(executionLog);
    }

    private void updateAgentState(AiModuleType moduleType, AiSubjectType subjectType, UUID targetId, boolean success) {
        AiAgentState state = aiAgentStateRepository
                .findByModuleTypeAndSubjectTypeAndSubjectId(moduleType, subjectType, targetId)
                .orElseGet(() -> AiAgentState.builder()
                        .moduleType(moduleType)
                        .subjectType(subjectType)
                        .subjectId(targetId)
                        .confidenceScore(0.5f)
                        .evaluationCount(0)
                        .build());
        state.setEvaluationCount((state.getEvaluationCount() != null ? state.getEvaluationCount() : 0) + 1);
        state.setLastEvaluationAt(Instant.now());
        state.setConfidenceScore(success ? 0.9f : Math.max(0.1f, state.getConfidenceScore() - 0.1f));
        state.setStateData(writeJson(mapOf(
                "lastToolSuccess", success,
                "updatedAt", Instant.now().toString()
        )));
        aiAgentStateRepository.save(state);
    }

    private AiActorContext systemActor() {
        return new AiActorContext(null, SYSTEM_ROLE, SYSTEM_ROLE, Set.of("ai:system", "notification:send", "risk:write", "report:read", "parcel:read"));
    }

    private Map<String, Object> safeParameters(AiToolRequest request) {
        return request.parameters() != null ? request.parameters() : Map.of();
    }

    private UUID resolveTargetId(Map<String, Object> parameters, AiActorContext actor) {
        UUID target = readUuid(parameters, "entityId");
        if (target == null) target = readUuid(parameters, "parcelId");
        if (target == null) target = readUuid(parameters, "paymentId");
        if (target == null) target = readUuid(parameters, "courierId");
        if (target == null) target = readUuid(parameters, "agencyId");
        if (target == null) target = actor != null ? actor.actorId() : null;
        if (target == null) target = UUID.randomUUID();
        return target;
    }

    private AiSubjectType resolveSubjectType(AiToolName toolName, Map<String, Object> parameters) {
        if (toolName == AiToolName.VERIFY_PAYMENT) return AiSubjectType.PAYMENT;
        if (toolName == AiToolName.DETECT_FRAUD) return AiSubjectType.SYSTEM;
        if (toolName == AiToolName.GENERATE_REPORT) return AiSubjectType.SYSTEM;
        if (toolName == AiToolName.ASSIGN_COURIER) return AiSubjectType.COURIER;
        if (toolName == AiToolName.NOTIFY_USER) return AiSubjectType.CLIENT;
        if (toolName == AiToolName.TRACK_PARCEL || toolName == AiToolName.UPDATE_DELIVERY_STATUS) return AiSubjectType.PARCEL;
        return AiSubjectType.SYSTEM;
    }

    private AiModuleType resolveModuleType(AiToolName toolName) {
        return switch (toolName) {
            case ASSIGN_COURIER -> AiModuleType.COURIER;
            case DETECT_FRAUD -> AiModuleType.RISK;
            case GENERATE_REPORT, VERIFY_PAYMENT -> AiModuleType.PREDICTIVE;
            case TRACK_PARCEL, UPDATE_DELIVERY_STATUS, NOTIFY_USER -> AiModuleType.GENERAL;
        };
    }

    private boolean isHighValueParcel(Map<String, Object> payload) {
        Double declaredValue = readDouble(payload, "declaredValue");
        return declaredValue != null && declaredValue >= 500000D;
    }

    private boolean isCodParcel(Map<String, Object> payload) {
        String paymentOption = readString(payload, "paymentOption");
        return paymentOption != null && paymentOption.equalsIgnoreCase("COD");
    }

    private boolean isHomeDelivery(Map<String, Object> payload) {
        String deliveryOption = readString(payload, "deliveryOption");
        return deliveryOption != null && deliveryOption.equalsIgnoreCase("HOME");
    }

    private UUID readUuid(Map<String, Object> parameters, String key) {
        Object value = parameters.get(key);
        if (value == null) return null;
        if (value instanceof UUID uuid) return uuid;
        String text = String.valueOf(value).trim();
        if (text.isBlank()) return null;
        try {
            return UUID.fromString(text);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String readString(Map<String, Object> parameters, String key) {
        Object value = parameters.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private Double readDouble(Map<String, Object> parameters, String key) {
        Object value = parameters.get(key);
        if (value == null) return null;
        if (value instanceof Number number) return number.doubleValue();
        String text = String.valueOf(value).trim();
        if (text.isBlank()) return null;
        try {
            return Double.parseDouble(text);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private LocalDate readDate(Map<String, Object> parameters, String key, LocalDate defaultValue) {
        String value = readString(parameters, key);
        if (value == null || value.isBlank()) return defaultValue;
        return LocalDate.parse(value);
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return String.valueOf(value);
        }
    }

    private Map<String, Object> mapOf(Object... entries) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i + 1 < entries.length; i += 2) {
            map.put(String.valueOf(entries[i]), entries[i + 1]);
        }
        return map;
    }
}
