package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.service.PaymentGatewayService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Slf4j
public class MockPaymentGatewayServiceImpl implements PaymentGatewayService {

    @Override
    public String initiatePayment(String payerPhone, Double amount, String currency, String description) {
        String txId = "MOCK-" + UUID.randomUUID();
        log.info("🧪 [MOCK GATEWAY] Initiate payment: phone={}, amount={}, currency={}, desc={}, txId={}",
                payerPhone, amount, currency, description, txId);
        return txId;
    }

    @Override
    public boolean verifyPayment(String externalRef) {
        log.info("🧪 [MOCK GATEWAY] Verify payment for externalRef={}", externalRef);
        // Pour l’instant on dit toujours "OK"
        return true;
    }
}
