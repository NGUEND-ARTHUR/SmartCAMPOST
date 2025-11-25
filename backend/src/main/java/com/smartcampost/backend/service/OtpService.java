package com.smartcampost.backend.service;

import com.smartcampost.backend.model.enums.OtpPurpose;

public interface OtpService {

    void generateOtp(String phone, OtpPurpose purpose);

    boolean validateOtp(String phone, String otp, OtpPurpose purpose);
}
