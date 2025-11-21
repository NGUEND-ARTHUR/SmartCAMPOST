package com.smartcampost.backend.service;

public interface OtpService {

    void generateOtp(String phone);

    boolean validateOtp(String phone, String otp);
}
