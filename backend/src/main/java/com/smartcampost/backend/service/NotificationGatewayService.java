package com.smartcampost.backend.service;

public interface NotificationGatewayService {

    void sendSms(String phone, String message) throws Exception;

    void sendEmail(String to, String subject, String body) throws Exception;
}
