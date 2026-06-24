package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.service.PaymentGatewayService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.Objects;

/**
 * CamPay payment gateway integration.
 * Docs: https://github.com/CamPay
 *
 * Endpoints:
 *  - POST /api/token/                     → get auth token
 *  - POST /api/collect/                   → request payment from user
 *  - GET  /api/transaction/{reference}/   → check transaction status
 *
 * Activate by setting: payment.gateway=campay
 */
@Service
@ConditionalOnProperty(name = "payment.gateway", havingValue = "campay")
@Slf4j
public class CamPayPaymentGatewayServiceImpl implements PaymentGatewayService {

    @Value("${CAMPAY_APP_USERNAME:}")
    private String appUsername;

    @Value("${CAMPAY_APP_PASSWORD:}")
    private String appPassword;

    @Value("${CAMPAY_BASE_URL:https://demo.campay.net}")
    private String baseUrl;

    @Value("${CAMPAY_PERMANENT_TOKEN:}")
    private String permanentToken;

    private WebClient webClient;

    @PostConstruct
    public void init() {
        webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        log.info("CamPay gateway initialized (baseUrl={})", baseUrl);
    }

    @Override
    public String initiatePayment(String payerPhone, Double amount, String currency, String description) {
        Objects.requireNonNull(payerPhone, "payerPhone is required");
        Objects.requireNonNull(amount, "amount is required");

        String token = resolveToken();
        int intAmount = amount.intValue();

        Map<String, Object> body = Map.of(
                "amount", intAmount,
                "currency", currency != null ? currency : "XAF",
                "from", normalizePhone(payerPhone),
                "description", description != null ? description : "SmartCAMPOST payment",
                "external_reference", "SCP-" + System.currentTimeMillis()
        );

        log.info("[CAMPAY] Initiating collect: phone={}, amount={} {}", maskPhone(payerPhone), intAmount, currency);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.post()
                    .uri("/api/collect/")
                    .header(HttpHeaders.AUTHORIZATION, "Token " + token)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new RuntimeException("CamPay returned null response");
            }

            String reference = String.valueOf(response.getOrDefault("reference", ""));
            String status = String.valueOf(response.getOrDefault("status", ""));
            log.info("[CAMPAY] Collect initiated: reference={}, status={}", reference, status);
            return reference;

        } catch (Exception e) {
            log.error("[CAMPAY] Collect failed: {}", e.getMessage());
            throw new RuntimeException("Payment initiation failed: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean verifyPayment(String externalRef) {
        Objects.requireNonNull(externalRef, "externalRef is required");

        String token = resolveToken();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.get()
                    .uri("/api/transaction/{reference}/", externalRef)
                    .header(HttpHeaders.AUTHORIZATION, "Token " + token)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) return false;

            String status = String.valueOf(response.getOrDefault("status", ""));
            log.info("[CAMPAY] Transaction status for {}: {}", externalRef, status);
            return "SUCCESSFUL".equalsIgnoreCase(status);

        } catch (Exception e) {
            log.error("[CAMPAY] Status check failed for {}: {}", externalRef, e.getMessage());
            return false;
        }
    }

    private String resolveToken() {
        if (permanentToken != null && !permanentToken.isBlank()) {
            return permanentToken;
        }

        if (appUsername == null || appUsername.isBlank() || appPassword == null || appPassword.isBlank()) {
            throw new IllegalStateException("CamPay credentials not configured (CAMPAY_APP_USERNAME/CAMPAY_APP_PASSWORD or CAMPAY_PERMANENT_TOKEN required)");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> tokenResponse = webClient.post()
                    .uri("/api/token/")
                    .bodyValue(Map.of("username", appUsername, "password", appPassword))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (tokenResponse == null || !tokenResponse.containsKey("token")) {
                throw new RuntimeException("Token response missing 'token' field");
            }

            return String.valueOf(tokenResponse.get("token"));

        } catch (Exception e) {
            log.error("[CAMPAY] Token retrieval failed: {}", e.getMessage());
            throw new RuntimeException("CamPay authentication failed", e);
        }
    }

    private String normalizePhone(String phone) {
        String cleaned = phone.replaceAll("[^0-9+]", "");
        if (!cleaned.startsWith("+") && !cleaned.startsWith("237")) {
            cleaned = "237" + cleaned;
        }
        return cleaned;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() <= 4) return "****";
        return "****" + phone.substring(phone.length() - 4);
    }
}
