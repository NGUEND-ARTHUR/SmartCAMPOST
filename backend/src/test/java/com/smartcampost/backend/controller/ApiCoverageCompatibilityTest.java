package com.smartcampost.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.service.AIService;
import com.smartcampost.backend.service.AgentService;
import com.smartcampost.backend.service.AiAgentRecommendationService;
import com.smartcampost.backend.service.UssdService;
import com.smartcampost.backend.service.orchestrator.AIOrchestrator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AgentController.class, AIController.class, UssdController.class})
@AutoConfigureMockMvc(addFilters = false)
class ApiCoverageCompatibilityTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AgentService agentService;

    @MockitoBean
    private AIService aiService;

    @MockitoBean
    private AiAgentRecommendationService aiAgentRecommendationService;

    @MockitoBean
    private AIOrchestrator aiOrchestrator;

    @MockitoBean
    private UssdService ussdService;

    @Test
    @WithMockUser(roles = "AGENT")
    void agentTaskCompatibilityEndpoints_shouldServeFrontendService() throws Exception {
        mvc.perform(get("/api/agents/me/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").exists());

        mvc.perform(get("/api/agents/tasks/PICKUP-TODAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("PICKUP-TODAY"));

        mvc.perform(patch("/api/agents/tasks/PICKUP-TODAY/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "BLOCKED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("BLOCKED"));

        mvc.perform(post("/api/agents/tasks/PICKUP-TODAY/accept"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        mvc.perform(post("/api/agents/tasks/PICKUP-TODAY/complete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void aiFeedbackAndUssdSessions_shouldHaveUiBackedEndpoints() throws Exception {
        mvc.perform(post("/api/ai/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "messageContent", "Useful answer",
                                "feedback", "positive"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECEIVED"));

        mvc.perform(get("/api/ussd/sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sessionId").exists());
    }
}
