package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.ussd.UssdRequest;
import com.smartcampost.backend.dto.ussd.UssdResponse;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.UssdSession;
import com.smartcampost.backend.model.enums.UssdSessionState;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.UssdSessionRepository;
import com.smartcampost.backend.service.UssdService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UssdServiceImpl implements UssdService {

    private final UssdSessionRepository ussdSessionRepository;
    private final ParcelRepository parcelRepository;

    @Override
    public UssdResponse handleUssdRequest(UssdRequest request) {

        UssdSession session = getOrCreateSession(
                request.getSessionRef(),
                request.getMsisdn()
        );

        String input = request.getUserInput().trim();

        // Simple menu:
        // First step: "0" or empty -> show main menu
        if (input.isEmpty() || "0".equals(input)) {
            session.setCurrentMenu("MAIN");
            session.setLastInteractionAt(Instant.now());
            ussdSessionRepository.save(session);

            String msg = "Welcome to SmartCAMPOST\n"
                    + "1. Track parcel\n"
                    + "0. Exit";
            return UssdResponse.builder()
                    .message(msg)
                    .endSession(false)
                    .build();
        }

        if ("1".equals(input) && "MAIN".equals(session.getCurrentMenu())) {
            session.setCurrentMenu("TRACK_PROMPT");
            session.setLastInteractionAt(Instant.now());
            ussdSessionRepository.save(session);

            String msg = "Enter tracking number:";
            return UssdResponse.builder()
                    .message(msg)
                    .endSession(false)
                    .build();
        }

        if ("TRACK_PROMPT".equals(session.getCurrentMenu())) {
            // input is tracking ref
            String trackingRef = input;

            Optional<Parcel> parcelOpt = parcelRepository.findByTrackingRef(trackingRef);

            String msg;
            if (parcelOpt.isPresent()) {
                Parcel parcel = parcelOpt.get();
                msg = "Parcel " + trackingRef + " status: " + parcel.getStatus().name();
            } else {
                msg = "Tracking number not found.";
            }

            session.setState(UssdSessionState.COMPLETED);
            session.setLastInteractionAt(Instant.now());
            ussdSessionRepository.save(session);

            return UssdResponse.builder()
                    .message(msg)
                    .endSession(true)
                    .build();
        }

        // default: finish
        session.setState(UssdSessionState.COMPLETED);
        session.setLastInteractionAt(Instant.now());
        ussdSessionRepository.save(session);

        return UssdResponse.builder()
                .message("Session ended.")
                .endSession(true)
                .build();
    }

    private UssdSession getOrCreateSession(String sessionRef, String msisdn) {
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
                    return ussdSessionRepository.save(s);
                });
    }
}
