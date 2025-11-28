package com.smartcampost.backend.model.enums;

public enum PaymentStatus {
    PENDING,   // paiement initié, en attente de confirmation
    SUCCESS,   // paiement confirmé / réussi
    FAILED,    // échec
    CANCELLED  // annulé (par le user ou le système)
}
