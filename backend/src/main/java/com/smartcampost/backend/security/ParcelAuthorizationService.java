package com.smartcampost.backend.security;

import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.ScanEvent;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.ScanEventRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ParcelAuthorizationService {

    private final ParcelRepository parcelRepository;
    private final ScanEventRepository scanEventRepository;
    private final UserAccountRepository userAccountRepository;

    public Parcel requireReadableParcel(UUID parcelId, Authentication authentication) {
        Parcel parcel = parcelRepository.findById(Objects.requireNonNull(parcelId, "parcelId is required"))
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
        requireReadableParcel(parcel, authentication);
        return parcel;
    }

    public void requireReadableParcel(Parcel parcel, Authentication authentication) {
        UserAccount user = currentUser(authentication);
        if (canReadParcel(parcel, user)) {
            return;
        }
        throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "You cannot access this parcel");
    }

    public void requirePricingAccess(UUID parcelId, Authentication authentication) {
        Parcel parcel = requireReadableParcel(parcelId, authentication);
        UserAccount user = currentUser(authentication);
        if (user.getRole() == UserRole.COURIER || user.getRole() == UserRole.AGENT) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "You cannot access parcel pricing details");
        }
        requireReadableParcel(parcel, authentication);
    }

    private boolean canReadParcel(Parcel parcel, UserAccount user) {
        if (user.getRole() == UserRole.CLIENT) {
            return parcel.getClient() != null && Objects.equals(parcel.getClient().getId(), user.getEntityId());
        }

        if (user.getRole().isStaffLike()) {
            return true;
        }

        if (user.getRole() == UserRole.AGENT || user.getRole() == UserRole.COURIER) {
            String subject = user.getId() != null ? user.getId().toString() : null;
            String entityId = user.getEntityId() != null ? user.getEntityId().toString() : null;
            boolean validatedByUser = parcel.getValidatedBy() != null
                    && Objects.equals(parcel.getValidatedBy().getId(), user.getEntityId());
            boolean scannedByUser = scanEventRepository.findTopByParcel_IdOrderByTimestampDesc(parcel.getId())
                    .map(ScanEvent::getActorId)
                    .filter(actorId -> Objects.equals(actorId, subject) || Objects.equals(actorId, entityId))
                    .isPresent();
            return validatedByUser || scannedByUser;
        }

        return false;
    }

    private UserAccount currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthenticated");
        }

        String subject = authentication.getName();
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
