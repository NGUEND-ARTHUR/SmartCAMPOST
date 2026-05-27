package com.smartcampost.backend.ai.runtime;

import java.util.List;

public record AiToolDescriptor(
        String toolName,
        String description,
        AiOperatingMode preferredMode,
        boolean writeOperation,
        boolean approvalRequired,
        List<String> requiredPermissions
) {
    public static AiToolDescriptor from(AiToolName toolName) {
        return new AiToolDescriptor(
                toolName.value(),
                toolName.description(),
                toolName.preferredMode(),
                toolName.writeOperation(),
                toolName.approvalRequired(),
                toolName.requiredPermissions()
        );
    }
}
