package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.delivery.*;
import com.smartcampost.backend.dto.parcel.ParcelResponse;
import com.smartcampost.backend.dto.parcel.UpdateParcelStatusRequest;
import com.smartcampost.backend.dto.scan.ScanEventCreateRequest;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
@Tag(name = "Delivery", description = "Home delivery and agency pickup workflow endpoints")
public class DeliveryController {

    private final DeliveryOtpService deliveryOtpService;
    private final DeliveryProofService deliveryProofService;
    private final ScanEventService scanEventService;
    private final ParcelService parcelService;
    private final PaymentService paymentService;
    private final DeliveryService deliveryService;

    @PostMapping("/otp/send")
    public ResponseEntity<Void> sendDeliveryOtp(@RequestBody DeliveryOtpSendRequest request) {
        if (request.getLatitude() == null || request.getLongitude() == null) {
            return ResponseEntity.badRequest().build();
        }
        deliveryOtpService.sendDeliveryOtp(request.getParcelId(), request.getPhoneNumber());

        // Record OTP_SENT as an operational ScanEvent (GPS mandatory)
        ScanEventCreateRequest otpEvt = new ScanEventCreateRequest();
        otpEvt.setParcelId(request.getParcelId());
        otpEvt.setEventType(ScanEventType.OTP_SENT.name());
        otpEvt.setLatitude(request.getLatitude());
        otpEvt.setLongitude(request.getLongitude());
        otpEvt.setLocationSource("DEVICE_GPS");
        otpEvt.setDeviceTimestamp(java.time.Instant.now());
        otpEvt.setLocationNote(request.getNotes());
        otpEvt.setComment("OTP_SENT");
        scanEventService.recordScanEvent(otpEvt);
        return ResponseEntity.ok().build();
    }

    // (optionnel mais utile) endpoint dédié pour juste vérifier l’OTP
    @PostMapping("/otp/verify")
    public ResponseEntity<Boolean> verifyDeliveryOtp(@RequestBody DeliveryOtpVerificationRequest request) {
        boolean valid = deliveryOtpService.validateDeliveryOtp(request.getParcelId(), request.getOtpCode());

        // Record OTP_VERIFIED only when valid (GPS mandatory)
        if (valid) {
            if (request.getLatitude() == null || request.getLongitude() == null) {
                return ResponseEntity.badRequest().build();
            }
            ScanEventCreateRequest otpEvt = new ScanEventCreateRequest();
            otpEvt.setParcelId(request.getParcelId());
            otpEvt.setEventType(ScanEventType.OTP_VERIFIED.name());
            otpEvt.setLatitude(request.getLatitude());
            otpEvt.setLongitude(request.getLongitude());
            otpEvt.setLocationSource("DEVICE_GPS");
            otpEvt.setDeviceTimestamp(java.time.Instant.now());
            otpEvt.setLocationNote(request.getNotes());
            otpEvt.setComment("OTP_VERIFIED");
            scanEventService.recordScanEvent(otpEvt);
        }
        return ResponseEntity.ok(valid);
    }

    @PostMapping("/final")
    public ResponseEntity<ParcelResponse> confirmFinalDelivery(
            @RequestBody FinalDeliveryRequest request
    ) {
        DeliveryOtpVerificationRequest otpRequest = request.getOtp();
        DeliveryProofRequest proofRequest = request.getProof();

        if (otpRequest == null || proofRequest == null) {
            return ResponseEntity.badRequest().build();
        }

        UUID parcelId = otpRequest.getParcelId();

        // 1) Vérifier OTP
        boolean valid = deliveryOtpService.validateDeliveryOtp(parcelId, otpRequest.getOtpCode());
        if (!valid) {
            return ResponseEntity.badRequest().build();
        }

        // 2) Enregistrer la preuve de livraison
        deliveryProofService.captureProof(proofRequest);

        // 3) Gérer le paiement COD éventuel (SPRINT 14)
        //    -> PaymentService décidera s’il s’agit d’un colis COD ou non.
        paymentService.markCodAsPaid(parcelId);

        // 4) S’assurer que le statut du colis est bien DELIVERED (GPS mandatory)
        if (request.getLatitude() == null || request.getLongitude() == null) {
            return ResponseEntity.badRequest().build();
        }

        UpdateParcelStatusRequest statusRequest = new UpdateParcelStatusRequest();
        statusRequest.setStatus(ParcelStatus.DELIVERED);
        statusRequest.setLatitude(request.getLatitude());
        statusRequest.setLongitude(request.getLongitude());
        statusRequest.setLocationSource("DEVICE_GPS");
        statusRequest.setDeviceTimestamp(java.time.Instant.now());
        statusRequest.setLocationNote(request.getNotes());
        statusRequest.setProofUrl(proofRequest.getDetails());
        statusRequest.setComment("DELIVERY_FINAL_CONFIRM");
        ParcelResponse response = parcelService.updateParcelStatus(parcelId, statusRequest);

        return ResponseEntity.ok(response);
    }
    // ==================== NEW ENHANCED DELIVERY WORKFLOW ====================

    @Operation(summary = "Start delivery",
               description = "Courier marks parcel as OUT_FOR_DELIVERY and sends OTP to recipient")
    @PostMapping("/start")
    public ResponseEntity<StartDeliveryResponse> startDelivery(
            @Valid @RequestBody StartDeliveryRequest request
    ) {
        return ResponseEntity.ok(deliveryService.startDelivery(request));
    }

    @Operation(summary = "Re-send delivery OTP",
               description = "Re-send OTP to recipient phone number")
    @PostMapping("/{parcelId}/otp/resend")
    public ResponseEntity<Void> resendOtp(
            @PathVariable UUID parcelId,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) String notes
    ) {
        deliveryService.sendDeliveryOtp(parcelId, latitude, longitude, notes);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Complete delivery with full verification",
               description = "Verify OTP, capture proof (signature/photo), handle COD payment, and mark parcel as DELIVERED")
    @PostMapping("/complete")
    public ResponseEntity<CompleteDeliveryResponse> completeDelivery(
            @Valid @RequestBody CompleteDeliveryRequest request
    ) {
        return ResponseEntity.ok(deliveryService.completeDelivery(request));
    }

    @Operation(summary = "Get delivery status",
               description = "Get complete delivery status and information for a parcel")
    @GetMapping("/{parcelId}/status")
    public ResponseEntity<DeliveryStatusResponse> getDeliveryStatus(@PathVariable UUID parcelId) {
        return ResponseEntity.ok(deliveryService.getDeliveryStatus(parcelId));
    }

    @Operation(summary = "Mark delivery as failed",
               description = "Record a failed delivery attempt with reason")
    @PostMapping("/{parcelId}/failed")
    public ResponseEntity<DeliveryStatusResponse> markDeliveryFailed(
            @PathVariable UUID parcelId,
            @RequestParam String reason,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) String notes
    ) {
        return ResponseEntity.ok(deliveryService.markDeliveryFailed(parcelId, reason, latitude, longitude, notes));
    }

    @Operation(summary = "Reschedule delivery",
               description = "Reschedule delivery for a later date")
    @PostMapping("/{parcelId}/reschedule")
    public ResponseEntity<DeliveryStatusResponse> rescheduleDelivery(
            @PathVariable UUID parcelId,
            @Valid @RequestBody RescheduleDeliveryRequest request
    ) {
        return ResponseEntity.ok(deliveryService.rescheduleDelivery(parcelId, request));
    }

    @Operation(summary = "Pickup at agency",
               description = "Verify OTP and mark parcel as PICKED_UP_AT_AGENCY (GPS required)")
    @PostMapping("/pickup/agency")
    public ResponseEntity<PickupAtAgencyResponse> pickupAtAgency(
            @Valid @RequestBody PickupAtAgencyRequest request
    ) {
        return ResponseEntity.ok(deliveryService.pickupAtAgency(request));
    }

    @Operation(summary = "Return to sender",
               description = "Record RETURNED_TO_SENDER (GPS required)")
    @PostMapping("/{parcelId}/return-to-sender")
    public ResponseEntity<DeliveryStatusResponse> returnToSender(
            @PathVariable UUID parcelId,
            @Valid @RequestBody ReturnToSenderRequest request
    ) {
        return ResponseEntity.ok(deliveryService.returnToSender(parcelId, request));
    }

}
