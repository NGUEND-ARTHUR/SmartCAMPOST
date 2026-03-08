package com.smartcampost.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.service.PaymentGatewayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Orange Money gateway adapter.
 *
 * This project doesn't ship a fixed Orange API contract; instead it is
 * configurable via URLs and an optional API key header.
 *
 * Expected behaviors (by convention):
 * - Initiate: POST orange.init-url with JSON body { phone, amount, currency, description }
 *   Response contains one of: transactionId | reference | externalRef
 * - Verify: GET orange.verify-url (supports {externalRef} placeholder)
 *   Response contains field "status" == SUCCESS|COMPLETED|SUCCESSFUL
 */
@Service
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "payment.gateway", havingValue = "orange")
public class OrangePaymentGatewayServiceImpl implements PaymentGatewayService {

    private final ObjectMapper objectMapper;

    @Value("${orange.api-key:}")
    private String orangeApiKey;

    @Value("${orange.init-url:}")
    private String orangeInitUrl;

    @Value("${orange.verify-url:}")
    private String orangeVerifyUrl;

    @Override
    public String initiatePayment(String payerPhone, Double amount, String currency, String description) {
        if (orangeInitUrl == null || orangeInitUrl.isBlank()) {
            throw new IllegalStateException("Orange payment init endpoint is not configured (orange.init-url)");
        }

        try {
            var payload = objectMapper.createObjectNode();
            payload.put("phone", payerPhone);
            payload.put("amount", amount != null ? amount : 0.0);
            payload.put("currency", currency != null ? currency : "XAF");
            payload.put("description", description != null ? description : "");

            String body = objectMapper.writeValueAsString(payload);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(orangeInitUrl))
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(20))
                    .POST(HttpRequest.BodyPublishers.ofString(body));

            if (orangeApiKey != null && !orangeApiKey.isBlank()) {
                builder.header("X-API-KEY", orangeApiKey);
            }

            HttpResponse<String> resp = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                throw new IllegalStateException("Orange init call failed with status " + resp.statusCode());
            }

            JsonNode root = objectMapper.readTree(resp.body());
            if (root.hasNonNull("transactionId")) return root.get("transactionId").asText();
            if (root.hasNonNull("reference")) return root.get("reference").asText();
            if (root.hasNonNull("externalRef")) return root.get("externalRef").asText();

            // Fallback: return raw response as reference
            return resp.body();
        } catch (Exception ex) {
            log.error("Orange payment initiation failed", ex);
            throw new IllegalStateException("Failed to initiate Orange payment: " + ex.getMessage(), ex);
        }
    }

    @Override
    public boolean verifyPayment(String externalRef) {
        if (externalRef == null || externalRef.isBlank()) return false;
        if (orangeVerifyUrl == null || orangeVerifyUrl.isBlank()) {
            log.warn("Orange verify endpoint not configured (orange.verify-url); cannot verify {}", externalRef);
            return false;
        }

        try {
            String url = orangeVerifyUrl.contains("{externalRef}")
                    ? orangeVerifyUrl.replace("{externalRef}", externalRef)
                    : orangeVerifyUrl;

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(20))
                    .GET();

            if (orangeApiKey != null && !orangeApiKey.isBlank()) {
                builder.header("X-API-KEY", orangeApiKey);
            }

            HttpResponse<String> resp = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                return false;
            }

            JsonNode root = objectMapper.readTree(resp.body());
            String status = root.has("status") ? root.get("status").asText("") : "";
            return "SUCCESS".equalsIgnoreCase(status)
                    || "COMPLETED".equalsIgnoreCase(status)
                    || "SUCCESSFUL".equalsIgnoreCase(status);
        } catch (Exception ex) {
            log.error("Orange payment verification failed for externalRef={}", externalRef, ex);
            return false;
        }
    }
}
