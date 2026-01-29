package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.ussd.UssdRequest;
import com.smartcampost.backend.dto.ussd.UssdResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.model.UssdSession;
import com.smartcampost.backend.model.enums.UssdSessionState;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.UssdSessionRepository;
import com.smartcampost.backend.service.UssdService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UssdServiceImpl implements UssdService {

    private final UssdSessionRepository ussdSessionRepository;
    private final ParcelRepository parcelRepository;

    @Override
    public UssdResponse handleUssdRequest(UssdRequest request) {

        Objects.requireNonNull(request, "request is required");

        // ============================
        // 🔥 1. Validate incoming request
        // ============================
        if (request.getSessionRef() == null || request.getMsisdn() == null) {
            throw new ConflictException(
                    "Invalid USSD request from gateway",
                    ErrorCode.USSD_GATEWAY_ERROR
            );
        }

        // Retrieve or create session
        UssdSession session = getOrCreateSession(
                request.getSessionRef(),
                request.getMsisdn()
        );

        if (session == null) {
            throw new ResourceNotFoundException(
                    "USSD session not found",
                    ErrorCode.USSD_SESSION_NOT_FOUND
            );
        }

        String input = request.getUserInput() != null ? request.getUserInput().trim() : "";

        // ============================
        // MAIN MENU ENTRY
        // ============================
        if (input.isEmpty() || "0".equals(input)) {

            session.setCurrentMenu("MAIN");
            session.setLastInteractionAt(Instant.now());
            session = Objects.requireNonNull(ussdSessionRepository.save(session), "failed to save ussd session");

            String msg = "Welcome to SmartCAMPOST\n"
                    + "1. Track parcel\n"
                    + "0. Exit";

            return UssdResponse.builder()
                    .message(msg)
                    .endSession(false)
                    .build();
        }

        // ============================
        // TRACK PARCEL MENU
        // ============================
        if ("1".equals(input) && "MAIN".equals(session.getCurrentMenu())) {

            session.setCurrentMenu("TRACK_PROMPT");
            session.setLastInteractionAt(Instant.now());
            session = Objects.requireNonNull(ussdSessionRepository.save(session), "failed to save ussd session");

            return UssdResponse.builder()
                    .message("Enter tracking number:")
                    .endSession(false)
                    .build();
        }

        // ============================
        // PARCEL SEARCH
        // ============================
        if ("TRACK_PROMPT".equals(session.getCurrentMenu())) {

            String trackingRef = input;

            String msg = parcelRepository.findByTrackingRef(trackingRef)
                    .map(parcel -> "Parcel " + trackingRef + " status: " + parcel.getStatus().name())
                    .orElse("Tracking number not found.");

            session.setState(UssdSessionState.COMPLETED);
            session.setLastInteractionAt(Instant.now());
            session = Objects.requireNonNull(ussdSessionRepository.save(session), "failed to save ussd session");

            return UssdResponse.builder()
                    .message(msg)
                    .endSession(true)
                    .build();
        }

        // ============================
        // UNKNOWN MENU → use USSD_MENU_NOT_FOUND
        // ============================
        session.setState(UssdSessionState.COMPLETED);
        session.setLastInteractionAt(Instant.now());
        session = Objects.requireNonNull(ussdSessionRepository.save(session), "failed to save ussd session");

        throw new ConflictException(
                "Unknown USSD menu state: " + session.getCurrentMenu(),
                ErrorCode.USSD_MENU_NOT_FOUND
        );
    }

    // ============================================================
    // SESSION HELPER
    // ============================================================
        @SuppressWarnings("null")
        private UssdSession getOrCreateSession(String sessionRef, String msisdn) {

        try {
            return ussdSessionRepository
                    .findTopBySessionRefAndStateOrderByLastInteractionAtDesc(
                            sessionRef,
                            UssdSessionState.ACTIVE
                    )
                    .orElseGet(() -> {

                        UssdSession s = UssdSession.builder()
                                .id(UUID.randomUUID())
                                .sessionRef(sessionRef)
                                .msisdn(msisdn)
                                .currentMenu("MAIN")
                                .state(UssdSessionState.ACTIVE)
                                .lastInteractionAt(Instant.now())
                                .build();

                        return Objects.requireNonNull(ussdSessionRepository.save(s), "failed to save ussd session");
                    });

        } catch (Exception ex) {
            // If the session cannot be created or loaded → mark as session error
            throw new ConflictException(
                    "Unable to load USSD session",
                    ErrorCode.USSD_SESSION_NOT_FOUND
            );
        }
    }
}
