package com.smartcampost.backend.dto.delivery;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Complete delivery status information.
 */
@Data
@Builder
public class DeliveryStatusResponse {

    private UUID parcelId;
    private String trackingRef;
    private String status;
    private String deliveryOption;   // AGENCY or HOME

    // Current location/stage
    private String currentStage;     // e.g., "At destination agency", "Out for delivery"
    private String currentAgencyName;

    // Recipient info
    private String recipientName;
    private String recipientCity;

    // Courier info (if assigned)
    private UUID courierId;
    private String courierName;
    private String courierPhone;

    // Delivery attempts
    private int attemptCount;
    private List<DeliveryAttempt> attempts;

    @Data
    @Builder
    public static class DeliveryAttempt {
        private int attemptNumber;
        private Instant attemptedAt;
        private String result;       // SUCCESS, FAILED
        private String failureReason;
        private Double latitude;
        private Double longitude;
    }

    // Delivery proof (if delivered)
    private UUID proofId;
    private String proofType;
    private Instant deliveredAt;
    private String receiverName;

    // OTP status
    private boolean otpSent;
    private Instant otpSentAt;

    // Scheduling
    private Instant scheduledDeliveryAt;
    private boolean isRescheduled;

    // Payment (if COD)
    private boolean paymentRequired;
    private Double amountDue;
    private boolean paymentCollected;
}
