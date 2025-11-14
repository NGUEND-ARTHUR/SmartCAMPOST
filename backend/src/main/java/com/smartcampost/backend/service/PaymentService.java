package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.payment.PaymentInitRequest;
import com.smartcampost.backend.dto.payment.PaymentResponse;

import java.util.List;
import java.util.UUID;

public interface PaymentService {

    /**
     * Initie un paiement pour un colis.
     */
    PaymentResponse initiatePayment(PaymentInitRequest request);

    /**
     * Complète un paiement (callback après succès/échec du provider).
     */
    PaymentResponse completePayment(UUID paymentId, boolean success, String externalRef);

    /**
     * Liste tous les paiements liés à un colis.
     */
    List<PaymentResponse> listPaymentsForParcel(UUID parcelId);
}
