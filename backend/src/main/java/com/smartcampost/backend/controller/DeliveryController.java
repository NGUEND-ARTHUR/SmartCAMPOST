package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.delivery.DeliveryOtpSendRequest;
import com.smartcampost.backend.dto.delivery.DeliveryOtpVerificationRequest;
import com.smartcampost.backend.dto.delivery.DeliveryProofRequest;
import com.smartcampost.backend.dto.delivery.FinalDeliveryRequest;
import com.smartcampost.backend.dto.parcel.ParcelResponse;
import com.smartcampost.backend.dto.parcel.UpdateParcelStatusRequest;
import com.smartcampost.backend.dto.scan.ScanEventCreateRequest;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.model.enums.ScanEventType;
import com.smartcampost.backend.service.DeliveryOtpService;
import com.smartcampost.backend.service.DeliveryProofService;
import com.smartcampost.backend.service.ParcelService;
import com.smartcampost.backend.service.ScanEventService;
import com.smartcampost.backend.service.PaymentService;   // 🔥 NEW
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryOtpService deliveryOtpService;
    private final DeliveryProofService deliveryProofService;
    private final ScanEventService scanEventService;
    private final ParcelService parcelService;
    private final PaymentService paymentService; // 🔥 NEW

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
}
