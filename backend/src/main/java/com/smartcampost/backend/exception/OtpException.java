package com.smartcampost.backend.exception;

import lombok.Getter;

@Getter
public class OtpException extends RuntimeException {

    private final ErrorCode code;

    public OtpException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }
}
