package com.smartcampost.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.dto.auth.AuthResponse;
import com.smartcampost.backend.dto.auth.GoogleAuthRequest;
import com.smartcampost.backend.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerGoogleTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

        @MockitoBean
    private AuthService authService;

    @Test
    void loginWithGoogle_shouldDelegateToAuthService() throws Exception {
        AuthResponse response = AuthResponse.builder()
                .userId(UUID.fromString("00000000-0000-0000-0000-000000000042"))
                .entityId(UUID.fromString("00000000-0000-0000-0000-000000000043"))
                .fullName("Google Client")
                .email("google.client@smartcampost.cm")
                .role("CLIENT")
                .accessToken("jwt-token")
                .tokenType("Bearer")
                .build();

        given(authService.loginWithGoogle(any())).willReturn(response);

        GoogleAuthRequest request = GoogleAuthRequest.builder()
                .idToken("google-id-token")
                .build();

        mvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Google Client"))
                .andExpect(jsonPath("$.role").value("CLIENT"))
                .andExpect(jsonPath("$.accessToken").value("jwt-token"));
    }

    @Test
    void loginWithGoogle_shouldRejectBlankToken() throws Exception {
        mvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GoogleAuthRequest())))
                .andExpect(status().isBadRequest());
    }
}