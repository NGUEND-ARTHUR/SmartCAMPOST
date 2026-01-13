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
        deliveryOtpService.sendDeliveryOtp(request.getParcelId(), request.getPhoneNumber());
        return ResponseEntity.ok().build();
    }

    // (optionnel mais utile) endpoint dédié pour juste vérifier l’OTP
    @PostMapping("/otp/verify")
    public ResponseEntity<Boolean> verifyDeliveryOtp(@RequestBody DeliveryOtpVerificationRequest request) {
        boolean valid = deliveryOtpService.validateDeliveryOtp(request.getParcelId(), request.getOtpCode());
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

        // 2) Créer un scan "DELIVERED" (US38)
        ScanEventCreateRequest scanReq = new ScanEventCreateRequest();
        scanReq.setParcelId(parcelId);
        scanReq.setEventType(ScanEventType.DELIVERED.name());
        // agencyId, agentId, locationNote peuvent être null ici ou ajoutés plus tard
        scanEventService.recordScanEvent(scanReq);

        // 3) Enregistrer la preuve de livraison
        deliveryProofService.captureProof(proofRequest);

        // 4) Gérer le paiement COD éventuel (SPRINT 14)
        //    -> PaymentService décidera s’il s’agit d’un colis COD ou non.
        paymentService.markCodAsPaid(parcelId);

        // 5) S’assurer que le statut du colis est bien DELIVERED
        UpdateParcelStatusRequest statusRequest = new UpdateParcelStatusRequest();
        statusRequest.setStatus(ParcelStatus.DELIVERED);
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
    public ResponseEntity<Void> resendOtp(@PathVariable UUID parcelId) {
        deliveryService.sendDeliveryOtp(parcelId);
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
            @RequestParam String reason
    ) {
        return ResponseEntity.ok(deliveryService.markDeliveryFailed(parcelId, reason));
    }

    @Operation(summary = "Reschedule delivery",
               description = "Reschedule delivery for a later date")
    @PostMapping("/{parcelId}/reschedule")
    public ResponseEntity<DeliveryStatusResponse> rescheduleDelivery(
            @PathVariable UUID parcelId,
            @Valid @RequestBody RescheduleDeliveryRequest request
    ) {
        return ResponseEntity.ok(deliveryService.rescheduleDelivery(parcelId, request));
    }}
