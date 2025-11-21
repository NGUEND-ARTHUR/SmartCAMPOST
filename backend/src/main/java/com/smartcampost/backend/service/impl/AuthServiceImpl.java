package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.auth.AuthResponse;
import com.smartcampost.backend.dto.auth.ChangePasswordRequest;
import com.smartcampost.backend.dto.auth.LoginRequest;
import com.smartcampost.backend.dto.auth.RegisterClientRequest;
import com.smartcampost.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    // Ici plus tard tu pourras injecter tes dépendances :
    // private final ClientRepository clientRepository;
    // private final PasswordEncoder passwordEncoder;
    // private final JwtService jwtService;
    // etc.

    @Override
    public AuthResponse registerClient(RegisterClientRequest request) {
        // TODO: implémenter la vraie logique (création client + user + token)

        // Implémentation factice pour que ça compile et que l'API tourne
        return AuthResponse.builder()
                .userId(UUID.randomUUID())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .accessToken("DUMMY_REGISTER_TOKEN")
                .tokenType("Bearer")
                .build();
    }

    @Override
    public void sendPhoneOtp(String phone) {
        // TODO: implémenter l'envoi d'OTP (SMS, etc.)
        // Pour l'instant, on ne fait rien (stub)
    }

    @Override
    public boolean verifyPhoneOtp(String phone, String otpCode) {
        // TODO: vérifier le code OTP stocké (en BDD, cache, etc.)

        // Stub: on fait semblant que tout est ok
        return true;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        // TODO: vérifier téléphone + mot de passe, charger l'utilisateur, générer JWT

        // Stub: retourne une réponse fictive
        return AuthResponse.builder()
                .userId(UUID.randomUUID())
                .fullName("Demo User")
                .phone(request.getPhone())
                .accessToken("DUMMY_LOGIN_TOKEN")
                .tokenType("Bearer")
                .build();
    }

    @Override
    public void changePassword(ChangePasswordRequest request) {
        // TODO: récupérer l'utilisateur, vérifier ancien mot de passe, sauvegarder le nouveau
        // Stub: ne fait rien pour l'instant
    }
}
