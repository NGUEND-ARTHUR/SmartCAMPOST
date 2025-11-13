package com.smartcampost.backend.service;

import com.smartcampost.backend.model.Address;

import java.util.List;
import java.util.UUID;

public interface AddressService {

    Address createAddressForClient(UUID clientId, Address address);

    Address updateAddress(UUID addressId, Address address);

    void deleteAddress(UUID addressId);

    List<Address> getClientAddresses(UUID clientId);
}
