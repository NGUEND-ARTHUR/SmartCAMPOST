package com.smartcampost.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.ParcelDelegate;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.ParcelDelegateRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ParcelDelegateController.class)
@AutoConfigureMockMvc(addFilters = false)
class ParcelDelegateControllerTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;

    @MockitoBean private ParcelDelegateRepository delegateRepository;
    @MockitoBean private ParcelRepository parcelRepository;
    @MockitoBean private NotificationService notificationService;

    private final UUID parcelId = UUID.randomUUID();

    @Test
    @WithMockUser(roles = "CLIENT")
    void authorizeDelegate_shouldCreateAndReturnPin() throws Exception {
        Parcel parcel = Parcel.builder().id(parcelId).trackingRef("SCP-DEL-001").status(ParcelStatus.ACCEPTED).build();
        when(parcelRepository.findById(parcelId)).thenReturn(Optional.of(parcel));
        when(delegateRepository.save(any(ParcelDelegate.class))).thenAnswer(inv -> {
            ParcelDelegate d = inv.getArgument(0);
            if (d.getId() == null) d.setId(UUID.randomUUID());
            if (d.getPinCode() == null) d.setPinCode("1234");
            if (d.getExpiresAt() == null) d.setExpiresAt(Instant.now().plusSeconds(604800));
            return d;
        });

        mvc.perform(post("/api/parcels/" + parcelId + "/delegates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of(
                                "delegateName", "Jean Dupont",
                                "delegatePhone", "+237677999888"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.delegateName").value("Jean Dupont"))
                .andExpect(jsonPath("$.pinCode").exists())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @WithMockUser(roles = "COURIER")
    void verifyDelegate_withValidPin_shouldSucceed() throws Exception {
        ParcelDelegate delegate = ParcelDelegate.builder()
                .id(UUID.randomUUID())
                .parcel(Parcel.builder().id(parcelId).build())
                .delegateName("Jean Dupont")
                .delegatePhone("+237677999888")
                .pinCode("5678")
                .used(false)
                .expiresAt(Instant.now().plusSeconds(86400))
                .build();
        when(delegateRepository.findByParcelIdAndPinCode(parcelId, "5678")).thenReturn(Optional.of(delegate));
        when(delegateRepository.save(any())).thenReturn(delegate);

        mvc.perform(post("/api/parcels/" + parcelId + "/delegates/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("pinCode", "5678"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.delegateName").value("Jean Dupont"));
    }

    @Test
    @WithMockUser(roles = "COURIER")
    void verifyDelegate_withInvalidPin_shouldFail() throws Exception {
        when(delegateRepository.findByParcelIdAndPinCode(parcelId, "0000")).thenReturn(Optional.empty());

        mvc.perform(post("/api/parcels/" + parcelId + "/delegates/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("pinCode", "0000"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(false));
    }

    @Test
    @WithMockUser(roles = "COURIER")
    void verifyDelegate_alreadyUsed_shouldFail() throws Exception {
        ParcelDelegate used = ParcelDelegate.builder()
                .id(UUID.randomUUID())
                .parcel(Parcel.builder().id(parcelId).build())
                .delegateName("Used Delegate")
                .delegatePhone("+237677000000")
                .pinCode("1111")
                .used(true)
                .usedAt(Instant.now().minusSeconds(3600))
                .expiresAt(Instant.now().plusSeconds(86400))
                .build();
        when(delegateRepository.findByParcelIdAndPinCode(parcelId, "1111")).thenReturn(Optional.of(used));

        mvc.perform(post("/api/parcels/" + parcelId + "/delegates/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("pinCode", "1111"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(false))
                .andExpect(jsonPath("$.error").value("This delegate authorization has already been used"));
    }

    @Test
    @WithMockUser(roles = "CLIENT")
    void listDelegates_shouldReturnList() throws Exception {
        when(delegateRepository.findByParcelIdAndUsedFalse(parcelId)).thenReturn(List.of());

        mvc.perform(get("/api/parcels/" + parcelId + "/delegates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
