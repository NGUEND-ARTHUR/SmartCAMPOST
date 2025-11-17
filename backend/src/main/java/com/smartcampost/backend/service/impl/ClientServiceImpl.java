package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.client.ClientRequest;
import com.smartcampost.backend.dto.client.ClientResponse;
import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.repository.ClientRepository;
import com.smartcampost.backend.service.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;

    @Override
    public ClientResponse createClient(ClientRequest request) {
        Client client = Client.builder()
                .id(UUID.randomUUID())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .preferredLanguage(request.getPreferredLanguage())
                .build();

        client = clientRepository.save(client);
        return toResponse(client);
    }

    @Override
    public ClientResponse getClient(UUID clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + clientId));
        return toResponse(client);
    }

    @Override
    public ClientResponse updateProfile(UUID clientId,
                                        String fullName,
                                        String email,
                                        String preferredLanguage) {

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found: " + clientId));

        if (fullName != null) {
            client.setFullName(fullName);
        }
        if (email != null) {
            client.setEmail(email);
        }
        if (preferredLanguage != null) {
            client.setPreferredLanguage(preferredLanguage);
        }

        client = clientRepository.save(client);
        return toResponse(client);
    }

    @Override
    public Client findOrCreateByPhone(String fullName,
                                      String phone,
                                      String email,
                                      String preferredLanguage) {

        return clientRepository.findByPhone(phone)
                .orElseGet(() -> clientRepository.save(
                        Client.builder()
                                .id(UUID.randomUUID())
                                .fullName(fullName)
                                .phone(phone)
                                .email(email)
                                .preferredLanguage(preferredLanguage)
                                .build()
                ));
    }

    private ClientResponse toResponse(Client client) {
        return ClientResponse.builder()
                .id(client.getId())
                .fullName(client.getFullName())
                .phone(client.getPhone())
                .email(client.getEmail())
                .preferredLanguage(client.getPreferredLanguage())
                .build();
    }
}
