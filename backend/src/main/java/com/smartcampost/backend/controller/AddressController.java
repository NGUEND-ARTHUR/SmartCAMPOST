package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.address.AddressResponse;
import com.smartcampost.backend.dto.address.UpsertAddressRequest;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Address;
import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.AddressRepository;
import com.smartcampost.backend.repository.ClientRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AddressController {

    private final AddressRepository addressRepository;
    private final ClientRepository clientRepository;
    private final UserAccountRepository userAccountRepository;
    private final ParcelRepository parcelRepository;

    @GetMapping("/me")
    public List<AddressResponse> listMyAddresses() {
        Client client = getCurrentClient();
        return addressRepository.findByClient_Id(client.getId())
                .stream()
                .map(AddressController::toResponse)
                .toList();
    }

    @PostMapping
    public AddressResponse createMyAddress(@Valid @RequestBody UpsertAddressRequest request) {
        Client client = getCurrentClient();

        Address toCreate = Address.builder()
                .client(client)
                .label(request.getLabel())
                .street(request.getStreet())
                .city(request.getCity())
                .region(request.getRegion())
                .country(request.getCountry())
                .latitude(toBigDecimal(request.getLatitude()))
                .longitude(toBigDecimal(request.getLongitude()))
                .build();

        Address saved = addressRepository.save(toCreate);
        return toResponse(saved);
    }

    @GetMapping("/client/{phone}")
    @PreAuthorize("hasAnyRole('AGENT','STAFF','ADMIN')")
    public List<AddressResponse> listClientAddresses(@PathVariable String phone) {
        UserAccount clientUser = userAccountRepository.findByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client with phone " + phone + " not found",
                        ErrorCode.CLIENT_NOT_FOUND
                ));
        if (clientUser.getRole() != UserRole.CLIENT || clientUser.getEntityId() == null) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Phone number does not belong to a client");
        }
        Client client = clientRepository.findById(clientUser.getEntityId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client not found",
                        ErrorCode.CLIENT_NOT_FOUND
                ));
        return addressRepository.findByClient_Id(client.getId())
                .stream()
                .map(AddressController::toResponse)
                .toList();
    }

    @PostMapping("/client/{phone}")
    @PreAuthorize("hasAnyRole('AGENT','STAFF','ADMIN')")
    public AddressResponse createAddressForClient(
            @PathVariable String phone,
            @Valid @RequestBody UpsertAddressRequest request
    ) {
        UserAccount clientUser = userAccountRepository.findByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client with phone " + phone + " not found",
                        ErrorCode.CLIENT_NOT_FOUND
                ));
        if (clientUser.getRole() != UserRole.CLIENT || clientUser.getEntityId() == null) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Phone number does not belong to a client");
        }
        Client client = clientRepository.findById(clientUser.getEntityId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client not found",
                        ErrorCode.CLIENT_NOT_FOUND
                ));

        Address toCreate = Address.builder()
                .client(client)
                .label(request.getLabel())
                .street(request.getStreet())
                .city(request.getCity())
                .region(request.getRegion())
                .country(request.getCountry())
                .latitude(toBigDecimal(request.getLatitude()))
                .longitude(toBigDecimal(request.getLongitude()))
                .build();

        Address saved = addressRepository.save(toCreate);
        return toResponse(saved);
    }

    @GetMapping("/{addressId}")
    public AddressResponse getMyAddress(@PathVariable UUID addressId) {
        Address address = getOwnedAddress(addressId);
        return toResponse(address);
    }

    @PutMapping("/{addressId}")
    public AddressResponse updateMyAddress(
            @PathVariable UUID addressId,
            @Valid @RequestBody UpsertAddressRequest request
    ) {
        Address address = getOwnedAddress(addressId);

        address.setLabel(request.getLabel());
        address.setStreet(request.getStreet());
        address.setCity(request.getCity());
        address.setRegion(request.getRegion());
        address.setCountry(request.getCountry());
        address.setLatitude(toBigDecimal(request.getLatitude()));
        address.setLongitude(toBigDecimal(request.getLongitude()));

        Address saved = addressRepository.save(address);
        return toResponse(saved);
    }

    @DeleteMapping("/{addressId}")
    public void deleteMyAddress(@PathVariable UUID addressId) {
        Address address = getOwnedAddress(addressId);
        if (parcelRepository.existsBySenderAddress_IdOrRecipientAddress_Id(addressId, addressId)) {
            throw new ConflictException(
                    "This address is used by an existing parcel and cannot be deleted",
                    ErrorCode.ADDRESS_IN_USE
            );
        }
        addressRepository.delete(address);
    }

    private Address getOwnedAddress(UUID addressId) {
        Client client = getCurrentClient();
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Address not found",
                        ErrorCode.ADDRESS_NOT_FOUND
                ));

        UUID ownerClientId = address.getClient() != null ? address.getClient().getId() : null;
        if (!Objects.equals(ownerClientId, client.getId())) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Address does not belong to current client");
        }

        return address;
    }

    private Client getCurrentClient() {
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.CLIENT) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Current user is not a client");
        }

        UUID entityId = Objects.requireNonNull(user.getEntityId(), "user.entityId is required");
        return clientRepository.findById(entityId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client not found",
                        ErrorCode.CLIENT_NOT_FOUND
                ));
    }

    private UserAccount getCurrentUserAccount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthenticated");
        }

        String subject = auth.getName();

        try {
            UUID userId = UUID.fromString(subject);
            return userAccountRepository.findById(Objects.requireNonNull(userId, "userId is required"))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found",
                            ErrorCode.AUTH_USER_NOT_FOUND
                    ));
        } catch (IllegalArgumentException ex) {
            return userAccountRepository.findByPhone(subject)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found",
                            ErrorCode.AUTH_USER_NOT_FOUND
                    ));
        }
    }

    private static BigDecimal toBigDecimal(Double value) {
        if (value == null) return null;
        return BigDecimal.valueOf(value);
    }

    private static AddressResponse toResponse(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .label(address.getLabel())
                .street(address.getStreet())
                .city(address.getCity())
                .region(address.getRegion())
                .country(address.getCountry())
                .latitude(address.getLatitude() != null ? address.getLatitude().doubleValue() : null)
                .longitude(address.getLongitude() != null ? address.getLongitude().doubleValue() : null)
                .build();
    }
}
