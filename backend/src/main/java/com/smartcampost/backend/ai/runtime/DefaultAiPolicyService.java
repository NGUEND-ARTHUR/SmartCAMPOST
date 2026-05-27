package com.smartcampost.backend.ai.runtime;

import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class DefaultAiPolicyService implements AiPolicyService {

    @Override
    public AiPolicyDecision evaluate(AiToolDescriptor descriptor, AiToolRequest request) {
        if (descriptor == null) {
            return new AiPolicyDecision(false, false, "Unknown tool");
        }

        AiActorContext actor = request.actor();
        Set<String> permissions = actor != null && actor.permissions() != null ? actor.permissions() : Set.of();
        boolean hasAllPermissions = descriptor.requiredPermissions().stream().allMatch(permissions::contains);
        if (!hasAllPermissions) {
            return new AiPolicyDecision(false, false, "Missing required permissions for " + descriptor.toolName());
        }

        if (descriptor.writeOperation() && request.mode() == AiOperatingMode.REACTIVE) {
            if (!request.approvalGranted() && descriptor.approvalRequired()) {
                return new AiPolicyDecision(false, true, "Reactive mode cannot execute sensitive write action without approval");
            }
            if (!request.ownershipVerified() && descriptor.approvalRequired()) {
                return new AiPolicyDecision(false, true, "Ownership must be validated before a sensitive write action");
            }
        }

        if (descriptor.approvalRequired() && !request.approvalGranted()) {
            return new AiPolicyDecision(false, true, "Action requires human approval");
        }

        return new AiPolicyDecision(true, false, "Allowed");
    }
}
