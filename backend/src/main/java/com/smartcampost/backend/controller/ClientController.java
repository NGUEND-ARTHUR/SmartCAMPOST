package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.client.ClientResponse;
import com.smartcampost.backend.dto.client.UpdateClientProfileRequest;
import com.smartcampost.backend.dto.client.UpdatePreferredLanguageRequest;
import com.smartcampost.backend.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    // US6: Mon profil (client connecté)
    @GetMapping("/me")
    public ResponseEntity<ClientResponse> getMyProfile() {
        return ResponseEntity.ok(clientService.getMyProfile());
    }

    // 🔥 Mettre à jour tout mon profil (nom, email, phone, langue)
    @PutMapping("/me")
    public ResponseEntity<ClientResponse> updateMyProfile(
            @Valid @RequestBody UpdateClientProfileRequest request
    ) {
        return ResponseEntity.ok(clientService.updateMyProfile(request));
    }

    // US9: Mettre à jour ma langue préférée
    @PatchMapping("/me/preferred-language")
    public ResponseEntity<ClientResponse> updateMyPreferredLanguage(
            @Valid @RequestBody UpdatePreferredLanguageRequest request
    ) {
        return ResponseEntity.ok(clientService.updateMyPreferredLanguage(request));
    }

    // Client par ID (pour admin/staff)
    @GetMapping("/{clientId}")
    public ResponseEntity<ClientResponse> getClientById(@PathVariable UUID clientId) {
        return ResponseEntity.ok(clientService.getClientById(clientId));
    }

    // US7: Liste paginée de tous les clients (admin/staff)
    @GetMapping
    public ResponseEntity<Page<ClientResponse>> listClients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(clientService.listClients(page, size));
    }
}
