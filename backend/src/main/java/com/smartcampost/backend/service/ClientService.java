package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Client;

import java.util.List;
import java.util.UUID;

public interface ClientService {

    Client getClient(UUID clientId);

    Client updateProfile(UUID clientId, String fullName, String email, String preferredLanguage);

    List<Client> searchByPhoneOrName(String query);
}
