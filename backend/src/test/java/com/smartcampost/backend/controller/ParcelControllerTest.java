package com.smartcampost.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.dto.parcel.ParcelDetailResponse;
import com.smartcampost.backend.dto.parcel.ParcelResponse;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.service.ParcelService;
import com.smartcampost.backend.service.ScanEventService;
import com.smartcampost.backend.security.ParcelAuthorizationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ParcelController.class)
@AutoConfigureMockMvc(addFilters = false)
class ParcelControllerTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;

    @MockitoBean private ParcelService parcelService;
    @MockitoBean private ScanEventService scanEventService;
    @MockitoBean private ParcelAuthorizationService parcelAuthorizationService;

    private ParcelResponse mockParcel() {
        return ParcelResponse.builder()
                .id(UUID.randomUUID())
                .trackingRef("SCP-TEST-001")
                .status(ParcelStatus.CREATED)
                .build();
    }

    @Test
    @WithMockUser(roles = "CLIENT")
    void createParcel_shouldReturn200() throws Exception {
        when(parcelService.createParcel(any())).thenReturn(mockParcel());

        mvc.perform(post("/api/parcels")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of(
                                "senderAddressId", UUID.randomUUID().toString(),
                                "recipientAddressId", UUID.randomUUID().toString(),
                                "weight", 2.5,
                                "serviceType", "STANDARD",
                                "deliveryOption", "AGENCY",
                                "paymentOption", "PREPAID"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingRef").value("SCP-TEST-001"))
                .andExpect(jsonPath("$.status").value("CREATED"));
    }

    @Test
    @WithMockUser(roles = "CLIENT")
    void listMyParcels_shouldReturnPage() throws Exception {
        Page<ParcelResponse> page = new PageImpl<>(List.of(mockParcel()));
        when(parcelService.listMyParcels(anyInt(), anyInt())).thenReturn(page);

        mvc.perform(get("/api/parcels/me?page=0&size=20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].trackingRef").value("SCP-TEST-001"));
    }

    @Test
    @WithMockUser(roles = "CLIENT")
    void getParcelById_shouldReturn200() throws Exception {
        ParcelDetailResponse detail = ParcelDetailResponse.builder()
                .id(UUID.randomUUID())
                .trackingRef("SCP-TEST-001")
                .status(ParcelStatus.CREATED)
                .build();
        when(parcelService.getParcelById(any())).thenReturn(detail);

        mvc.perform(get("/api/parcels/" + UUID.randomUUID()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingRef").value("SCP-TEST-001"));
    }

    @Test
    @WithMockUser(roles = "STAFF")
    void listAllParcels_shouldReturnPage() throws Exception {
        Page<ParcelResponse> page = new PageImpl<>(List.of(mockParcel()));
        when(parcelService.listParcels(anyInt(), anyInt())).thenReturn(page);

        mvc.perform(get("/api/parcels?page=0&size=20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @WithMockUser(roles = "CLIENT")
    void getByTracking_shouldReturn200() throws Exception {
        ParcelDetailResponse detail = ParcelDetailResponse.builder()
                .id(UUID.randomUUID())
                .trackingRef("SCP-TRACK-123")
                .status(ParcelStatus.IN_TRANSIT)
                .build();
        when(parcelService.getParcelByTracking(any())).thenReturn(detail);

        mvc.perform(get("/api/parcels/tracking/SCP-TRACK-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_TRANSIT"));
    }
}
