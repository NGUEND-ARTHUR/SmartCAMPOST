package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Payment;
import com.smartcampost.backend.model.enums.CurrencyCode;
import com.smartcampost.backend.model.enums.PaymentMethod;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface PaymentService {

    Payment initiatePayment(UUID parcelId,
                            BigDecimal amount,
                            CurrencyCode currency,
                            PaymentMethod method);

    Payment markAsPaid(UUID paymentId, String externalRef);

    Payment markAsFailed(UUID paymentId, String reason);

    List<Payment> listPaymentsForParcel(UUID parcelId);
}
