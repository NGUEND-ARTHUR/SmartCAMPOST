package com.smartcampost.backend.exception;

import lombok.Getter;

@Getter
public class AuthException extends RuntimeException {

    private final ErrorCode code;

    public AuthException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }
}
