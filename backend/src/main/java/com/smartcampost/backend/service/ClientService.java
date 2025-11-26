package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.client.ClientResponse;
import com.smartcampost.backend.dto.client.UpdateClientProfileRequest;
import com.smartcampost.backend.dto.client.UpdatePreferredLanguageRequest;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface ClientService {

    // US6: voir mon profil
    ClientResponse getMyProfile();

    // Client par ID (admin/staff)
    ClientResponse getClientById(UUID clientId);

    // US7: liste paginée des clients
    Page<ClientResponse> listClients(int page, int size);

    // US9: mettre à jour seulement la langue
    ClientResponse updateMyPreferredLanguage(UpdatePreferredLanguageRequest request);

    // 🔥 Nouveau : mettre à jour tout mon profil (nom, email, phone, langue)
    ClientResponse updateMyProfile(UpdateClientProfileRequest request);
}
