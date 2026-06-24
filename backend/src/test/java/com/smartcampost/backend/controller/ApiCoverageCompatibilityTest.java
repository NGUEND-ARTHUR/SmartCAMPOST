package com.smartcampost.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.model.AiFeedback;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.AiFeedbackRepository;
import com.smartcampost.backend.repository.CourierRepository;
import com.smartcampost.backend.repository.ParcelRepository;
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

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    @MockitoBean
    private ParcelRepository parcelRepository;

    @MockitoBean
    private CourierRepository courierRepository;

    @MockitoBean
    private AiFeedbackRepository aiFeedbackRepository;

    @Test
    @WithMockUser(roles = "AGENT")
    void agentTaskCompatibilityEndpoints_shouldServeFrontendService() throws Exception {
        Parcel parcel = Parcel.builder()
                .id(UUID.randomUUID())
                .trackingRef("SCP-TEST-001")
                .status(ParcelStatus.CREATED)
                .build();

        when(parcelRepository.findByStatusIn(any())).thenReturn(List.of(parcel));
        when(parcelRepository.findById(any())).thenReturn(Optional.of(parcel));

        mvc.perform(get("/api/agents/me/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].parcelId").exists());

        mvc.perform(get("/api/agents/tasks/" + parcel.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingRef").value("SCP-TEST-001"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void aiFeedbackAndUssdSessions_shouldHaveUiBackedEndpoints() throws Exception {
        when(aiFeedbackRepository.save(any(AiFeedback.class))).thenAnswer(invocation -> {
            AiFeedback fb = invocation.getArgument(0);
            if (fb.getId() == null) fb.setId(UUID.randomUUID());
            return fb;
        });

        mvc.perform(post("/api/ai/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "messageContent", "Useful answer",
                                "feedback", "positive"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SAVED"));

        mvc.perform(get("/api/ussd/sessions"))
                .andExpect(status().isOk());
    }
}
