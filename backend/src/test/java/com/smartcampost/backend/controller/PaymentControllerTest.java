package com.smartcampost.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.dto.payment.PaymentResponse;
import com.smartcampost.backend.model.enums.PaymentMethod;
import com.smartcampost.backend.model.enums.PaymentStatus;
import com.smartcampost.backend.service.PaymentService;
import com.smartcampost.backend.security.ParcelAuthorizationService;
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
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = PaymentController.class)
@AutoConfigureMockMvc(addFilters = false)
class PaymentControllerTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;

    @MockitoBean private PaymentService paymentService;
    @MockitoBean private ParcelAuthorizationService parcelAuthorizationService;

    private PaymentResponse mockPayment() {
        return PaymentResponse.builder()
                .id(UUID.randomUUID())
                .parcelId(UUID.randomUUID())
                .amount(5000.0)
                .currency("XAF")
                .method(PaymentMethod.MOBILE_MONEY)
                .status(PaymentStatus.PENDING)
                .build();
    }

    @Test
    @WithMockUser(roles = "CLIENT")
    void initPayment_shouldReturn200() throws Exception {
        when(paymentService.initPayment(any())).thenReturn(mockPayment());

        mvc.perform(post("/api/payments/init")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of(
                                "parcelId", UUID.randomUUID().toString(),
                                "method", "MOBILE_MONEY",
                                "payerPhone", "+237677123456"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(5000.0))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @WithMockUser(roles = "CLIENT")
    void confirmPayment_shouldReturn200() throws Exception {
        PaymentResponse confirmed = mockPayment();
        confirmed.setStatus(PaymentStatus.SUCCESS);
        when(paymentService.confirmPayment(any())).thenReturn(confirmed);

        mvc.perform(post("/api/payments/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of(
                                "paymentId", UUID.randomUUID().toString(),
                                "success", true
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    @WithMockUser(roles = "AGENT")
    void cashConfirm_shouldReturn200() throws Exception {
        PaymentResponse cash = mockPayment();
        cash.setStatus(PaymentStatus.SUCCESS);
        cash.setMethod(PaymentMethod.CASH);
        when(paymentService.processPickupPayment(any(), eq("CASH"), eq(null))).thenReturn(cash);

        UUID parcelId = UUID.randomUUID();
        mvc.perform(post("/api/payments/cash-confirm/" + parcelId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    @WithMockUser(roles = "COURIER")
    void markCodAsPaid_shouldReturn200() throws Exception {
        PaymentResponse cod = mockPayment();
        cod.setStatus(PaymentStatus.SUCCESS);
        when(paymentService.markCodAsPaid(any())).thenReturn(cod);

        UUID parcelId = UUID.randomUUID();
        mvc.perform(post("/api/payments/cod/" + parcelId + "/mark-paid"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    @WithMockUser(roles = "CLIENT")
    void getPayment_shouldReturn200() throws Exception {
        when(paymentService.getPaymentById(any())).thenReturn(mockPayment());

        mvc.perform(get("/api/payments/" + UUID.randomUUID()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currency").value("XAF"));
    }

    @Test
    @WithMockUser(roles = "CLIENT")
    void getPaymentsForParcel_shouldReturn200() throws Exception {
        when(paymentService.getPaymentsForParcel(any())).thenReturn(List.of(mockPayment()));

        mvc.perform(get("/api/payments/parcel/" + UUID.randomUUID()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].amount").value(5000.0));
    }
}
