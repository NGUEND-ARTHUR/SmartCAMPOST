package com.smartcampost.backend.service;

public interface PaymentGatewayService {

    /**
     * Initialise un paiement auprès d'un gateway externe.
     * Retourne une référence externe (transactionId).
     */
    String initiatePayment(String payerPhone, Double amount, String currency, String description);

    /**
     * Vérifie le statut vrai / faux d'une transaction auprès du gateway.
     * Pour l'instant on mock, tu pourras implémenter l’appel réel plus tard.
     */
    boolean verifyPayment(String externalRef);
}
