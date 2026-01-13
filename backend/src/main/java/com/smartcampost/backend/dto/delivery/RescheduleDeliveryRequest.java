package com.smartcampost.backend.dto.delivery;

import lombok.Data;

import java.time.LocalDate;

/**
 * Request to reschedule a delivery.
 */
@Data
public class RescheduleDeliveryRequest {

    private LocalDate newDate;
    private String timeWindow;       // e.g., "09:00-12:00"
    private String reason;           // Reason for rescheduling
    private String contactPhone;     // Contact phone for delivery
    private String deliveryNotes;    // Special instructions
}
