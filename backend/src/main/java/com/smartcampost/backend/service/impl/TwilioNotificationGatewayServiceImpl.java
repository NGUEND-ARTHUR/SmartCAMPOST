package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.service.NotificationGatewayService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.PostConstruct;
import java.util.Objects;

@Service
@ConditionalOnProperty(name = "notification.gateway", havingValue = "twilio")
@Slf4j
public class TwilioNotificationGatewayServiceImpl implements NotificationGatewayService {

    private String accountSid;
    private String authToken;
    private String fromNumber;
    private WebClient webClient;

    @PostConstruct
    public void init() {
        accountSid = System.getenv("TWILIO_ACCOUNT_SID");
        authToken = System.getenv("TWILIO_AUTH_TOKEN");
        fromNumber = System.getenv("TWILIO_FROM_NUMBER");

        if (accountSid == null || authToken == null || fromNumber == null) {
            log.error("Twilio is enabled but TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER not set");
        }
        webClient = WebClient.builder().baseUrl("https://api.twilio.com/2010-04-01").build();
        log.info("Twilio gateway initialized (from={})", fromNumber);
    }

    @Override
    public void sendSms(String phone, String message) throws Exception {
        if (accountSid == null || authToken == null || fromNumber == null) {
            throw new IllegalStateException("Twilio not configured");
        }

        String sid = Objects.requireNonNull(accountSid, "TWILIO_ACCOUNT_SID is required");
        String token = Objects.requireNonNull(authToken, "TWILIO_AUTH_TOKEN is required");
        String from = Objects.requireNonNull(fromNumber, "TWILIO_FROM_NUMBER is required");
        String to = Objects.requireNonNull(phone, "phone is required");
        String body = Objects.requireNonNull(message, "message is required");

        log.info("📲 [TWILIO SMS] to={} | chars={}", maskPhone(phone), message != null ? message.length() : 0);

        var response = webClient.post()
            .uri(uriBuilder -> uriBuilder.path("/Accounts/{AccountSid}/Messages.json").build(sid))
            .headers(h -> h.setBasicAuth(sid, token))
            .body(BodyInserters.fromFormData("To", to)
                .with("From", from)
                .with("Body", body))
                .retrieve()
                .toBodilessEntity()
                .block();

        if (response == null || !response.getStatusCode().is2xxSuccessful()) {
            throw new IllegalStateException("Failed to send SMS via Twilio");
        }
    }

    @Override
    public void sendEmail(String to, String subject, String body) throws Exception {
        throw new UnsupportedOperationException("Twilio implementation does not support email");
    }

    private String maskPhone(String phone) {
        if (phone == null) return "";
        String trimmed = phone.trim();
        if (trimmed.length() <= 4) return "****";
        return "****" + trimmed.substring(trimmed.length() - 4);
    }
}
