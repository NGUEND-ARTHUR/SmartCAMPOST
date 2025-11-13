package com.smartcampost.backend.service;

import java.math.BigDecimal;

public interface PaymentGatewayService {

    String createMobileMoneyPayment(String phoneNumber, BigDecimal amount, String currency, String reference);
}
