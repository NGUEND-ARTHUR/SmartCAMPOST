package com.smartcampost.backend.service;

public interface SmsGatewayService {

    void sendSms(String phoneNumber, String message);
}
