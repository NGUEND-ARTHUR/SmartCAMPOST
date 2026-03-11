package com.smartcampost.backend.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;

@Service
public class GoogleTokenVerifierService {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifierService(
            @Value("${smartcampost.google.client-id:}") String clientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    /**
     * Verifies a Google ID token and returns the payload as a Map.
     * Returns null if the token is invalid.
     */
    public Map<String, Object> verify(String idTokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                return null;
            }
            GoogleIdToken.Payload payload = idToken.getPayload();
            return Map.of(
                    "sub", payload.getSubject(),
                    "email", String.valueOf(payload.getEmail()),
                    "name", String.valueOf(payload.getOrDefault("name", "")),
                    "picture", String.valueOf(payload.getOrDefault("picture", ""))
            );
        } catch (Exception e) {
            return null;
        }
    }
}
