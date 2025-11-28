package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.payment.ConfirmPaymentRequest;
import com.smartcampost.backend.dto.payment.InitPaymentRequest;
import com.smartcampost.backend.dto.payment.PaymentResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface PaymentService {

    PaymentResponse initPayment(InitPaymentRequest request);

    PaymentResponse confirmPayment(ConfirmPaymentRequest request);

    PaymentResponse getPaymentById(UUID paymentId);

    List<PaymentResponse> getPaymentsForParcel(UUID parcelId);

    Page<PaymentResponse> listAllPayments(int page, int size);
}
