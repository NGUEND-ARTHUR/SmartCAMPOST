package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.auth.*;
import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.OtpPurpose;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.ClientRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
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
    private final JwtService jwtService;
    private final OtpService otpService;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // ============================================================
    // REGISTER CLIENT (avec OTP REGISTER)
    // ============================================================
    @Override
    public AuthResponse registerClient(RegisterClientRequest request) {

        if (userAccountRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone already exists");
        }

        boolean validOtp = otpService.validateOtp(
                request.getPhone(),
                request.getOtp(),
                OtpPurpose.REGISTER
        );
        if (!validOtp) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        String encodedPassword = encoder.encode(request.getPassword());

        Client client = Client.builder()
                .id(UUID.randomUUID())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .preferredLanguage(request.getPreferredLanguage())
                .passwordHash(encodedPassword)
                .build();

        clientRepository.save(client);

        UserAccount account = UserAccount.builder()
                .id(UUID.randomUUID())
                .phone(request.getPhone())
                .passwordHash(encodedPassword)
                .role(UserRole.CLIENT)
                .entityId(client.getId())
                .build();

        userAccountRepository.save(account);

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
    // LOGIN classique (password)
    // ============================================================
    @Override
    public AuthResponse login(LoginRequest request) {

        UserAccount user = userAccountRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!encoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String fullName = null;

        if (user.getRole() == UserRole.CLIENT) {
            Client client = clientRepository.findById(user.getEntityId())
                    .orElseThrow(() -> new RuntimeException("Client not found"));
            fullName = client.getFullName();
        }

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

    // ============================================================
    // OTP GÉNÉRIQUE (REGISTER par défaut)
    // ============================================================
    @Override
    public void sendOtp(String phone) {
        otpService.generateOtp(phone, OtpPurpose.REGISTER);
    }

    @Override
    public boolean verifyOtp(String phone, String otp) {
        return otpService.validateOtp(phone, otp, OtpPurpose.REGISTER);
    }

    // ============================================================
    // CHANGE PASSWORD (user connecté)
    // ============================================================
    @Override
    public void changePassword(ChangePasswordRequest request) {

        UserAccount user = userAccountRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Old password incorrect");
        }

        user.setPasswordHash(encoder.encode(request.getNewPassword()));
        userAccountRepository.save(user);
    }

    // ============================================================
    // PASSWORD RESET FLOW (OTP RESET_PASSWORD)
    // ============================================================
    @Override
    public void requestPasswordReset(String phone) {
        userAccountRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("No account with this phone"));

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
            throw new RuntimeException("Invalid or expired OTP");
        }

        UserAccount user = userAccountRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new RuntimeException("User not found"));

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
    // LOGIN PAR OTP (OtpPurpose.LOGIN)
    // ============================================================
    @Override
    public void requestLoginOtp(String phone) {
        // vérifier que le compte existe
        userAccountRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("No account with this phone"));
        // envoyer un OTP pour LOGIN
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
            throw new RuntimeException("Invalid or expired OTP");
        }

        UserAccount user = userAccountRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String fullName = null;
        if (user.getRole() == UserRole.CLIENT) {
            Client client = clientRepository.findById(user.getEntityId())
                    .orElseThrow(() -> new RuntimeException("Client not found"));
            fullName = client.getFullName();
        }

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
