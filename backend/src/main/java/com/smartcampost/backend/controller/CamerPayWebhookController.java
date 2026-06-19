package com.smartcampost.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.enums.PaymentStatus;
import com.smartcampost.backend.repository.PaymentRepository;
import com.smartcampost.backend.service.impl.CamerPayPaymentGatewayServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/webhooks/camerpay")
@RequiredArgsConstructor
@Slf4j
public class CamerPayWebhookController {

    private final ObjectMapper objectMapper;
    private final PaymentRepository paymentRepository;

    @Value("${camerpay.hmac.secret:}")
    private String hmacSecret;

    @PostMapping
    public ResponseEntity<Map<String, Object>> handle(
            @RequestBody String body,
            @RequestHeader Map<String, String> headers
    ) {
        if (!isSignatureValid(body, headers)) {
            log.warn("Rejected CamerPay webhook with invalid signature");
            return ResponseEntity.status(401).body(Map.of("accepted", false, "reason", "invalid_signature"));
        }

        try {
            JsonNode root = objectMapper.readTree(body);
            String externalRef = CamerPayPaymentGatewayServiceImpl.firstText(
                    root,
                    "transaction_uuid", "transactionId", "transaction_id", "reference", "externalRef", "external_ref", "id", "payment_id"
            );
            String status = CamerPayPaymentGatewayServiceImpl.firstText(root, "status", "state", "payment_status");
            if (externalRef == null || externalRef.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("accepted", false, "reason", "missing_reference"));
            }

            Payment payment = paymentRepository.findFirstByExternalRefOrderByTimestampDesc(externalRef)
                    .orElse(null);
            if (payment == null) {
                log.warn("CamerPay webhook received for unknown externalRef={}", externalRef);
                return ResponseEntity.ok(Map.of("accepted", true, "matched", false));
            }

            payment.setStatus(toPaymentStatus(status));
            paymentRepository.save(payment);
            return ResponseEntity.ok(Map.of(
                    "accepted", true,
                    "matched", true,
                    "paymentId", payment.getId().toString(),
                    "status", payment.getStatus().name()
            ));
        } catch (Exception ex) {
            log.error("Failed to process CamerPay webhook", ex);
            return ResponseEntity.badRequest().body(Map.of("accepted", false, "reason", "invalid_payload"));
        }
    }

    private PaymentStatus toPaymentStatus(String status) {
        if (CamerPayPaymentGatewayServiceImpl.isSuccessfulStatus(status)) return PaymentStatus.SUCCESS;
        if (status == null || status.isBlank()) return PaymentStatus.PENDING;
        return switch (status.trim().toUpperCase()) {
            case "FAILED", "FAILURE", "DECLINED", "REJECTED", "ERROR" -> PaymentStatus.FAILED;
            case "CANCELLED", "CANCELED", "EXPIRED" -> PaymentStatus.CANCELLED;
            default -> PaymentStatus.PENDING;
        };
    }

    private boolean isSignatureValid(String body, Map<String, String> headers) {
        if (hmacSecret == null || hmacSecret.isBlank()) {
            log.warn("CamerPay HMAC secret not configured; webhook rejected");
            return false;
        }
        String received = firstHeader(headers,
                "x-camerpay-signature",
                "x-signature",
                "signature",
                "x-webhook-signature",
                "x-hmac-signature"
        );
        if (received == null || received.isBlank()) {
            return false;
        }
        String normalized = received.replace("sha256=", "").trim();
        String expected = hmacSha256(body, hmacSecret);
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                normalized.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String firstHeader(Map<String, String> headers, String... names) {
        for (String name : names) {
            String direct = headers.get(name);
            if (direct != null) return direct;
            for (Map.Entry<String, String> entry : headers.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(name)) return entry.getValue();
            }
        }
        return null;
    }

    private String hmacSha256(String body, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to compute CamerPay HMAC", ex);
        }
    }
}
