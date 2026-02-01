package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.service.NotificationGatewayService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.PostConstruct;

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

        log.info("📲 [TWILIO SMS] to={} | msg={}", phone, message);

        var response = webClient.post()
                .uri(uriBuilder -> uriBuilder.path("/Accounts/{AccountSid}/Messages.json").build(accountSid))
                .headers(h -> h.setBasicAuth(accountSid, authToken))
                .body(BodyInserters.fromFormData("To", phone)
                        .with("From", fromNumber)
                        .with("Body", message))
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
}
