package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.service.PaymentGatewayService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Slf4j
@ConditionalOnProperty(name = "payment.gateway", havingValue = "mock")
public class MockPaymentGatewayServiceImpl implements PaymentGatewayService {

    @jakarta.annotation.PostConstruct
    public void warnMockActive() {
        log.warn("[MOCK GATEWAY] Payment gateway is MOCK — no real payments will be processed. "
                + "Set PAYMENT_GATEWAY=fapshi for production.");
    }

    @Override
    public String initiatePayment(String payerPhone, Double amount, String currency, String description) {
        String txId = "MOCK-" + UUID.randomUUID();
        log.warn("[MOCK GATEWAY] Simulated payment: phone={}, amount={} {}, txId={}",
                payerPhone, amount, currency, txId);
        return txId;
    }

    @Override
    public boolean verifyPayment(String externalRef) {
        log.warn("[MOCK GATEWAY] Verify called for {} — returning false (mock cannot verify real payments)",
                externalRef);
        return false;
    }
}
