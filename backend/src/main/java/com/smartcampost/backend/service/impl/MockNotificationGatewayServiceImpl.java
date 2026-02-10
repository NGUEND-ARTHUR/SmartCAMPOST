package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.service.NotificationGatewayService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Service
@ConditionalOnProperty(name = "notification.gateway", havingValue = "mock", matchIfMissing = true)
@Slf4j
public class MockNotificationGatewayServiceImpl implements NotificationGatewayService {

    @Override
    public void sendSms(String phone, String message) throws Exception {
        log.info("📲 [MOCK SMS] to={} | chars={}", maskPhone(phone), message != null ? message.length() : 0);
        // Ici tu pourrais simuler une erreur en lançant une Exception si tu veux tester le retry
    }

    @Override
    public void sendEmail(String to, String subject, String body) throws Exception {
        log.info("📧 [MOCK EMAIL] to={} | subject={} | body={}", to, subject, body);
    }

    private String maskPhone(String phone) {
        if (phone == null) return "";
        String trimmed = phone.trim();
        if (trimmed.length() <= 4) return "****";
        return "****" + trimmed.substring(trimmed.length() - 4);
    }
}
