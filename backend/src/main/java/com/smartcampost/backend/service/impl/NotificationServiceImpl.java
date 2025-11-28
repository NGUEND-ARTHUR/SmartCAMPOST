package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.notification.NotificationResponse;
import com.smartcampost.backend.dto.notification.TriggerNotificationRequest;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.*;
import com.smartcampost.backend.model.enums.*;
import com.smartcampost.backend.repository.*;
import com.smartcampost.backend.service.NotificationGatewayService;
import com.smartcampost.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final ParcelRepository parcelRepository;
    private final PickupRequestRepository pickupRequestRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationGatewayService gatewayService;

    // ======================== PUBLIC API ========================

    @Override
    public NotificationResponse triggerNotification(TriggerNotificationRequest request) {

        UserAccount user = getCurrentUser();
        // Seuls STAFF / AGENT / ADMIN déclenchent manuellement
        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Not allowed to trigger notifications manually");
        }

        Parcel parcel = null;
        if (request.getParcelId() != null) {
            parcel = parcelRepository.findById(request.getParcelId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parcel not found",
                            ErrorCode.PARCEL_NOT_FOUND
                    ));
        }

        PickupRequest pickup = null;
        if (request.getPickupId() != null) {
            pickup = pickupRequestRepository.findById(request.getPickupId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Pickup not found",
                            ErrorCode.PICKUP_NOT_FOUND
                    ));
        }

        String phone = request.getRecipientPhone();
        String email = request.getRecipientEmail();

        // si non fourni, on tente de deviner depuis le parcel/pickup
        Client client = null;
        if (parcel != null) {
            client = parcel.getClient();
        } else if (pickup != null && pickup.getParcel() != null) {
            client = pickup.getParcel().getClient();
        }

        if (client != null) {
            if (phone == null || phone.isBlank()) {
                phone = client.getPhone();
            }
            if (email == null || email.isBlank()) {
                email = client.getEmail();
            }
        }

        NotificationChannel channel = request.getChannel();
        if (channel == NotificationChannel.SMS && (phone == null || phone.isBlank())) {
            throw new ConflictException(
                    "No phone number available for SMS",
                    ErrorCode.NOTIFICATION_SEND_FAILED
            );
        }
        if (channel == NotificationChannel.EMAIL && (email == null || email.isBlank())) {
            throw new ConflictException(
                    "No email available for EMAIL",
                    ErrorCode.NOTIFICATION_SEND_FAILED
            );
        }

        String subject = request.getSubject();
        String message = request.getMessage();
        if (subject == null) subject = buildDefaultSubject(request.getType());
        if (message == null) message = buildDefaultMessage(request.getType(), parcel);

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(pickup)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(channel)
                .type(request.getType())
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

        notificationRepository.save(notif);

        sendAndUpdate(notif);

        return toResponse(notif);
    }

    @Override
    public NotificationResponse getNotification(UUID id) {
        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found",
                        ErrorCode.NOTIFICATION_NOT_FOUND
                ));
        return toResponse(notif);
    }

    @Override
    public Page<NotificationResponse> listNotifications(int page, int size) {
        UserAccount user = getCurrentUser();
        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Not allowed to list all notifications");
        }

        return notificationRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Override
    public NotificationResponse retryNotification(UUID id) {
        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found",
                        ErrorCode.NOTIFICATION_NOT_FOUND
                ));

        notif.setRetryCount(notif.getRetryCount() + 1);
        notif.setStatus(NotificationStatus.PENDING);
        notif.setErrorMessage(null);
        notificationRepository.save(notif);

        sendAndUpdate(notif);

        return toResponse(notif);
    }

    @Override
    public List<NotificationResponse> listForParcel(UUID parcelId) {
        return notificationRepository.findByParcel_IdOrderByCreatedAtDesc(parcelId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationResponse> listForPickup(UUID pickupId) {
        return notificationRepository.findByPickupRequest_IdOrderByCreatedAtDesc(pickupId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ======================== AUTO EVENTS ========================

    @Override
    public void notifyPickupRequested(PickupRequest pickup) {
        Parcel parcel = pickup.getParcel();
        Client client = parcel.getClient();

        String phone = client.getPhone();
        String email = client.getEmail();

        String subject = "Pickup requested for your parcel";
        String message = "Dear " + client.getFullName()
                + ", your pickup request for parcel " + parcel.getTrackingRef()
                + " has been created for " + pickup.getRequestedDate()
                + " (" + pickup.getTimeWindow() + ").";

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(pickup)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(NotificationChannel.SMS) // on privilégie SMS
                .type(NotificationType.PICKUP_REQUESTED)
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

        notificationRepository.save(notif);
        sendAndUpdate(notif);
    }

    @Override
    public void notifyPickupCompleted(PickupRequest pickup) {
        Parcel parcel = pickup.getParcel();
        Client client = parcel.getClient();

        String phone = client.getPhone();
        String email = client.getEmail();

        String subject = "Parcel picked up";
        String message = "Dear " + client.getFullName()
                + ", your parcel " + parcel.getTrackingRef()
                + " has been successfully picked up by our courier.";

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(pickup)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(NotificationChannel.SMS)
                .type(NotificationType.PICKUP_COMPLETED)
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

        notificationRepository.save(notif);
        sendAndUpdate(notif);
    }

    @Override
    public void notifyParcelDelivered(Parcel parcel) {
        Client client = parcel.getClient();

        String phone = client.getPhone();
        String email = client.getEmail();

        String subject = "Parcel delivered";
        String message = "Dear " + client.getFullName()
                + ", your parcel " + parcel.getTrackingRef()
                + " has been delivered. Thank you for using SmartCAMPOST.";

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(null)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(NotificationChannel.SMS)
                .type(NotificationType.PARCEL_DELIVERED)
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

        notificationRepository.save(notif);
        sendAndUpdate(notif);
    }

    // ======================== PRIVATE HELPERS ========================

    private void sendAndUpdate(Notification notif) {
        try {
            if (notif.getChannel() == NotificationChannel.SMS) {
                gatewayService.sendSms(notif.getRecipientPhone(), notif.getMessage());
            } else if (notif.getChannel() == NotificationChannel.EMAIL) {
                gatewayService.sendEmail(
                        notif.getRecipientEmail(),
                        notif.getSubject(),
                        notif.getMessage()
                );
            } else {
                throw new ConflictException(
                        "Unsupported notification channel",
                        ErrorCode.NOTIFICATION_CHANNEL_UNSUPPORTED
                );
            }

            notif.setStatus(NotificationStatus.SENT);
            notif.setSentAt(Instant.now());
            notif.setErrorMessage(null);

        } catch (Exception ex) {
            log.error("❌ Notification send failed: {}", ex.getMessage(), ex);
            notif.setStatus(NotificationStatus.FAILED);
            notif.setErrorMessage(ex.getMessage());
        }

        notificationRepository.save(notif);
    }

    private String buildDefaultSubject(NotificationType type) {
        return switch (type) {
            case PICKUP_REQUESTED -> "Pickup requested";
            case PICKUP_COMPLETED -> "Pickup completed";
            case PARCEL_DELIVERED -> "Parcel delivered";
            default -> "Notification";
        };
    }

    private String buildDefaultMessage(NotificationType type, Parcel parcel) {
        String tracking = (parcel != null ? parcel.getTrackingRef() : "your parcel");
        return switch (type) {
            case PICKUP_REQUESTED -> "Pickup requested for " + tracking;
            case PICKUP_COMPLETED -> "Pickup completed for " + tracking;
            case PARCEL_DELIVERED -> tracking + " has been delivered.";
            default -> "Notification regarding " + tracking;
        };
    }

    private UserAccount getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(
                    ErrorCode.AUTH_INVALID_CREDENTIALS,
                    "Unauthenticated"
            );
        }

        String subject = auth.getName();

        try {
            UUID userId = UUID.fromString(subject);
            return userAccountRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found",
                            ErrorCode.AUTH_USER_NOT_FOUND
                    ));
        } catch (IllegalArgumentException ex) {
            return userAccountRepository.findByPhone(subject)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found",
                            ErrorCode.AUTH_USER_NOT_FOUND
                    ));
        }
    }

    private NotificationResponse toResponse(Notification n) {
        Parcel parcel = n.getParcel();
        PickupRequest pickup = n.getPickupRequest();

        return NotificationResponse.builder()
                .id(n.getId())
                .parcelId(parcel != null ? parcel.getId() : null)
                .parcelTrackingRef(parcel != null ? parcel.getTrackingRef() : null)
                .pickupId(pickup != null ? pickup.getId() : null)
                .recipientPhone(n.getRecipientPhone())
                .recipientEmail(n.getRecipientEmail())
                .channel(n.getChannel())
                .type(n.getType())
                .status(n.getStatus())
                .subject(n.getSubject())
                .message(n.getMessage())
                .errorMessage(n.getErrorMessage())
                .retryCount(n.getRetryCount())
                .createdAt(n.getCreatedAt())
                .sentAt(n.getSentAt())
                .build();
    }
}
