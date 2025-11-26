package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.client.ClientResponse;
import com.smartcampost.backend.dto.client.UpdateClientProfileRequest;
import com.smartcampost.backend.dto.client.UpdatePreferredLanguageRequest;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.ClientRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final UserAccountRepository userAccountRepository;

    // ==================== PUBLIC API ====================

    @Override
    public ClientResponse getMyProfile() {
        Client client = getCurrentClient();
        return toResponse(client);
    }

    @Override
    public ClientResponse getClientById(UUID clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found"));
        return toResponse(client);
    }

    @Override
    public Page<ClientResponse> listClients(int page, int size) {
        // TODO: Optionnel - vérifier que l'utilisateur n'est pas un simple CLIENT (admin/staff only)
        return clientRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    @Override
    public ClientResponse updateMyPreferredLanguage(UpdatePreferredLanguageRequest request) {
        Client client = getCurrentClient();
        client.setPreferredLanguage(request.getPreferredLanguage());
        clientRepository.save(client);
        return toResponse(client);
    }

    @Override
    public ClientResponse updateMyProfile(UpdateClientProfileRequest request) {

        // Récupérer l'utilisateur et le client courant
        UserAccount user = getCurrentUserAccount();

        if (user.getRole() != UserRole.CLIENT) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Current user is not a client");
        }

        Client client = clientRepository.findById(user.getEntityId())
                .orElseThrow(() -> new ResourceNotFoundException("Client not found"));

        // === PHONE (avec contrôle d'unicité) ===
        if (request.getPhone() != null && !request.getPhone().equals(client.getPhone())) {
            // Vérifier si un autre compte utilise déjà ce phone
            if (userAccountRepository.existsByPhone(request.getPhone())) {
                throw new ConflictException("Phone already in use");
            }
            client.setPhone(request.getPhone());
            user.setPhone(request.getPhone());
            userAccountRepository.save(user);
        }

        // === EMAIL (unicité au niveau Client) ===
        if (request.getEmail() != null && !request.getEmail().equals(client.getEmail())) {
            if (clientRepository.existsByEmail(request.getEmail())) {
                throw new ConflictException("Email already in use");
            }
            client.setEmail(request.getEmail());
        }

        // === FULL NAME ===
        if (request.getFullName() != null) {
            client.setFullName(request.getFullName());
        }

        // === LANGUE PRÉFÉRÉE ===
        if (request.getPreferredLanguage() != null) {
            client.setPreferredLanguage(request.getPreferredLanguage());
        }

        clientRepository.save(client);

        return toResponse(client);
    }

    // ==================== HELPERS ====================

    private Client getCurrentClient() {
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.CLIENT) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Current user is not a client");
        }

        return clientRepository.findById(user.getEntityId())
                .orElseThrow(() -> new ResourceNotFoundException("Client not found"));
    }

    private UserAccount getCurrentUserAccount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Unauthenticated");
        }

        String subject = auth.getName(); // "sub" du JWT

        // On essaie d'abord comme UUID (userId), sinon comme phone
        try {
            UUID userId = UUID.fromString(subject);
            return userAccountRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        } catch (IllegalArgumentException ex) {
            // pas un UUID -> on considère que c'est le phone
            return userAccountRepository.findByPhone(subject)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }
    }

    private ClientResponse toResponse(Client client) {
        return ClientResponse.builder()
                .id(client.getId())
                .fullName(client.getFullName())
                .phone(client.getPhone())
                .email(client.getEmail())
                .preferredLanguage(client.getPreferredLanguage())
                .createdAt(client.getCreatedAt())
                .build();
    }
}
