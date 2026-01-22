package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.payment.MtnInitRequest;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class MtnService {

    // For this implementation we keep calls minimal and safe for development.
    // Production should implement robust OAuth token exchange and secure request signing.

    public String getBasicTokenFromEnv(String key, String secret) {
        if (key == null || key.isBlank() || secret == null || secret.isBlank()) return null;
        String raw = key + ":" + secret;
        return Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public Map<String, Object> initPayment(MtnInitRequest req) {
        // In this implementation return a stubbed pending transaction id and echo the request.
        // Optionally, a real integration can call MTN's API using HttpClient here.
        String tx = "mtn-" + UUID.randomUUID();
        return Map.of(
                "status", "PENDING",
                "transactionId", tx,
                "amount", req.getAmount(),
                "msisdn", req.getMsisdn(),
                "externalId", req.getExternalId()
        );
    }

    // Example helper showing how a real token call could be made (not used by default)
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
        throw new RuntimeException("Token request failed: " + resp.statusCode() + " " + resp.body());
    }

    public String callInitEndpoint(String initUrl, String accessToken, String jsonBody) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest.Builder b = HttpRequest.newBuilder().uri(URI.create(initUrl))
                .header("Content-Type", "application/json");
        if (accessToken != null && !accessToken.isBlank()) {
            b.header("Authorization", "Bearer " + accessToken);
        }
        HttpRequest request = b.POST(HttpRequest.BodyPublishers.ofString(jsonBody)).build();
        HttpResponse<String> resp = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
            return resp.body();
        }
        throw new RuntimeException("Init request failed: " + resp.statusCode() + " " + resp.body());
    }
}
