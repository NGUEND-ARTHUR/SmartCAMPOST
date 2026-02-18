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
import java.util.Objects;
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

                Objects.requireNonNull(request, "request must not be null");

                UserAccount user = getCurrentUser();
        // Seuls STAFF / AGENT / ADMIN déclenchent manuellement
        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Not allowed to trigger notifications manually");
        }

        Parcel parcel = null;
        if (request.getParcelId() != null) {
            UUID pid = request.getParcelId();
            Objects.requireNonNull(pid, "parcelId is required");
            parcel = parcelRepository.findById(pid)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Parcel not found",
                            ErrorCode.PARCEL_NOT_FOUND
                    ));
        }

        PickupRequest pickup = null;
        if (request.getPickupId() != null) {
            UUID pkid = request.getPickupId();
            Objects.requireNonNull(pkid, "pickupId is required");
            pickup = pickupRequestRepository.findById(pkid)
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

        Objects.requireNonNull(notif, "notification must not be null");
        Notification savedNotif = notificationRepository.save(notif);

        sendAndUpdate(savedNotif);

        return toResponse(savedNotif);
    }

    @Override
    public NotificationResponse getNotification(UUID id) {
        Objects.requireNonNull(id, "id is required");

        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found",
                        ErrorCode.NOTIFICATION_NOT_FOUND
                ));
        return toResponse(notif);
    }

    @Override
        public com.smartcampost.backend.dto.common.PageResponse<NotificationResponse> listNotifications(int page, int size) {
                UserAccount user = getCurrentUser();
                if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
                        throw new AuthException(ErrorCode.BUSINESS_ERROR, "Not allowed to list all notifications");
                }

                Page<Notification> notifPage = notificationRepository.findAll(PageRequest.of(page, size));
                List<NotificationResponse> content = notifPage.getContent().stream().map(this::toResponse).collect(Collectors.toList());
                return com.smartcampost.backend.dto.common.PageResponse.<NotificationResponse>builder()
                                .content(content)
                                .page(notifPage.getNumber())
                                .size(notifPage.getSize())
                                .totalElements(notifPage.getTotalElements())
                                .totalPages(notifPage.getTotalPages())
                                .build();
        }

    @Override
    public NotificationResponse retryNotification(UUID id) {
        Objects.requireNonNull(id, "id is required");

        Notification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found",
                        ErrorCode.NOTIFICATION_NOT_FOUND
                ));
        notif.setRetryCount(notif.getRetryCount() + 1);
        notif.setStatus(NotificationStatus.PENDING);
        notif.setErrorMessage(null);
        Objects.requireNonNull(notif, "notification must not be null");
        Notification savedNotif = notificationRepository.save(notif);

        sendAndUpdate(savedNotif);

        return toResponse(savedNotif);
    }

    @Override
    public List<NotificationResponse> listForParcel(UUID parcelId) {
        Objects.requireNonNull(parcelId, "parcelId is required");
        return notificationRepository.findByParcel_IdOrderByCreatedAtDesc(parcelId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationResponse> listForPickup(UUID pickupId) {
        Objects.requireNonNull(pickupId, "pickupId is required");
        return notificationRepository.findByPickupRequest_IdOrderByCreatedAtDesc(pickupId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ======================== AUTO EVENTS ========================

    @Override
    public void notifyPickupRequested(PickupRequest pickup) {
                Objects.requireNonNull(pickup, "pickup is required");
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

        Objects.requireNonNull(notif, "notification must not be null");
        Notification savedNotif = notificationRepository.save(notif);
        sendAndUpdate(savedNotif);
    }

    @Override
    public void notifyPickupCompleted(PickupRequest pickup) {
                Objects.requireNonNull(pickup, "pickup is required");
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

        Objects.requireNonNull(notif, "notification must not be null");
        Notification savedNotif = notificationRepository.save(notif);
        sendAndUpdate(savedNotif);
    }

    @Override
    public void notifyParcelDelivered(Parcel parcel) {
                Objects.requireNonNull(parcel, "parcel is required");
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

        Objects.requireNonNull(notif, "notification must not be null");
        Notification savedNotif = notificationRepository.save(notif);
        sendAndUpdate(savedNotif);
    }

    // 🔥 NEW: notification lors de la création du colis
    @Override
    public void notifyParcelCreated(Parcel parcel) {
                Objects.requireNonNull(parcel, "parcel is required");
        Client client = parcel.getClient();

        String phone = client.getPhone();
        String email = client.getEmail();

        String subject = "Parcel created";
        String message = "Dear " + client.getFullName()
                + ", your parcel " + parcel.getTrackingRef()
                + " has been created in SmartCAMPOST system.";

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(null)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(NotificationChannel.SMS)
                .type(NotificationType.PARCEL_CREATED)
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

        Objects.requireNonNull(notif, "notification must not be null");
        Notification savedNotif = notificationRepository.save(notif);
        sendAndUpdate(savedNotif);
    }

    // 🔥 SPRINT 15: notification when parcel is validated/accepted by agent
    @Override
    public void notifyParcelAccepted(Parcel parcel) {
                Objects.requireNonNull(parcel, "parcel is required");
        Client client = parcel.getClient();

        String phone = client.getPhone();
        String email = client.getEmail();

        String subject = "Parcel validated and accepted";
        String message = "Dear " + client.getFullName()
                + ", your parcel " + parcel.getTrackingRef()
                + " has been validated and accepted by our agent. "
                + "It is now ready for processing and will soon be on its way.";

        // Add validation details if available
        if (parcel.getValidatedWeight() != null && !parcel.getValidatedWeight().equals(parcel.getWeight())) {
            message += " Note: The confirmed weight is " + parcel.getValidatedWeight() + " kg.";
        }

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(null)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(NotificationChannel.SMS)
                .type(NotificationType.PARCEL_STATUS_CHANGE)
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

        Objects.requireNonNull(notif, "notification must not be null");
        Notification savedNotif = notificationRepository.save(notif);
        sendAndUpdate(savedNotif);
    }

    // 🔥 NEW: notification "out for delivery"
    @Override
    public void notifyParcelOutForDelivery(Parcel parcel) {
                Objects.requireNonNull(parcel, "parcel is required");
        Client client = parcel.getClient();

        String phone = client.getPhone();
        String email = client.getEmail();

        String subject = "Parcel out for delivery";
        String message = "Dear " + client.getFullName()
                + ", your parcel " + parcel.getTrackingRef()
                + " is now out for delivery.";

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(null)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(NotificationChannel.SMS)
                .type(NotificationType.PARCEL_OUT_FOR_DELIVERY)
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

        Objects.requireNonNull(notif, "notification must not be null");
        Notification savedNotif = notificationRepository.save(notif);
        sendAndUpdate(savedNotif);
    }

    // 🔥 NEW: notification when parcel is in transit
    @Override
    public void notifyParcelInTransit(Parcel parcel) {
                Objects.requireNonNull(parcel, "parcel is required");
        Client client = parcel.getClient();

        String phone = client.getPhone();
        String email = client.getEmail();

        String subject = "Parcel in transit";
        String message = "Dear " + client.getFullName()
                + ", your parcel " + parcel.getTrackingRef()
                + " is now in transit to its destination.";

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(null)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(NotificationChannel.SMS)
                .type(NotificationType.PARCEL_IN_TRANSIT)
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

        Objects.requireNonNull(notif, "notification must not be null");
        Notification savedNotif = notificationRepository.save(notif);
        sendAndUpdate(savedNotif);
    }

    // 🔥 NEW: notification when parcel arrives at destination agency
    @Override
    public void notifyParcelArrivedDestination(Parcel parcel) {
                Objects.requireNonNull(parcel, "parcel is required");
        Client client = parcel.getClient();
        Agency destAgency = parcel.getDestinationAgency();

        String phone = client.getPhone();
        String email = client.getEmail();

        String agencyInfo = destAgency != null ?
                " at " + destAgency.getAgencyName() + " agency" : "";

        String deliveryInfo = parcel.getDeliveryOption().name().equals("HOME") ?
                " It will soon be out for home delivery." :
                " You can come pick it up during working hours.";

        String subject = "Parcel arrived at destination";
        String message = "Dear " + client.getFullName()
                + ", your parcel " + parcel.getTrackingRef()
                + " has arrived" + agencyInfo + "." + deliveryInfo;

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(null)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(NotificationChannel.SMS)
                .type(NotificationType.PARCEL_ARRIVED_DESTINATION)
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

        Objects.requireNonNull(notif, "notification must not be null");
        Notification savedNotif = notificationRepository.save(notif);
        sendAndUpdate(savedNotif);
    }

    // 🔥 NEW: reminder for uncollected parcels at agency
    @Override
    public void sendReminderForUncollectedParcel(Parcel parcel, int daysSinceArrival) {
                Objects.requireNonNull(parcel, "parcel is required");
        Client client = parcel.getClient();
        Agency destAgency = parcel.getDestinationAgency();

        String phone = client.getPhone();
        String email = client.getEmail();

        String agencyInfo = destAgency != null ?
                destAgency.getAgencyName() : "our agency";

        String subject = "Reminder: Collect your parcel";
        String message = "Dear " + client.getFullName()
                + ", your parcel " + parcel.getTrackingRef()
                + " has been waiting for collection at " + agencyInfo
                + " for " + daysSinceArrival + " days. "
                + "Please pick it up soon to avoid return to sender.";

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(null)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(NotificationChannel.SMS)
                .type(NotificationType.REMINDER_NOT_COLLECTED)
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

                Objects.requireNonNull(notif, "notification must not be null");
                Notification savedNotif = notificationRepository.save(notif);
                sendAndUpdate(savedNotif);
    }

    // 🔥 NEW: notification when delivery is rescheduled
    @Override
    public void notifyDeliveryRescheduled(Parcel parcel, java.time.LocalDate newDate, String reason) {
                Objects.requireNonNull(parcel, "parcel is required");
                Objects.requireNonNull(newDate, "newDate is required");
        Client client = parcel.getClient();

        String phone = client.getPhone();
        String email = client.getEmail();

        String reasonPart = (reason != null && !reason.isBlank()) ? 
                " Reason: " + reason + "." : "";

        String subject = "Delivery rescheduled";
        String message = "Dear " + client.getFullName()
                + ", the delivery of your parcel " + parcel.getTrackingRef()
                + " has been rescheduled to " + newDate.toString() + "."
                + reasonPart
                + " We apologize for any inconvenience.";

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(null)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(NotificationChannel.SMS)
                .type(NotificationType.DELIVERY_RESCHEDULED)
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

                Objects.requireNonNull(notif, "notification must not be null");
                Notification savedNotif = notificationRepository.save(notif);
                sendAndUpdate(savedNotif);
    }

    // 🔥 NEW: notification when delivery attempt fails
    @Override
    public void notifyDeliveryAttemptFailed(Parcel parcel, int attemptNumber, String failureReason) {
                Objects.requireNonNull(parcel, "parcel is required");
        Client client = parcel.getClient();

        String phone = client.getPhone();
        String email = client.getEmail();

        String subject = "Delivery attempt failed";
        String message = "Dear " + client.getFullName()
                + ", delivery attempt #" + attemptNumber
                + " for your parcel " + parcel.getTrackingRef()
                + " was unsuccessful. Reason: " + failureReason + ". "
                + "We will try again soon. Please ensure you are available.";

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(null)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(NotificationChannel.SMS)
                .type(NotificationType.DELIVERY_ATTEMPT_FAILED)
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

                Objects.requireNonNull(notif, "notification must not be null");
                Notification savedNotif = notificationRepository.save(notif);
                sendAndUpdate(savedNotif);
    }

    // 🔥 NEW: envoi spécifique pour OTP de livraison
    @Override
    public void sendDeliveryOtp(String phoneNumber, String otpCode, String trackingRef) {
        // On essaie d’attacher le colis si possible
        Parcel parcel = null;
        if (trackingRef != null && !trackingRef.isBlank()) {
            parcel = parcelRepository.findByTrackingRef(trackingRef).orElse(null);
        }

        String subject = "Delivery OTP for your parcel";
        String message = "Your OTP for the delivery of parcel "
                + (trackingRef != null ? trackingRef : "your parcel")
                + " is: " + otpCode + ". It is valid for 10 minutes."
                + buildWebOtpSuffix(otpCode);

        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(null)
                .recipientPhone(phoneNumber)
                .recipientEmail(null)
                .channel(NotificationChannel.SMS)
                .type(NotificationType.DELIVERY_OTP) // 👈 dédié au flux OTP
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(message)
                .retryCount(0)
                .build();

                Objects.requireNonNull(notif, "notification must not be null");
                Notification savedNotif = notificationRepository.save(notif);
                sendAndUpdate(savedNotif);
    }

    // ======================== OPERATIONAL MODULES ========================

    @Override
    public void notifyPaymentConfirmed(Parcel parcel, double amount, String currency) {
        Objects.requireNonNull(parcel, "parcel is required");
        Client client = parcel.getClient();
        Objects.requireNonNull(client, "parcel.client is required");

        String subject = "Payment confirmed";
        String message = "Dear " + client.getFullName()
                + ", we have received your payment for parcel " + parcel.getTrackingRef()
                + ". Amount: " + String.format("%.2f %s", amount, currency != null ? currency : "XAF") + ".";

        createAndSend(
                NotificationType.PAYMENT_CONFIRMED,
                parcel,
                null,
                client.getPhone(),
                client.getEmail(),
                subject,
                message
        );
    }

    @Override
    public void notifyInvoiceIssued(Parcel parcel, String invoiceNumber, double amount, String currency) {
        Objects.requireNonNull(parcel, "parcel is required");
        Client client = parcel.getClient();
        Objects.requireNonNull(client, "parcel.client is required");

        String subject = "Invoice issued";
        String message = "Dear " + client.getFullName()
                + ", your invoice " + (invoiceNumber != null ? invoiceNumber : "")
                + " has been issued for parcel " + parcel.getTrackingRef()
                + ". Amount: " + String.format("%.2f %s", amount, currency != null ? currency : "XAF") + ".";

        createAndSend(
                NotificationType.INVOICE_ISSUED,
                parcel,
                null,
                client.getPhone(),
                client.getEmail(),
                subject,
                message
        );
    }

    @Override
    public void notifyRefundRequested(Parcel parcel, double amount, String currency) {
        Objects.requireNonNull(parcel, "parcel is required");
        Client client = parcel.getClient();
        Objects.requireNonNull(client, "parcel.client is required");

        String subject = "Refund requested";
        String message = "Dear " + client.getFullName()
                + ", your refund request has been received for parcel " + parcel.getTrackingRef()
                + ". Amount: " + String.format("%.2f %s", amount, currency != null ? currency : "XAF") + ".";

        createAndSend(
                NotificationType.REFUND_REQUESTED,
                parcel,
                null,
                client.getPhone(),
                client.getEmail(),
                subject,
                message
        );
    }

    @Override
    public void notifyRefundStatusUpdated(Parcel parcel, String status, double amount, String currency) {
        Objects.requireNonNull(parcel, "parcel is required");
        Client client = parcel.getClient();
        Objects.requireNonNull(client, "parcel.client is required");

        String subject = "Refund status updated";
        String message = "Dear " + client.getFullName()
                + ", the status of your refund for parcel " + parcel.getTrackingRef()
                + " is now " + (status != null ? status : "UPDATED")
                + ". Amount: " + String.format("%.2f %s", amount, currency != null ? currency : "XAF") + ".";

        createAndSend(
                NotificationType.REFUND_STATUS_UPDATED,
                parcel,
                null,
                client.getPhone(),
                client.getEmail(),
                subject,
                message
        );
    }

    @Override
    public void notifySupportTicketCreated(Client client, String ticketSubject) {
        Objects.requireNonNull(client, "client is required");

        String subject = "Support ticket opened";
        String message = "Dear " + client.getFullName()
                + ", your support ticket has been opened"
                + (ticketSubject != null && !ticketSubject.isBlank() ? (": " + ticketSubject) : ".")
                + " Our team will get back to you shortly.";

        createAndSend(
                NotificationType.SUPPORT_TICKET_CREATED,
                null,
                null,
                client.getPhone(),
                client.getEmail(),
                subject,
                message
        );
    }

    @Override
    public void notifySupportTicketReplied(Client client, String ticketSubject) {
        Objects.requireNonNull(client, "client is required");

        String subject = "Support ticket reply";
        String message = "Dear " + client.getFullName()
                + ", you have received a reply on your support ticket"
                + (ticketSubject != null && !ticketSubject.isBlank() ? (": " + ticketSubject) : ".")
                + " Please check the ticket details in the app.";

        createAndSend(
                NotificationType.SUPPORT_TICKET_REPLIED,
                null,
                null,
                client.getPhone(),
                client.getEmail(),
                subject,
                message
        );
    }

    @Override
    public void notifySupportTicketStatusUpdated(Client client, String ticketSubject, String newStatus) {
        Objects.requireNonNull(client, "client is required");

        String subject = "Support ticket status updated";
        String message = "Dear " + client.getFullName()
                + ", the status of your support ticket"
                + (ticketSubject != null && !ticketSubject.isBlank() ? (" (" + ticketSubject + ")") : "")
                + " is now " + (newStatus != null ? newStatus : "UPDATED") + ".";

        createAndSend(
                NotificationType.SUPPORT_TICKET_STATUS_UPDATED,
                null,
                null,
                client.getPhone(),
                client.getEmail(),
                subject,
                message
        );
    }

    @Override
    public void notifyAccountFrozen(UserAccount account) {
        Objects.requireNonNull(account, "account is required");

        String subject = "Account frozen";
        String message = "Your SmartCAMPOST account has been temporarily frozen for compliance review. Please contact support if you believe this is an error.";

        createAndSend(
                NotificationType.ACCOUNT_FROZEN,
                null,
                null,
                account.getPhone(),
                null,
                subject,
                message
        );
    }

    @Override
    public void notifyAccountUnfrozen(UserAccount account) {
        Objects.requireNonNull(account, "account is required");

        String subject = "Account restored";
        String message = "Your SmartCAMPOST account has been restored. Thank you for your patience.";

        createAndSend(
                NotificationType.ACCOUNT_UNFROZEN,
                null,
                null,
                account.getPhone(),
                null,
                subject,
                message
        );
    }

    // ======================== PRIVATE HELPERS ========================

    private void createAndSend(
            NotificationType type,
            Parcel parcel,
            PickupRequest pickup,
            String phone,
            String email,
            String subject,
            String message
    ) {
        NotificationChannel channel = (phone != null && !phone.isBlank()) ? NotificationChannel.SMS : NotificationChannel.EMAIL;
        Notification notif = Notification.builder()
                .parcel(parcel)
                .pickupRequest(pickup)
                .recipientPhone(phone)
                .recipientEmail(email)
                .channel(channel)
                .type(type)
                .status(NotificationStatus.PENDING)
                .subject(subject)
                .message(Objects.requireNonNull(message, "message is required"))
                .retryCount(0)
                .build();

        Notification savedNotif = notificationRepository.save(Objects.requireNonNull(notif, "notification must not be null"));
        sendAndUpdate(savedNotif);
    }

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

        private String buildWebOtpSuffix(String code) {
                String domain = System.getenv("SMARTCAMPOST_WEBOTP_DOMAIN");
                if (domain == null || domain.isBlank()) {
                        return "";
                }
                String normalized = domain.trim()
                                .replace("https://", "")
                                .replace("http://", "")
                                .replaceAll("/.*$", "");
                if (normalized.isBlank()) {
                        return "";
                }
                return "\n@" + normalized + " #" + code;
        }

    private String buildDefaultSubject(NotificationType type) {
        return switch (type) {
            case PICKUP_REQUESTED -> "Pickup requested";
            case PICKUP_COMPLETED -> "Pickup completed";
            case PARCEL_DELIVERED -> "Parcel delivered";
            case PARCEL_CREATED -> "Parcel created";
            case PARCEL_OUT_FOR_DELIVERY -> "Parcel out for delivery";
            case DELIVERY_OTP -> "Delivery OTP";
                        case PAYMENT_CONFIRMED -> "Payment confirmed";
                        case INVOICE_ISSUED -> "Invoice issued";
                        case REFUND_REQUESTED -> "Refund requested";
                        case REFUND_STATUS_UPDATED -> "Refund status updated";
                        case SUPPORT_TICKET_CREATED -> "Support ticket opened";
                        case SUPPORT_TICKET_REPLIED -> "Support ticket reply";
                        case SUPPORT_TICKET_STATUS_UPDATED -> "Support ticket status updated";
                        case ACCOUNT_FROZEN -> "Account frozen";
                        case ACCOUNT_UNFROZEN -> "Account restored";
            default -> "Notification";
        };
    }

    private String buildDefaultMessage(NotificationType type, Parcel parcel) {
        String tracking = (parcel != null ? parcel.getTrackingRef() : "your parcel");
        return switch (type) {
            case PICKUP_REQUESTED -> "Pickup requested for " + tracking;
            case PICKUP_COMPLETED -> "Pickup completed for " + tracking;
            case PARCEL_DELIVERED -> tracking + " has been delivered.";
            case PARCEL_CREATED -> tracking + " has been created in our system.";
            case PARCEL_OUT_FOR_DELIVERY -> tracking + " is out for delivery.";
            case DELIVERY_OTP -> "Your OTP for " + tracking + " was sent to your phone.";
                        case PAYMENT_CONFIRMED -> "Payment confirmed for " + tracking + ".";
                        case INVOICE_ISSUED -> "Invoice issued for " + tracking + ".";
                        case REFUND_REQUESTED -> "Refund requested for " + tracking + ".";
                        case REFUND_STATUS_UPDATED -> "Refund status updated for " + tracking + ".";
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

                String subject = Objects.requireNonNull(auth.getName(), "authentication name is required");

                try {
                        UUID userId = UUID.fromString(subject);
                        @SuppressWarnings("null")
                        UUID uid = userId;
            return userAccountRepository.findById(Objects.requireNonNull(uid, "userId is required"))
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
