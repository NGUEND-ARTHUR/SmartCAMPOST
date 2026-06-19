package com.smartcampost.backend.controller;

import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.model.OperationalRating;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.OperationalRatingRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class OperationalRatingController {

    private final OperationalRatingRepository ratingRepository;
    private final UserAccountRepository userAccountRepository;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> rate(@RequestBody Map<String, Object> request) {
        UserAccount actor = currentUser();
        int score = Math.max(1, Math.min(5, intValue(request.get("score"), 5)));
        UserRole ratedRole = UserRole.valueOf(stringValue(request.get("ratedRole"), "COURIER").toUpperCase());
        UUID ratedEntityId = uuidValue(request.get("ratedEntityId"), actor.getEntityId());
        String trackingRef = stringValue(request.get("trackingRef"), null);
        UUID parcelId = uuidValue(request.get("parcelId"), null);

        OperationalRating saved = ratingRepository.save(OperationalRating.builder()
                .ratedBy(actor)
                .ratedEntityId(ratedEntityId)
                .ratedRole(ratedRole)
                .parcelId(parcelId)
                .trackingRef(trackingRef)
                .score(score)
                .comment(stringValue(request.get("comment"), null))
                .build());

        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "score", saved.getScore(),
                "ratedRole", saved.getRatedRole().name(),
                "ratedEntityId", saved.getRatedEntityId(),
                "trackingRef", saved.getTrackingRef() == null ? "" : saved.getTrackingRef(),
                "createdAt", saved.getCreatedAt()
        ));
    }

    @GetMapping("/tracking/{trackingRef}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> byTracking(@PathVariable String trackingRef) {
        return ResponseEntity.ok(ratingRepository.findByTrackingRef(trackingRef));
    }

    private UserAccount currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Not authenticated");
        }
        String principal = auth.getName();
        return userAccountRepository.findByPhone(principal)
                .or(() -> {
                    try {
                        return userAccountRepository.findById(UUID.fromString(principal));
                    } catch (IllegalArgumentException ex) {
                        return java.util.Optional.empty();
                    }
                })
                .orElseThrow(() -> new AuthException(ErrorCode.AUTH_USER_NOT_FOUND, "User not found"));
    }

    private static String stringValue(Object value, String fallback) {
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private static int intValue(Object value, int fallback) {
        if (value == null) return fallback;
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static UUID uuidValue(Object value, UUID fallback) {
        if (value == null || String.valueOf(value).isBlank()) return fallback;
        try {
            return UUID.fromString(String.valueOf(value));
        } catch (IllegalArgumentException ex) {
            return fallback;
        }
    }
}
