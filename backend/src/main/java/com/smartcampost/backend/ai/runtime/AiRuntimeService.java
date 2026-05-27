package com.smartcampost.backend.ai.runtime;

import com.smartcampost.backend.dto.ai.ChatRequest;
import com.smartcampost.backend.dto.ai.ChatResponse;

import java.util.List;

public interface AiRuntimeService {

    ChatResponse answer(ChatRequest request);

    AiToolResult executeTool(AiToolRequest request);

    AiRuntimeOutcome processEvent(OperationalEventRequest request);

    List<AiToolDescriptor> listTools();
}
