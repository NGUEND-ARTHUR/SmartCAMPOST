package com.smartcampost.backend.service.impl;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.smartcampost.backend.dto.qr.QrCodeData;
import com.smartcampost.backend.dto.qr.QrLabelData;
import com.smartcampost.backend.dto.qr.SecureQrPayload;
import com.smartcampost.backend.dto.qr.TemporaryQrData;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.model.*;
import com.smartcampost.backend.model.enums.PaymentStatus;
import com.smartcampost.backend.repository.*;
import com.smartcampost.backend.service.QrCodeService;
import com.smartcampost.backend.service.QrSecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QrCodeServiceImpl implements QrCodeService {

    private final ParcelRepository parcelRepository;
    private final PickupRequestRepository pickupRequestRepository;
    private final ScanEventRepository scanEventRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final PricingDetailRepository pricingDetailRepository;
    private final DeliveryProofRepository deliveryProofRepository;
    private final QrSecurityService qrSecurityService;

    // Temporary QR tokens storage (in production, use Redis)
    private final Map<String, TemporaryQrData> temporaryQrTokens = new ConcurrentHashMap<>();

    private static final int QR_WIDTH = 300;
    private static final int QR_HEIGHT = 300;
    private static final int TEMPORARY_QR_VALIDITY_HOURS = 48;

    // ==================== PERMANENT QR (PARCEL) ====================

    @Override
    public QrCodeData generateQrCode(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        return buildQrCodeData(parcel);
    }

    @Override
    public QrCodeData getQrCodeByTracking(String trackingRef) {
        Parcel parcel = parcelRepository.findByTrackingRef(trackingRef)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        return buildQrCodeData(parcel);
    }

    @Override
    public String generateQrCodeImage(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
        
        // Generate secure QR code with anti-forgery token
        SecureQrPayload securePayload = qrSecurityService.generatePermanentToken(parcel);
        return generateQrImage(securePayload.toCompactString());
    }

    @Override
    public String generateQrCodeImageByTracking(String trackingRef) {
        // Verify parcel exists and generate secure QR
        Parcel parcel = parcelRepository.findByTrackingRef(trackingRef)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        // Generate secure QR code with anti-forgery token
        SecureQrPayload securePayload = qrSecurityService.generatePermanentToken(parcel);
        return generateQrImage(securePayload.toCompactString());
    }

    // ==================== TEMPORARY QR (PICKUP) ====================

    @Override
    public TemporaryQrData generateTemporaryQrForPickup(UUID pickupId) {
        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pickup request not found", ErrorCode.PICKUP_NOT_FOUND));

        Parcel parcel = pickup.getParcel();
        Client client = parcel.getClient();
        Address senderAddress = parcel.getSenderAddress();
        Agency destAgency = parcel.getDestinationAgency();
        Address recipientAddress = parcel.getRecipientAddress();
        // Get recipient phone from recipient client if available, otherwise use sender client phone
        String recipientPhone = client.getPhone(); // Default to sender phone

        // Generate secure temporary token
        String temporaryToken = generateSecureToken();
        Instant expiresAt = Instant.now().plus(TEMPORARY_QR_VALIDITY_HOURS, ChronoUnit.HOURS);

        // Generate temporary tracking reference
        String preTrackingRef = "TMP-" + parcel.getTrackingRef();

        TemporaryQrData tempQr = TemporaryQrData.builder()
                .pickupId(pickupId)
                .temporaryToken(temporaryToken)
                .expiresAt(expiresAt)
                .isValid(true)
                .parcelId(parcel.getId())
                .preTrackingRef(preTrackingRef)
                .contentType(parcel.getDescriptionComment())
                .estimatedWeight(parcel.getWeight())
                .dimensions(parcel.getDimensions())
                .declaredValue(parcel.getDeclaredValue())
                .fragile(parcel.isFragile())
                .photoUrl(parcel.getPhotoUrl())
                .descriptionComment(parcel.getDescriptionComment())
                .clientId(client.getId())
                .clientName(client.getFullName())
                .clientPhone(client.getPhone())
                .addressId(senderAddress != null ? senderAddress.getId() : null)
                .pickupAddressLabel(senderAddress != null ? senderAddress.getLabel() : null)
                .city(senderAddress != null ? senderAddress.getCity() : null)
                .region(senderAddress != null ? senderAddress.getRegion() : null)
                .latitude(senderAddress != null && senderAddress.getLatitude() != null ? senderAddress.getLatitude().doubleValue() : null)
                .longitude(senderAddress != null && senderAddress.getLongitude() != null ? senderAddress.getLongitude().doubleValue() : null)
                .requestedDate(pickup.getRequestedDate())
                .timeWindow(pickup.getTimeWindow())
                .destinationAgencyId(destAgency != null ? destAgency.getId() : null)
                .destinationAgencyName(destAgency != null ? destAgency.getAgencyName() : null)
                .recipientName(recipientAddress != null ? recipientAddress.getLabel() : null)
                .recipientPhone(recipientPhone) // Use client phone as fallback
                .createdAt(Instant.now())
                .build();

        // Generate secure QR code with anti-forgery token for the temporary pickup
        SecureQrPayload securePayload = qrSecurityService.generateTemporaryToken(pickup, TEMPORARY_QR_VALIDITY_HOURS);
        String qrImage = generateQrImage(securePayload.toCompactString());
        tempQr.setQrCodeImage(qrImage);
        
        // Also store the secure token in the temp QR data
        tempQr.setTemporaryToken(securePayload.getToken());

        // Store token for later validation (legacy support)
        temporaryQrTokens.put(temporaryToken, tempQr);
        // Also store with secure token
        temporaryQrTokens.put(securePayload.getToken(), tempQr);

        log.info("Generated secure temporary QR for pickup {} with token {}", pickupId, securePayload.getToken());

        return tempQr;
    }

    @Override
    public TemporaryQrData validateTemporaryQr(String temporaryQrToken) {
        // First try the legacy in-memory cache
        TemporaryQrData tempQr = temporaryQrTokens.get(temporaryQrToken);

        if (tempQr == null) {
            // Try to validate via the security service (database lookup)
            if (qrSecurityService.isValidToken(temporaryQrToken)) {
                // Token exists in DB but not in memory cache - this is a valid scenario
                log.debug("Token {} found in security service but not in memory cache", temporaryQrToken);
            }
            throw new ResourceNotFoundException(
                    "Temporary QR code not found or expired",
                    ErrorCode.QR_CODE_INVALID);
        }

        // Check expiration
        if (Instant.now().isAfter(tempQr.getExpiresAt())) {
            temporaryQrTokens.remove(temporaryQrToken);
            throw new AuthException(ErrorCode.QR_CODE_EXPIRED, "Temporary QR code has expired");
        }

        if (!tempQr.isValid()) {
            throw new AuthException(ErrorCode.QR_CODE_ALREADY_USED, "Temporary QR code has already been used");
        }

        return tempQr;
    }

    @Override
    public QrCodeData convertTemporaryToPermanent(UUID pickupId) {
        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pickup request not found", ErrorCode.PICKUP_NOT_FOUND));

        Parcel parcel = pickup.getParcel();

        // Invalidate any temporary QR tokens for this pickup
        temporaryQrTokens.entrySet().removeIf(entry ->
                entry.getValue().getPickupId().equals(pickupId));

        // Generate permanent QR code
        return buildQrCodeData(parcel);
    }

    // ==================== QR LABEL FOR PRINTING ====================

    @Override
    public QrLabelData generatePrintableLabel(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        return buildLabelData(parcel);
    }

    @Override
    public QrLabelData generatePrintableLabelByTracking(String trackingRef) {
        Parcel parcel = parcelRepository.findByTrackingRef(trackingRef)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parcel not found", ErrorCode.PARCEL_NOT_FOUND));

        return buildLabelData(parcel);
    }

    // ==================== PRIVATE HELPERS ====================

    private QrCodeData buildQrCodeData(Parcel parcel) {
        Client client = parcel.getClient();
        Address sender = parcel.getSenderAddress();
        Address recipient = parcel.getRecipientAddress();
        Agency origin = parcel.getOriginAgency();
        Agency destination = parcel.getDestinationAgency();

        // Fetch related data using correct repository methods
        List<ScanEvent> scanEvents = scanEventRepository
                .findByParcel_IdOrderByTimestampAsc(parcel.getId());
        List<Payment> payments = paymentRepository.findByParcel_IdOrderByTimestampDesc(parcel.getId());
        Optional<PricingDetail> pricingOpt = pricingDetailRepository.findTopByParcel_IdOrderByAppliedAtDesc(parcel.getId());
        Optional<PickupRequest> pickupOpt = pickupRequestRepository.findByParcel_Id(parcel.getId());
        Optional<DeliveryProof> proofOpt = deliveryProofRepository.findByParcel(parcel);

        // Build scan history
        List<QrCodeData.ScanEventRecord> scanHistory = scanEvents.stream()
                .map(e -> QrCodeData.ScanEventRecord.builder()
                        .eventId(e.getId())
                        .eventType(e.getEventType().name())
                        .timestamp(e.getTimestamp())
                        .agencyName(e.getAgency() != null ? e.getAgency().getAgencyName() : null)
                        .agentName(e.getAgent() != null ? e.getAgent().getFullName() : null)
                        .locationNote(e.getLocationNote())
                        .build())
                .collect(Collectors.toList());

        // Build payment records (Payment model has: amount, method, status, timestamp, externalRef)
        List<QrCodeData.PaymentRecord> paymentRecords = payments.stream()
                .map(p -> QrCodeData.PaymentRecord.builder()
                        .paymentId(p.getId())
                        .amount(p.getAmount())
                        .method(p.getMethod().name())
                        .status(p.getStatus().name())
                        .paidAt(p.getTimestamp()) // Use timestamp as paidAt
                        .transactionRef(p.getExternalRef()) // Use externalRef as transactionRef
                        .build())
                .collect(Collectors.toList());

        // Calculate payment totals
        double totalPaid = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(Payment::getAmount)
                .sum();

        // Get refunds via payments
        List<QrCodeData.RefundRecord> refundRecords = new ArrayList<>();
        for (Payment payment : payments) {
            List<Refund> refunds = refundRepository.findByPayment(payment);
            for (Refund r : refunds) {
                refundRecords.add(QrCodeData.RefundRecord.builder()
                        .refundId(r.getId())
                        .amount(r.getAmount())
                        .reason(r.getReason())
                        .status(r.getStatus().name())
                        .processedAt(r.getProcessedAt())
                        .build());
            }
        }

        // Build pricing record (PricingDetail has only appliedPrice)
        Double totalDue = pricingOpt.map(PricingDetail::getAppliedPrice).orElse(0.0);
        QrCodeData.PricingRecord pricingRecord = pricingOpt.map(pd ->
                QrCodeData.PricingRecord.builder()
                        .basePrice(pd.getAppliedPrice()) // Use appliedPrice for all fields
                        .weightSurcharge(0.0)
                        .expressSurcharge(0.0)
                        .homeDeliverySurcharge(0.0)
                        .insuranceFee(0.0)
                        .totalPrice(pd.getAppliedPrice())
                        .currency("XAF")
                        .build()
        ).orElse(null);

        String paymentStatus = totalPaid >= totalDue ? "PAID" :
                (totalPaid > 0 ? "PARTIAL" : "PENDING");

        // Build pickup record
        QrCodeData.PickupRecord pickupRecord = pickupOpt.map(pu -> {
            Courier courier = pu.getCourier();
            return QrCodeData.PickupRecord.builder()
                    .pickupId(pu.getId())
                    .state(pu.getState().name())
                    .requestedDate(pu.getRequestedDate() != null ? pu.getRequestedDate().toString() : null)
                    .timeWindow(pu.getTimeWindow())
                    .courierId(courier != null ? courier.getId() : null)
                    .courierName(courier != null ? courier.getFullName() : null)
                    .build();
        }).orElse(null);

        // Build delivery proof record
        QrCodeData.DeliveryProofRecord proofRecord = proofOpt.map(dp -> {
            Courier courier = dp.getCourier();
            return QrCodeData.DeliveryProofRecord.builder()
                    .proofId(dp.getId())
                    .proofType(dp.getProofType().name())
                    .details(dp.getDetails())
                    .timestamp(dp.getTimestamp())
                    .courierName(courier != null ? courier.getFullName() : null)
                    .build();
        }).orElse(null);

        // Generate secure QR code with anti-forgery token
        SecureQrPayload securePayload = qrSecurityService.generatePermanentToken(parcel);
        String qrImage = generateQrImage(securePayload.toCompactString());

        return QrCodeData.builder()
                .parcelId(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .status(parcel.getStatus().name())
                .serviceType(parcel.getServiceType().name())
                .deliveryOption(parcel.getDeliveryOption().name())
                .paymentOption(parcel.getPaymentOption().name())
                .weight(parcel.getWeight())
                .validatedWeight(parcel.getValidatedWeight())
                .dimensions(parcel.getDimensions())
                .validatedDimensions(parcel.getValidatedDimensions())
                .declaredValue(parcel.getDeclaredValue())
                .fragile(parcel.isFragile())
                .photoUrl(parcel.getPhotoUrl())
                .descriptionComment(parcel.getDescriptionComment())
                .validationComment(parcel.getValidationComment())
                .descriptionConfirmed(Boolean.TRUE.equals(parcel.getDescriptionConfirmed()))
                .clientId(client.getId())
                .clientName(client.getFullName())
                .clientPhone(client.getPhone())
                .clientEmail(client.getEmail())
                .senderAddressId(sender != null ? sender.getId() : null)
                .senderLabel(sender != null ? sender.getLabel() : null)
                .senderCity(sender != null ? sender.getCity() : null)
                .senderRegion(sender != null ? sender.getRegion() : null)
                .senderCountry(sender != null ? sender.getCountry() : null)
                .senderLatitude(sender != null && sender.getLatitude() != null ? sender.getLatitude().doubleValue() : null)
                .senderLongitude(sender != null && sender.getLongitude() != null ? sender.getLongitude().doubleValue() : null)
                .recipientAddressId(recipient != null ? recipient.getId() : null)
                .recipientLabel(recipient != null ? recipient.getLabel() : null)
                .recipientCity(recipient != null ? recipient.getCity() : null)
                .recipientRegion(recipient != null ? recipient.getRegion() : null)
                .recipientCountry(recipient != null ? recipient.getCountry() : null)
                .recipientLatitude(recipient != null && recipient.getLatitude() != null ? recipient.getLatitude().doubleValue() : null)
                .recipientLongitude(recipient != null && recipient.getLongitude() != null ? recipient.getLongitude().doubleValue() : null)
                .originAgencyId(origin != null ? origin.getId() : null)
                .originAgencyCode(origin != null ? origin.getAgencyCode() : null)
                .originAgencyName(origin != null ? origin.getAgencyName() : null)
                .originAgencyCity(origin != null ? origin.getCity() : null)
                .destinationAgencyId(destination != null ? destination.getId() : null)
                .destinationAgencyCode(destination != null ? destination.getAgencyCode() : null)
                .destinationAgencyName(destination != null ? destination.getAgencyName() : null)
                .destinationAgencyCity(destination != null ? destination.getCity() : null)
                .scanHistory(scanHistory)
                .payments(paymentRecords)
                .totalPaid(totalPaid)
                .totalDue(totalDue)
                .paymentStatus(paymentStatus)
                .refunds(refundRecords)
                .pricing(pricingRecord)
                .pickup(pickupRecord)
                .deliveryProof(proofRecord)
                .createdAt(parcel.getCreatedAt())
                .validatedAt(parcel.getValidatedAt())
                .validatedBy(parcel.getValidatedBy() != null ? parcel.getValidatedBy().getFullName() : null)
                .expectedDeliveryAt(parcel.getExpectedDeliveryAt())
                .qrCodeImage(qrImage)
                .build();
    }

    private QrLabelData buildLabelData(Parcel parcel) {
        Client client = parcel.getClient();
        Address sender = parcel.getSenderAddress();
        Address recipient = parcel.getRecipientAddress();
        Agency origin = parcel.getOriginAgency();
        Agency destination = parcel.getDestinationAgency();

        // Get pricing for payment status - use correct repository method
        Optional<PricingDetail> pricingOpt = pricingDetailRepository.findTopByParcel_IdOrderByAppliedAtDesc(parcel.getId());
        Double totalAmount = pricingOpt.map(PricingDetail::getAppliedPrice).orElse(0.0);

        // Calculate payment status - use correct repository method
        List<Payment> payments = paymentRepository.findByParcel_IdOrderByTimestampDesc(parcel.getId());
        double totalPaid = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .mapToDouble(Payment::getAmount)
                .sum();
        String paymentStatusLabel = totalPaid >= totalAmount ? "PAID" : "COD";

        // Generate QR content (tracking URL)
        String qrContent = "https://track.campost.cm/" + parcel.getTrackingRef();
        String qrImage = generateQrImage(qrContent);

        // Generate barcode (simplified - just tracking ref)
        String barcode = parcel.getTrackingRef().replace("-", "");

        // Label title based on service type
        String labelTitle = "EXPRESS".equals(parcel.getServiceType().name()) ?
                "COLIS EXPRESS" : "COLIS STANDARD";

        return QrLabelData.builder()
                .parcelId(parcel.getId())
                .trackingRef(parcel.getTrackingRef())
                .barcode(barcode)
                .qrCodeImage(qrImage)
                .qrContent(qrContent)
                .companyName("CAMPOST")
                .labelTitle(labelTitle)
                .senderName(client.getFullName())
                .senderCity(sender != null ? sender.getCity() : "")
                .senderPhone(client.getPhone())
                .recipientName(recipient != null ? recipient.getLabel() : "")
                .recipientCity(recipient != null ? recipient.getCity() : "")
                .recipientPhone(client.getPhone()) // Use client phone - Address doesn't have phone
                .recipientAddress(formatShortAddress(recipient))
                .serviceType(parcel.getServiceType().name())
                .deliveryOption(parcel.getDeliveryOption().name())
                .fragile(parcel.isFragile())
                .weight(parcel.getValidatedWeight() != null ?
                        parcel.getValidatedWeight() : parcel.getWeight())
                .originAgencyCode(origin != null ? origin.getAgencyCode() : null)
                .originAgencyName(origin != null ? origin.getAgencyName() : null)
                .destinationAgencyCode(destination != null ? destination.getAgencyCode() : null)
                .destinationAgencyName(destination != null ? destination.getAgencyName() : null)
                .totalAmount(totalAmount)
                .paymentStatus(paymentStatusLabel)
                .currency("XAF")
                .printedAt(Instant.now())
                .labelSize("100x150mm")
                .copiesCount(2)
                .build();
    }

    private String formatShortAddress(Address address) {
        if (address == null) return "";
        StringBuilder sb = new StringBuilder();
        if (address.getLabel() != null) sb.append(address.getLabel());
        if (address.getCity() != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(address.getCity());
        }
        return sb.toString();
    }

    private String generateQrImage(String content) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 2);

            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, QR_WIDTH, QR_HEIGHT, hints);
            BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (WriterException | java.io.IOException e) {
            log.error("Failed to generate QR code image", e);
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    private String generateSecureToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
