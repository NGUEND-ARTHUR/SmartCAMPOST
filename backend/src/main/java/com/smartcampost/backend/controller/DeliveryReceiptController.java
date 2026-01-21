package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.delivery.DeliveryReceiptResponse;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.DeliveryReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
public class DeliveryReceiptController {

    private final DeliveryReceiptService deliveryReceiptService;
    private final ParcelRepository parcelRepository;
    private final UserAccountRepository userAccountRepository;

    @GetMapping("/parcel/{parcelId}")
    public ResponseEntity<DeliveryReceiptResponse> getByParcel(@PathVariable UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        UserAccount user = getCurrentUserAccount();

        if (user.getRole() == UserRole.CLIENT) {
            if (!parcel.getClient().getId().equals(user.getEntityId())) {
                throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "You do not own this parcel");
            }
        }

        if (user.getRole() == UserRole.COURIER) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Courier cannot access receipts");
        }

        DeliveryReceiptResponse receipt = deliveryReceiptService.getReceiptByParcelId(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found", ErrorCode.BUSINESS_ERROR));

        return ResponseEntity.ok(receipt);
    }

    @GetMapping("/number/{receiptNumber}")
    public ResponseEntity<DeliveryReceiptResponse> getByNumber(@PathVariable String receiptNumber) {
        DeliveryReceiptResponse receipt = deliveryReceiptService.getReceiptByNumber(receiptNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found", ErrorCode.BUSINESS_ERROR));

        // Enforce client access: clients can only access receipts for their parcels
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() == UserRole.CLIENT) {
            Parcel parcel = parcelRepository.findById(receipt.getParcelId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
            if (!parcel.getClient().getId().equals(user.getEntityId())) {
                throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "You do not own this parcel");
            }
        }

        if (user.getRole() == UserRole.COURIER) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Courier cannot access receipts");
        }

        return ResponseEntity.ok(receipt);
    }

    private UserAccount getCurrentUserAccount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthenticated");
        }

        String subject = auth.getName();

        try {
            UUID id = UUID.fromString(subject);
            return userAccountRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found", ErrorCode.AUTH_USER_NOT_FOUND));
        } catch (IllegalArgumentException ex) {
            return userAccountRepository.findByPhone(subject)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found", ErrorCode.AUTH_USER_NOT_FOUND));
        }
    }
}
