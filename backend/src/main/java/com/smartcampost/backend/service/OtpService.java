package com.smartcampost.backend.service;

import com.smartcampost.backend.model.enums.OtpPurpose;

public interface OtpService {

    /**
     * Generates an OTP and returns the code (for DEV only).
     */
    String generateOtp(String phone, OtpPurpose purpose);


    /**
     * Checks if the OTP is valid (not used, not expired, matches code).
     * Does NOT mark it as used.
     */
    boolean validateOtp(String phone, String otp, OtpPurpose purpose);

    /**
     * Marks the OTP as used after successful operation.
     */
    void consumeOtp(String phone, String otp, OtpPurpose purpose);
}
