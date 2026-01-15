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
import com.smartcampost.backend.security.JwtService;
import com.smartcampost.backend.service.AuthService;
import com.smartcampost.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

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

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // ============================================================
    // REGISTER CLIENT
    // ============================================================
    @Override
    public AuthResponse registerClient(RegisterClientRequest request) {

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

        clientRepository.save(client);

        // 5) Créer UserAccount
        UserAccount account = UserAccount.builder()
            .id(UUID.randomUUID())
            .phone(request.getPhone())
            .passwordHash(encodedPassword)
            .role(UserRole.CLIENT)
            .entityId(client.getId())
            .build();

        userAccountRepository.save(account);

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

        UserAccount user = userAccountRepository.findByPhone(request.getPhone())
                .orElseThrow(() ->
                        new AuthException(ErrorCode.AUTH_USER_NOT_FOUND, "Invalid credentials")
                );

        if (!encoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid credentials");
        }

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
    private String resolveFullName(UserAccount user) {
        switch (user.getRole()) {
            case CLIENT:
                return clientRepository.findById(user.getEntityId())
                        .map(Client::getFullName)
                        .orElse(null);
            case STAFF:
            case ADMIN:
            case FINANCE:
            case RISK:
                return staffRepository.findById(user.getEntityId())
                        .map(Staff::getFullName)
                        .orElse(null);
            case AGENT:
                return agentRepository.findById(user.getEntityId())
                        .map(Agent::getFullName)
                        .orElse(null);
            case COURIER:
                return courierRepository.findById(user.getEntityId())
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
    public String sendOtp(String phone) {
        return otpService.generateOtp(phone, OtpPurpose.REGISTER);
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

        UserAccount user = userAccountRepository.findById(request.getUserId())
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
        userAccountRepository.findByPhone(phone)
                .orElseThrow(() ->
                        new AuthException(ErrorCode.AUTH_USER_NOT_FOUND, "No account with this phone"));

        otpService.generateOtp(phone, OtpPurpose.RESET_PASSWORD);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {

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
            clientRepository.findById(user.getEntityId())
                    .ifPresent(client -> {
                        client.setPasswordHash(encoded);
                        clientRepository.save(client);
                    });
        }
    }

    // ============================================================
    // LOGIN WITH OTP
    // ============================================================
    @Override
    public void requestLoginOtp(String phone) {
        userAccountRepository.findByPhone(phone)
                .orElseThrow(() ->
                        new AuthException(ErrorCode.AUTH_USER_NOT_FOUND, "No account with this phone"));

        otpService.generateOtp(phone, OtpPurpose.LOGIN);
    }

    @Override
    public AuthResponse loginWithOtp(LoginOtpConfirmRequest request) {

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
