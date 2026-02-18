package com.smartcampost.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.dto.payment.MtnInitRequest;
import com.smartcampost.backend.service.MtnService;
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

@Service
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "payment.gateway", havingValue = "mtn", matchIfMissing = true)
public class MtnPaymentGatewayServiceImpl implements PaymentGatewayService {

    private final MtnService mtnService;
    private final ObjectMapper objectMapper;

    @Value("${mtn.consumer-key:}")
    private String mtnKey;

    @Value("${mtn.consumer-secret:}")
    private String mtnSecret;

    @Value("${mtn.token-url:}")
    private String mtnTokenUrl;

    @Value("${mtn.init-url:}")
    private String mtnInitUrl;

    @Value("${mtn.verify-url:}")
    private String mtnVerifyUrl;

    @Override
    public String initiatePayment(String payerPhone, Double amount, String currency, String description) {
        if (mtnInitUrl == null || mtnInitUrl.isBlank()) {
            throw new IllegalStateException("MTN payment init endpoint is not configured (mtn.init-url)");
        }

        try {
            String accessToken = null;
            String basic = mtnService.getBasicTokenFromEnv(mtnKey, mtnSecret);

            if (mtnTokenUrl != null && !mtnTokenUrl.isBlank() && basic != null && !basic.isBlank()) {
                String tokenBody = mtnService.fetchTokenFromMtnApi(mtnTokenUrl, basic);
                JsonNode tokenJson = objectMapper.readTree(tokenBody);
                if (tokenJson.has("access_token")) {
                    accessToken = tokenJson.get("access_token").asText();
                } else if (tokenJson.has("accessToken")) {
                    accessToken = tokenJson.get("accessToken").asText();
                }
            }

            MtnInitRequest request = new MtnInitRequest();
            request.setAmount(amount);
            request.setMsisdn(payerPhone);
            request.setExternalId(description);

            String body = objectMapper.writeValueAsString(request);
            String response = mtnService.callInitEndpoint(mtnInitUrl, accessToken, body);
            JsonNode root = objectMapper.readTree(response);

            if (root.has("transactionId") && !root.get("transactionId").isNull()) {
                return root.get("transactionId").asText();
            }
            if (root.has("externalId") && !root.get("externalId").isNull()) {
                return root.get("externalId").asText();
            }
            if (root.has("reference") && !root.get("reference").isNull()) {
                return root.get("reference").asText();
            }

            return response;
        } catch (Exception ex) {
            log.error("MTN payment initiation failed", ex);
            throw new IllegalStateException("Failed to initiate MTN payment: " + ex.getMessage(), ex);
        }
    }

    @Override
    public boolean verifyPayment(String externalRef) {
        if (externalRef == null || externalRef.isBlank()) {
            return false;
        }
        if (mtnVerifyUrl == null || mtnVerifyUrl.isBlank()) {
            log.warn("MTN verify endpoint not configured (mtn.verify-url); cannot verify transaction {}", externalRef);
            return false;
        }

        try {
            String accessToken = null;
            String basic = mtnService.getBasicTokenFromEnv(mtnKey, mtnSecret);

            if (mtnTokenUrl != null && !mtnTokenUrl.isBlank() && basic != null && !basic.isBlank()) {
                String tokenBody = mtnService.fetchTokenFromMtnApi(mtnTokenUrl, basic);
                JsonNode tokenJson = objectMapper.readTree(tokenBody);
                if (tokenJson.has("access_token")) {
                    accessToken = tokenJson.get("access_token").asText();
                } else if (tokenJson.has("accessToken")) {
                    accessToken = tokenJson.get("accessToken").asText();
                }
            }

            String url = mtnVerifyUrl.contains("{externalRef}")
                    ? mtnVerifyUrl.replace("{externalRef}", externalRef)
                    : mtnVerifyUrl;

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .GET();
            if (accessToken != null && !accessToken.isBlank()) {
                builder.header("Authorization", "Bearer " + accessToken);
            }

            HttpResponse<String> httpResponse = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (httpResponse.statusCode() < 200 || httpResponse.statusCode() >= 300) {
                log.warn("MTN verify call returned status {} for externalRef={}", httpResponse.statusCode(), externalRef);
                return false;
            }

            String response = httpResponse.body();
            JsonNode root = objectMapper.readTree(response);

            String status = root.has("status") ? root.get("status").asText("") : "";
            return "SUCCESS".equalsIgnoreCase(status)
                    || "COMPLETED".equalsIgnoreCase(status)
                    || "SUCCESSFUL".equalsIgnoreCase(status);
        } catch (Exception ex) {
            log.error("MTN payment verification failed for externalRef={}", externalRef, ex);
            return false;
        }
    }
}
