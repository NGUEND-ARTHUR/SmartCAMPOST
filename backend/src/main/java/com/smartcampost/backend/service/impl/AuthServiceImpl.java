package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.auth.*;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.OtpException;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.*;
import com.smartcampost.backend.model.enums.OtpPurpose;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.*;
import com.smartcampost.backend.security.AccountLockoutService;
import com.smartcampost.backend.security.JwtService;
import com.smartcampost.backend.service.AuthService;
import com.smartcampost.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.UUID;
import org.springframework.lang.Nullable;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserAccountRepository userAccountRepository;
    private final ClientRepository clientRepository;
    private final StaffRepository staffRepository;
    private final AgentRepository agentRepository;
    private final CourierRepository courierRepository;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final AccountLockoutService lockoutService;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // ============================================================
    // REGISTER CLIENT
    // ============================================================
    @Override
    public AuthResponse registerClient(RegisterClientRequest request) {

        Objects.requireNonNull(request, "request is required");

        // 1) Vérifier si le téléphone existe déjà → USER_PHONE_EXISTS
        if (userAccountRepository.existsByPhone(request.getPhone())) {
            throw new ConflictException(
                    "Phone already exists",
                    ErrorCode.USER_PHONE_EXISTS
            );
        }

        // 1b) Vérifier email en double
        if (request.getEmail() != null && clientRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException(
                    "Email already exists",
                    ErrorCode.CLIENT_CONFLICT
            );
        }

        // 2) Vérifier OTP
        boolean validOtp = otpService.validateOtp(
            request.getPhone(),
            request.getOtp(),
            OtpPurpose.REGISTER
        );

        if (!validOtp) {
            throw new OtpException(ErrorCode.OTP_INVALID, "Invalid or expired OTP");
        }

        // 3) Encoder mot de passe
        String encodedPassword = encoder.encode(request.getPassword());

        // 4) Créer Client
        Client client = Client.builder()
            .id(UUID.randomUUID())
            .fullName(request.getFullName())
            .phone(request.getPhone())
            .email(request.getEmail())
            .preferredLanguage(request.getPreferredLanguage())
            .passwordHash(encodedPassword)
            .build();

        @SuppressWarnings("null")
        Client savedClient = clientRepository.save(client);
        client = savedClient;

        // 5) Créer UserAccount
        UserAccount account = UserAccount.builder()
            .id(UUID.randomUUID())
            .phone(request.getPhone())
            .passwordHash(encodedPassword)
            .role(UserRole.CLIENT)
            .entityId(client.getId())
            .build();

        @SuppressWarnings("null")
        UserAccount savedAccount = userAccountRepository.save(account);
        account = savedAccount;

        // 6) Mark OTP as used only after successful registration
        otpService.consumeOtp(request.getPhone(), request.getOtp(), OtpPurpose.REGISTER);

        // 6) JWT Token
        String token = jwtService.generateToken(account);

        return AuthResponse.builder()
                .userId(account.getId())
                .entityId(client.getId())
                .fullName(client.getFullName())
                .phone(account.getPhone())
                .role("CLIENT")
                .accessToken(token)
                .tokenType("Bearer")
                .build();
    }

    // ============================================================
    // LOGIN classique
    // ============================================================
    @Override
    public AuthResponse login(LoginRequest request) {

        Objects.requireNonNull(request, "request is required");

        // SECURITY: Check if account is locked due to too many failed attempts
        if (lockoutService.isLocked(request.getPhone())) {
            long remainingSeconds = lockoutService.getRemainingLockoutSeconds(request.getPhone());
            throw new AuthException(
                ErrorCode.AUTH_ACCOUNT_LOCKED,
                "Account temporarily locked. Try again in " + (remainingSeconds / 60) + " minutes."
            );
        }

        UserAccount user = userAccountRepository.findByPhone(request.getPhone())
            .orElseThrow(() -> {
                // Record failed attempt even for non-existent accounts (prevents user enumeration)
                lockoutService.recordFailedAttempt(request.getPhone());
                return new AuthException(ErrorCode.AUTH_USER_NOT_FOUND, "Invalid credentials");
            });

        if (!encoder.matches(request.getPassword(), user.getPasswordHash())) {
            // Record failed attempt
            boolean nowLocked = lockoutService.recordFailedAttempt(request.getPhone());
            if (nowLocked) {
                throw new AuthException(
                    ErrorCode.AUTH_ACCOUNT_LOCKED,
                    "Account locked due to too many failed attempts. Try again later."
                );
            }
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid credentials");
        }

        // SECURITY: Clear lockout on successful login
        lockoutService.clearLockout(request.getPhone());

        String fullName = resolveFullName(user);
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .userId(user.getId())
                .entityId(user.getEntityId())
                .fullName(fullName)
                .phone(user.getPhone())
                .role(user.getRole().name())
                .accessToken(token)
                .tokenType("Bearer")
                .build();
    }

    /**
     * Resolves the full name based on user role
     */
    private @Nullable String resolveFullName(UserAccount user) {
        switch (user.getRole()) {
            case CLIENT:
                UUID clientId = Objects.requireNonNull(user.getEntityId(), "user.entityId is required");
                return clientRepository.findById(clientId)
                    .map(Client::getFullName)
                    .orElse(null);
            case STAFF:
            case ADMIN:
            case FINANCE:
            case RISK:
                UUID staffId = Objects.requireNonNull(user.getEntityId(), "user.entityId is required");
                return staffRepository.findById(staffId)
                    .map(Staff::getFullName)
                    .orElse(null);
            case AGENT:
                UUID agentId = Objects.requireNonNull(user.getEntityId(), "user.entityId is required");
                return agentRepository.findById(agentId)
                    .map(Agent::getFullName)
                    .orElse(null);
            case COURIER:
                UUID courierId = Objects.requireNonNull(user.getEntityId(), "user.entityId is required");
                return courierRepository.findById(courierId)
                    .map(Courier::getFullName)
                    .orElse(null);
            default:
                return null;
        }
    }

    // ============================================================
    // OTP GENERIC
    // ============================================================
    @Override
    public SendOtpResponse sendOtp(String phone) {
        String otp = otpService.generateOtp(phone, OtpPurpose.REGISTER);
        return SendOtpResponse.builder().otp(otp).build();
    }

    @Override
    public boolean verifyOtp(String phone, String otp) {
        return otpService.validateOtp(phone, otp, OtpPurpose.REGISTER);
    }

    // ============================================================
    // CHANGE PASSWORD
    // ============================================================
    @Override
    public void changePassword(ChangePasswordRequest request) {

        Objects.requireNonNull(request, "request is required");

        UUID uid = Objects.requireNonNull(request.getUserId(), "userId is required");
        UserAccount user = userAccountRepository.findById(uid)
            .orElseThrow(() ->
                new ResourceNotFoundException("User not found", ErrorCode.AUTH_USER_NOT_FOUND));

        if (!encoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Old password incorrect");
        }

        user.setPasswordHash(encoder.encode(request.getNewPassword()));
        userAccountRepository.save(user);
    }

    // ============================================================
    // RESET PASSWORD VIA OTP
    // ============================================================
    @Override
    public void requestPasswordReset(String phone) {

        Objects.requireNonNull(phone, "phone is required");
        userAccountRepository.findByPhone(phone)
                .orElseThrow(() ->
                        new AuthException(ErrorCode.AUTH_USER_NOT_FOUND, "No account with this phone"));

        otpService.generateOtp(phone, OtpPurpose.RESET_PASSWORD);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {

        Objects.requireNonNull(request, "request is required");

        boolean validOtp = otpService.validateOtp(
                request.getPhone(),
                request.getOtp(),
                OtpPurpose.RESET_PASSWORD
        );

        if (!validOtp) {
            throw new OtpException(ErrorCode.OTP_INVALID, "Invalid or expired OTP");
        }

        UserAccount user = userAccountRepository.findByPhone(request.getPhone())
            .orElseThrow(() ->
                new ResourceNotFoundException("User not found", ErrorCode.AUTH_USER_NOT_FOUND));

        String encoded = encoder.encode(request.getNewPassword());
        user.setPasswordHash(encoded);
        userAccountRepository.save(user);

        if (user.getRole() == UserRole.CLIENT) {
            UUID entityId = user.getEntityId();
            if (entityId != null) {
                clientRepository.findById(entityId)
                        .ifPresent(client -> {
                            client.setPasswordHash(encoded);
                            clientRepository.save(client);
                        });
            }
        }
    }

    // ============================================================
    // LOGIN WITH OTP
    // ============================================================
    @Override
    public void requestLoginOtp(String phone) {

        Objects.requireNonNull(phone, "phone is required");
        userAccountRepository.findByPhone(phone)
                .orElseThrow(() ->
                        new AuthException(ErrorCode.AUTH_USER_NOT_FOUND, "No account with this phone"));

        otpService.generateOtp(phone, OtpPurpose.LOGIN);
    }

    @Override
    public AuthResponse loginWithOtp(LoginOtpConfirmRequest request) {

        Objects.requireNonNull(request, "request is required");

        boolean validOtp = otpService.validateOtp(
                request.getPhone(),
                request.getOtp(),
                OtpPurpose.LOGIN
        );
        if (!validOtp) {
            throw new OtpException(ErrorCode.OTP_INVALID, "Invalid or expired OTP");
        }

        UserAccount user = userAccountRepository.findByPhone(request.getPhone())
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found", ErrorCode.AUTH_USER_NOT_FOUND));

        String fullName = resolveFullName(user);
        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .userId(user.getId())
                .entityId(user.getEntityId())
                .fullName(fullName)
                .phone(user.getPhone())
                .role(user.getRole().name())
                .accessToken(token)
                .tokenType("Bearer")
                .build();
    }
}
