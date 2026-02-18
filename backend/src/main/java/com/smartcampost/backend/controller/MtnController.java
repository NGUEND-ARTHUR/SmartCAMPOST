package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.payment.MtnInitRequest;
import com.smartcampost.backend.dto.payment.MtnTokenResponse;
import com.smartcampost.backend.service.MtnService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/payments/mtn")
@RequiredArgsConstructor
public class MtnController {

    private final MtnService mtnService;

    @Value("${mtn.consumer-key:}")
    private String mtnKey;

    @Value("${mtn.consumer-secret:}")
    private String mtnSecret;
    
    @Value("${mtn.token-url:}")
    private String mtnTokenUrl;

    @Value("${mtn.init-url:}")
    private String mtnInitUrl;

    /**
     * Returns a development token derived from consumer key/secret stored on the backend.
     * For production implement proper OAuth token exchange with MTN.
     */
    @PostMapping("/token")
    public ResponseEntity<?> token() {
        if (mtnKey == null || mtnKey.isBlank() || mtnSecret == null || mtnSecret.isBlank()) {
            return ResponseEntity.badRequest().body("MTN consumer credentials not configured on backend");
        }
        String basic = mtnService.getBasicTokenFromEnv(mtnKey, mtnSecret);
        // If a token URL is configured, perform a proper token exchange and return MTN response
        if (mtnTokenUrl != null && !mtnTokenUrl.isBlank()) {
            try {
                String body = mtnService.fetchTokenFromMtnApi(mtnTokenUrl, basic);
                // Attempt to extract access_token from MTN response
                ObjectMapper om = new ObjectMapper();
                JsonNode root = om.readTree(body);
                String access = null;
                if (root.has("access_token")) access = root.get("access_token").asText();
                else if (root.has("accessToken")) access = root.get("accessToken").asText();
                MtnTokenResponse out = new MtnTokenResponse();
                out.setToken(access == null ? body : access);
                return ResponseEntity.ok(out);
            } catch (Exception e) {
                return ResponseEntity.status(502).body("Failed to fetch token from MTN: " + e.getMessage());
            }
        }
        MtnTokenResponse out = new MtnTokenResponse();
        out.setToken(basic);
        return ResponseEntity.ok(out);
    }

    @PostMapping("/init")
    public ResponseEntity<?> init(@RequestBody MtnInitRequest req) {
        if (req == null || req.getAmount() == null || req.getMsisdn() == null) {
            return ResponseEntity.badRequest().body("Missing amount or msisdn");
        }
        // If an init URL is configured, try a real call using a token if available
        if (mtnInitUrl != null && !mtnInitUrl.isBlank()) {
            try {
                String basic = mtnService.getBasicTokenFromEnv(mtnKey, mtnSecret);
                String accessToken = null;
                if (mtnTokenUrl != null && !mtnTokenUrl.isBlank()) {
                    String tokenBody = mtnService.fetchTokenFromMtnApi(mtnTokenUrl, basic);
                    ObjectMapper om = new ObjectMapper();
                    JsonNode root = om.readTree(tokenBody);
                    if (root.has("access_token")) accessToken = root.get("access_token").asText();
                    else if (root.has("accessToken")) accessToken = root.get("accessToken").asText();
                }
                // build JSON body
                ObjectMapper om = new ObjectMapper();
                String json = om.writeValueAsString(req);
                String resp = mtnService.callInitEndpoint(mtnInitUrl, accessToken, json);
                return ResponseEntity.ok(om.readTree(resp));
            } catch (Exception e) {
                return ResponseEntity.status(502).body("Failed to call MTN init: " + e.getMessage());
            }
        }

        var res = mtnService.initPayment(req);
        return ResponseEntity.ok(res);
    }
}
