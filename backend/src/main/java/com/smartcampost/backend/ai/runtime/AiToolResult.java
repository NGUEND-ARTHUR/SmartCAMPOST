package com.smartcampost.backend.ai.runtime;

import java.time.Instant;
import java.util.Map;

public record AiToolResult(
        String toolName,
        boolean success,
        String status,
        String message,
        Map<String, Object> data,
        String auditReference,
        boolean approvalRequired,
        Instant completedAt
) {
    public static AiToolResult pendingApproval(String toolName, String message, Map<String, Object> data, String auditReference) {
        return new AiToolResult(toolName, false, "PENDING_APPROVAL", message, data, auditReference, true, Instant.now());
    }

    public static AiToolResult denied(String toolName, String message, String auditReference) {
        return new AiToolResult(toolName, false, "DENIED", message, Map.of(), auditReference, false, Instant.now());
    }

    public static AiToolResult success(String toolName, String message, Map<String, Object> data, String auditReference) {
        return new AiToolResult(toolName, true, "COMPLETED", message, data, auditReference, false, Instant.now());
    }
}
