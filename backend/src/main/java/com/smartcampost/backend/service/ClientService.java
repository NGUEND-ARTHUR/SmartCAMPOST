package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.client.ClientRequest;
import com.smartcampost.backend.dto.client.ClientResponse;
import com.smartcampost.backend.model.Client;

import java.util.UUID;

public interface ClientService {

    ClientResponse createClient(ClientRequest request);

    ClientResponse getClient(UUID clientId);

    ClientResponse updateProfile(UUID clientId,
                                 String fullName,
                                 String email,
                                 String preferredLanguage);

    /**
     * Utilisé par la logique métier : retrouve un client par téléphone,
     * ou le crée s'il n'existe pas encore.
     */
    Client findOrCreateByPhone(String fullName,
                               String phone,
                               String email,
                               String preferredLanguage);
}
