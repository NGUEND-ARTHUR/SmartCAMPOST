package com.smartcampost.backend.ai.runtime;

public interface AiPolicyService {
    AiPolicyDecision evaluate(AiToolDescriptor descriptor, AiToolRequest request);
}
