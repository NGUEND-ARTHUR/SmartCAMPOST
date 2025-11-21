package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.auth.*;
import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.UserAccount;
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

    @Override
    public AuthResponse registerClient(RegisterClientRequest request) {

        if (userAccountRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone already exists");
        }

        Client client = Client.builder()
                .id(UUID.randomUUID())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .preferredLanguage(request.getPreferredLanguage())
                .build();

        clientRepository.save(client);

        UserAccount account = UserAccount.builder()
                .phone(request.getPhone())
                .passwordHash(encoder.encode(request.getPassword()))
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

    @Override
    public AuthResponse login(LoginRequest request) {

        UserAccount user = userAccountRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!encoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .userId(user.getId())
                .entityId(user.getEntityId())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .accessToken(token)
                .tokenType("Bearer")
                .build();
    }

    @Override
    public void sendOtp(String phone) {
        otpService.generateOtp(phone);
    }

    @Override
    public boolean verifyOtp(String phone, String otp) {
        return otpService.validateOtp(phone, otp);
    }

    @Override
    public void changePassword(ChangePasswordRequest request) {
        // 🔴 OLD (wrong):
        // UserAccount user = userAccountRepository.findByPhone(request.getPhone())

        // ✅ NEW (correct, using userId from ChangePasswordRequest)
        UserAccount user = userAccountRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Old password incorrect");
        }

        user.setPasswordHash(encoder.encode(request.getNewPassword()));
        userAccountRepository.save(user);
    }
}
