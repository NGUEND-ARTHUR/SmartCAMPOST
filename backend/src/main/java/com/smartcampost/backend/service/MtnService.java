package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.payment.MtnInitRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class MtnService {

    @Value("${mtn.consumer-key:}")
    private String mtnKey;

    @Value("${mtn.consumer-secret:}")
    private String mtnSecret;

    @Value("${mtn.token-url:}")
    private String mtnTokenUrl;

    @Value("${mtn.init-url:}")
    private String mtnInitUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getBasicTokenFromEnv(String key, String secret) {
        if (key == null || key.isBlank() || secret == null || secret.isBlank()) return null;
        String raw = key + ":" + secret;
        return Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Initiate an MTN Mobile Money payment.
     * If mtn.init-url is configured, calls the real MTN Collections API.
     * Otherwise, returns a local pending record for development/testing.
     */
    public Map<String, Object> initPayment(MtnInitRequest req) {
        // If MTN API URLs are configured, call the real endpoint
        if (mtnInitUrl != null && !mtnInitUrl.isBlank()) {
            try {
                return callRealMtnApi(req);
            } catch (Exception e) {
                log.error("Failed to call MTN API, falling back to pending state: {}", e.getMessage());
                // Return a PENDING status so the frontend can retry/poll
                return Map.of(
                        "status", "PENDING",
                        "error", e.getMessage(),
                        "transactionId", "mtn-err-" + UUID.randomUUID(),
                        "amount", req.getAmount(),
                        "msisdn", req.getMsisdn(),
                        "externalId", req.getExternalId()
                );
            }
        }

        // Development mode: no MTN endpoint configured
        log.warn("MTN init-url not configured. Payment will be recorded as PENDING for manual verification.");
        String tx = "mtn-dev-" + UUID.randomUUID();
        return Map.of(
                "status", "PENDING",
                "transactionId", tx,
                "amount", req.getAmount(),
                "msisdn", req.getMsisdn(),
                "externalId", req.getExternalId(),
                "note", "Development mode: configure mtn.init-url for real MTN API calls"
        );
    }

    /**
     * Calls the real MTN MoMo Collections API:
     * 1. Obtains an OAuth access token
     * 2. Sends the payment initiation request
     * 3. Returns the parsed response
     */
    private Map<String, Object> callRealMtnApi(MtnInitRequest req) throws Exception {
        // Step 1: Get access token
        String accessToken = null;
        if (mtnTokenUrl != null && !mtnTokenUrl.isBlank()
                && mtnKey != null && !mtnKey.isBlank()
                && mtnSecret != null && !mtnSecret.isBlank()) {
            String basicAuth = getBasicTokenFromEnv(mtnKey, mtnSecret);
            String tokenBody = fetchTokenFromMtnApi(mtnTokenUrl, basicAuth);
            JsonNode tokenJson = objectMapper.readTree(tokenBody);
            if (tokenJson.has("access_token")) {
                accessToken = tokenJson.get("access_token").asText();
            } else if (tokenJson.has("accessToken")) {
                accessToken = tokenJson.get("accessToken").asText();
            }
            log.info("MTN OAuth token obtained successfully");
        }

        // Step 2: Build request payload per MTN MoMo Collections API spec
        String referenceId = UUID.randomUUID().toString();
        Map<String, Object> payload = new HashMap<>();
        payload.put("amount", String.valueOf(req.getAmount().intValue()));
        payload.put("currency", "XAF");
        payload.put("externalId", req.getExternalId() != null ? req.getExternalId() : referenceId);
        payload.put("payer", Map.of(
                "partyIdType", "MSISDN",
                "partyId", req.getMsisdn()
        ));
        payload.put("payerMessage", "SmartCAMPOST Payment");
        payload.put("payeeNote", "Payment for parcel services");

        String jsonBody = objectMapper.writeValueAsString(payload);

        // Step 3: Call the init endpoint
        String response = callInitEndpoint(mtnInitUrl, accessToken, jsonBody);

        // Step 4: Parse and return
        Map<String, Object> result = new HashMap<>();
        result.put("status", "PENDING"); // MTN payments are async
        result.put("transactionId", referenceId);
        result.put("amount", req.getAmount());
        result.put("msisdn", req.getMsisdn());
        result.put("externalId", req.getExternalId());

        // Try to parse response for additional info
        try {
            JsonNode respJson = objectMapper.readTree(response);
            if (respJson.has("status")) {
                result.put("providerStatus", respJson.get("status").asText());
            }
            if (respJson.has("referenceId")) {
                result.put("providerReferenceId", respJson.get("referenceId").asText());
            }
        } catch (Exception ignored) {
            // Raw response may not be JSON for 202 Accepted
            result.put("providerResponse", response);
        }

        log.info("MTN payment initiated: txId={}, msisdn={}, amount={}",
                referenceId, req.getMsisdn(), req.getAmount());
        return result;
    }

    /**
     * Fetch OAuth token from MTN API.
     */
    public String fetchTokenFromMtnApi(String tokenUrl, String basicAuthHeader) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(tokenUrl))
                .header("Authorization", "Basic " + basicAuthHeader)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString("grant_type=client_credentials"))
                .build();
        HttpResponse<String> resp = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
            return resp.body();
        }
        throw new RuntimeException("MTN token request failed: HTTP " + resp.statusCode() + " - " + resp.body());
    }

    /**
     * Call the MTN Collections requesttopay endpoint.
     */
    public String callInitEndpoint(String initUrl, String accessToken, String jsonBody) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest.Builder b = HttpRequest.newBuilder().uri(URI.create(initUrl))
                .header("Content-Type", "application/json")
                .header("X-Reference-Id", UUID.randomUUID().toString())
                .header("X-Target-Environment", "sandbox"); // Use "production" in prod
        if (accessToken != null && !accessToken.isBlank()) {
            b.header("Authorization", "Bearer " + accessToken);
        }
        HttpRequest request = b.POST(HttpRequest.BodyPublishers.ofString(jsonBody)).build();
        HttpResponse<String> resp = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
            return resp.body() != null && !resp.body().isBlank() ? resp.body() : "{\"status\":\"ACCEPTED\"}";
        }
        throw new RuntimeException("MTN init request failed: HTTP " + resp.statusCode() + " - " + resp.body());
    }
}
