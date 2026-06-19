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
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "payment.gateway", havingValue = "camerpay")
public class CamerPayPaymentGatewayServiceImpl implements PaymentGatewayService {

    private final ObjectMapper objectMapper;

    @Value("${camerpay.api.token:}")
    private String apiToken;

    @Value("${camerpay.init-url:}")
    private String initUrl;

    @Value("${camerpay.verify-url:}")
    private String verifyUrl;

    @Value("${camerpay.callback-url:}")
    private String callbackUrl;

    @Value("${camerpay.return-url:}")
    private String returnUrl;

    @Override
    public String initiatePayment(String payerPhone, Double amount, String currency, String description) {
        if (initUrl == null || initUrl.isBlank()) {
            throw new IllegalStateException("CamerPay init endpoint is not configured (camerpay.init-url)");
        }
        if (apiToken == null || apiToken.isBlank()) {
            throw new IllegalStateException("CamerPay API token is not configured (camerpay.api.token)");
        }

        try {
            var payload = objectMapper.createObjectNode();
            payload.put("amount", amount != null ? amount : 0.0);
            payload.put("currency", currency != null ? currency : "XAF");
            payload.put("customer_phone", payerPhone);
            payload.put("merchant_invoice_id", description != null && !description.isBlank()
                    ? description
                    : "SMARTCAMPOST-" + System.currentTimeMillis());
            if (callbackUrl != null && !callbackUrl.isBlank()) {
                payload.put("merchant_callback_url", callbackUrl);
            }
            if (returnUrl != null && !returnUrl.isBlank()) {
                payload.put("merchant_return_url", returnUrl);
            } else if (callbackUrl != null && !callbackUrl.isBlank()) {
                payload.put("merchant_return_url", callbackUrl);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(initUrl))
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiToken)
                    .timeout(Duration.ofSeconds(25))
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("CamerPay init call failed with status " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            String reference = firstText(root,
                    "transaction_uuid", "transactionId", "transaction_id", "reference", "externalRef", "external_ref", "id", "payment_id");
            return reference == null || reference.isBlank() ? response.body() : reference;
        } catch (Exception ex) {
            log.error("CamerPay payment initiation failed", ex);
            throw new IllegalStateException("Failed to initiate CamerPay payment: " + ex.getMessage(), ex);
        }
    }

    @Override
    public boolean verifyPayment(String externalRef) {
        if (externalRef == null || externalRef.isBlank()) return false;
        if (verifyUrl == null || verifyUrl.isBlank()) {
            log.warn("CamerPay verify endpoint not configured (camerpay.verify-url); cannot verify {}", externalRef);
            return false;
        }

        try {
            String encodedRef = URLEncoder.encode(externalRef, StandardCharsets.UTF_8);
            String url = verifyUrl.contains("{externalRef}")
                    ? verifyUrl.replace("{externalRef}", encodedRef)
                    : verifyUrl;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .header("Authorization", "Bearer " + apiToken)
                    .timeout(Duration.ofSeconds(20))
                    .GET()
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return false;
            }

            JsonNode root = objectMapper.readTree(response.body());
            String status = firstText(root, "status", "state", "payment_status");
            return isSuccessfulStatus(status);
        } catch (Exception ex) {
            log.error("CamerPay payment verification failed for externalRef={}", externalRef, ex);
            return false;
        }
    }

    public static boolean isSuccessfulStatus(String status) {
        if (status == null) return false;
        return switch (status.trim().toUpperCase()) {
            case "SUCCESS", "SUCCESSFUL", "COMPLETED", "PAID", "APPROVED", "VALIDATED" -> true;
            default -> false;
        };
    }

    public static String firstText(JsonNode root, String... names) {
        if (root == null || root.isNull()) return null;
        for (String name : names) {
            JsonNode node = root.findValue(name);
            if (node != null && !node.isNull()) {
                String value = node.asText("");
                if (!value.isBlank()) return value;
            }
        }
        return null;
    }
}
