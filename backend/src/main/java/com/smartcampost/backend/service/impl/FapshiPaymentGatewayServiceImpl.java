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
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Fapshi payment gateway integration.
 * Docs: https://docs.fapshi.com
 *
 * Endpoints:
 *  - POST /direct-pay          → send payment prompt to user's phone
 *  - GET  /payment-status/:id  → check transaction status
 *
 * Sandbox: https://sandbox.fapshi.com
 * Production: https://api.fapshi.com
 *
 * Activate by setting: payment.gateway=fapshi
 */
@Service
@ConditionalOnProperty(name = "payment.gateway", havingValue = "fapshi")
@Slf4j
public class FapshiPaymentGatewayServiceImpl implements PaymentGatewayService {

    @Value("${FAPSHI_API_USER:}")
    private String apiUser;

    @Value("${FAPSHI_API_KEY:}")
    private String apiKey;

    @Value("${FAPSHI_BASE_URL:https://sandbox.fapshi.com}")
    private String baseUrl;

    private WebClient webClient;

    @PostConstruct
    public void init() {
        if (apiUser == null || apiUser.isBlank() || apiKey == null || apiKey.isBlank()) {
            log.warn("[FAPSHI] API credentials not configured — set FAPSHI_API_USER and FAPSHI_API_KEY");
        }
        webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apiuser", apiUser != null ? apiUser : "")
                .defaultHeader("apikey", apiKey != null ? apiKey : "")
                .build();
        log.info("[FAPSHI] Payment gateway initialized (baseUrl={})", baseUrl);
    }

    @Override
    public String initiatePayment(String payerPhone, Double amount, String currency, String description) {
        Objects.requireNonNull(payerPhone, "payerPhone is required");
        Objects.requireNonNull(amount, "amount is required");

        int intAmount = Math.max(100, amount.intValue());

        String phone = normalizePhone(payerPhone);
        String medium = detectMedium(phone);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", intAmount);
        body.put("phone", phone);
        body.put("medium", medium);
        body.put("message", description != null ? description : "SmartCAMPOST payment");
        body.put("externalId", "SCP-" + System.currentTimeMillis());

        log.info("[FAPSHI] Initiating direct-pay: phone={}, amount={} XAF, medium={}",
                maskPhone(payerPhone), intAmount, medium);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.post()
                    .uri("/direct-pay")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new RuntimeException("Fapshi returned null response");
            }

            String transId = String.valueOf(response.getOrDefault("transId", ""));
            log.info("[FAPSHI] Payment initiated: transId={}", transId);
            return transId;

        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            String responseBody = e.getResponseBodyAsString();
            log.error("[FAPSHI] Direct-pay HTTP {}: {} | baseUrl={} | apiUser={}",
                    e.getStatusCode(), responseBody, baseUrl,
                    apiUser != null && apiUser.length() > 4 ? apiUser.substring(0, 4) + "***" : "(empty)");
            throw new RuntimeException("Fapshi payment failed (" + e.getStatusCode() + "): " + responseBody, e);
        } catch (Exception e) {
            log.error("[FAPSHI] Direct-pay failed: {} | baseUrl={}", e.getMessage(), baseUrl);
            throw new RuntimeException("Payment initiation failed: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean verifyPayment(String externalRef) {
        Objects.requireNonNull(externalRef, "externalRef/transId is required");

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.get()
                    .uri("/payment-status/{transId}", externalRef)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) return false;

            String status = String.valueOf(response.getOrDefault("status", ""));
            log.info("[FAPSHI] Payment status for {}: {}", externalRef, status);
            return "SUCCESSFUL".equalsIgnoreCase(status);

        } catch (Exception e) {
            log.error("[FAPSHI] Status check failed for {}: {}", externalRef, e.getMessage());
            return false;
        }
    }

    private String detectMedium(String phone) {
        if (phone.startsWith("69") || phone.startsWith("65")) {
            return "orange money";
        }
        return "mobile money";
    }

    private String normalizePhone(String phone) {
        String cleaned = phone.replaceAll("[^0-9]", "");
        if (cleaned.startsWith("237") && cleaned.length() > 9) {
            cleaned = cleaned.substring(3);
        }
        return cleaned;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() <= 4) return "****";
        return "****" + phone.substring(phone.length() - 4);
    }
}
