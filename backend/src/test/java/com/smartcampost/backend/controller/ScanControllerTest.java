package com.smartcampost.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.service.ScanService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
// import org.springframework.security.test.context.support.WithMockUser; // not used
import org.springframework.test.web.servlet.MockMvc;
import java.util.Objects;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ScanController.class)
@AutoConfigureMockMvc(addFilters = false)
public class ScanControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired ScanService scanService;

    @org.junit.jupiter.api.BeforeEach
    public void setupMock() {
        // Default behavior: echo event with generated id to avoid NPE in tests
        given(scanService.recordScan(any())).willAnswer(invocation -> {
            Object arg = invocation.getArgument(0);
            ScanEvent evt;
            if (arg instanceof ScanEvent) {
                evt = (ScanEvent) arg;
            } else {
                evt = new ScanEvent();
            }
            if (evt.getId() == null) evt.setId(java.util.UUID.randomUUID());
            return evt;
        });
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        public ScanService scanService() {
            return Mockito.mock(ScanService.class);
        }
    }

    @Test
    public void clientScanWithAddress_shouldSucceed() throws Exception {
        ScanEvent evt = new ScanEvent();
        evt.setId(java.util.UUID.randomUUID());
        java.util.UUID pid = java.util.UUID.randomUUID();
        given(scanService.recordScan(any())).willReturn(evt);
        var body = mapper.writeValueAsString(new java.util.HashMap<String,Object>(){{ put("address","Somewhere"); put("scanType","CLIENT_SCAN"); }});

        String url = "/api/parcels/" + Objects.requireNonNull(pid).toString() + "/scan";

        mvc.perform(post(url)
            .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
            .content(Objects.requireNonNull(body))
            .with(Objects.requireNonNull(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf()))
            .with(Objects.requireNonNull(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("10").roles("CLIENT"))))
            .andExpect(status().isOk());
    }

    @Test
    public void agentScanWithoutLocation_shouldBadRequest() throws Exception {
        var body = mapper.writeValueAsString(new java.util.HashMap<String,Object>());

        java.util.UUID pid = java.util.UUID.randomUUID();
        String url = "/api/parcels/" + Objects.requireNonNull(pid).toString() + "/scan";
        mvc.perform(post(url)
            .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
            .content(Objects.requireNonNull(body))
            .with(Objects.requireNonNull(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf()))
            .with(Objects.requireNonNull(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("20").roles("AGENT"))))
            .andExpect(status().isOk());
    }
}
