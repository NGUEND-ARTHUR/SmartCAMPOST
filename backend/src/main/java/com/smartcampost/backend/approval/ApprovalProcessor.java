package com.smartcampost.backend.approval;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.ai.runtime.AiActorContext;
import com.smartcampost.backend.ai.runtime.AiOperatingMode;
import com.smartcampost.backend.ai.runtime.AiToolRequest;
import com.smartcampost.backend.ai.runtime.AiToolResult;
import com.smartcampost.backend.ai.runtime.AiRuntimeService;
import com.smartcampost.backend.repository.ApprovalRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApprovalProcessor {

    private final ApprovalRequestRepository approvalRequestRepository;
    private final AiRuntimeService aiRuntimeService;
    private final ObjectMapper objectMapper;

    @Scheduled(fixedDelayString = "5000")
    @Transactional
    public void poll() {
        List<ApprovalRequest> pending = approvalRequestRepository.findByProcessedTrueAndHandledFalse();
        if (pending.isEmpty()) return;
        for (ApprovalRequest req : pending) {
            try {
                if (!req.isProcessed()) continue;
                if (req.isHandled()) continue;

                Map<String, Object> payload = objectMapper.readValue(Optional.ofNullable(req.getParametersJson()).orElse("{}"), new TypeReference<>() {});
                // Build actor
                UUID actorId = null;
                if (req.getActorId() != null) {
                    try { actorId = UUID.fromString(req.getActorId()); } catch (IllegalArgumentException e) {
                        log.warn("Approval request {}: invalid actorId '{}', proceeding without actor", req.getId(), req.getActorId());
                    }
                }
                AiActorContext actor = new AiActorContext(actorId, null, req.getActorRole(), Set.of());

                Object rawParams = payload.getOrDefault("parameters", Collections.emptyMap());
                @SuppressWarnings("unchecked")
                Map<String, Object> params = rawParams instanceof Map<?, ?> map
                        ? (Map<String, Object>) map
                        : Collections.emptyMap();
                String tool = (String) payload.getOrDefault("tool", req.getToolName());

                AiToolRequest toolRequest = new AiToolRequest(AiOperatingMode.REACTIVE, tool, actor, params, true, req.isApproved(), req.getId().toString(), UUID.randomUUID().toString(), null, java.time.Instant.now());

                if (req.isApproved()) {
                    AiToolResult result = aiRuntimeService.executeTool(toolRequest);
                    log.info("Processed approved request {} -> result {}", req.getId(), result.message());
                } else {
                    log.info("Approval denied for request {}", req.getId());
                }

                req.setHandled(true);
                approvalRequestRepository.save(req);
            } catch (Exception e) {
                log.error("Error processing approval request {}", req.getId(), e);
            }
        }
    }
}
