package com.smartcampost.backend.service;
import com.smartcampost.backend.dto.ussd.UssdRequest;
import com.smartcampost.backend.dto.ussd.UssdResponse;

public interface UssdService {

    UssdResponse handleUssdRequest(UssdRequest request);
}