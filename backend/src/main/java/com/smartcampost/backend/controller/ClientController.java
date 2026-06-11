package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.client.ClientResponse;
import com.smartcampost.backend.dto.client.UpdateClientProfileRequest;
import com.smartcampost.backend.dto.client.UpdatePreferredLanguageRequest;
import com.smartcampost.backend.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ClientResponse> getMyProfile() {
        return ResponseEntity.ok(clientService.getMyProfile());
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ClientResponse> updateMyProfile(
            @Valid @RequestBody UpdateClientProfileRequest request
    ) {
        return ResponseEntity.ok(clientService.updateMyProfile(request));
    }

    @PatchMapping("/me/preferred-language")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ClientResponse> updateMyPreferredLanguage(
            @Valid @RequestBody UpdatePreferredLanguageRequest request
    ) {
        return ResponseEntity.ok(clientService.updateMyPreferredLanguage(request));
    }

    @GetMapping("/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ClientResponse> getClientById(@PathVariable UUID clientId) {
        return ResponseEntity.ok(clientService.getClientById(clientId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<Page<ClientResponse>> listClients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(clientService.listClients(page, size));
    }
}
