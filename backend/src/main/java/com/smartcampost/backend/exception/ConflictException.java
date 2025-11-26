package com.smartcampost.backend.exception;

import lombok.Getter;

@Getter
public class ConflictException extends RuntimeException {

    private final ErrorCode code;

    public ConflictException(String message) {
        super(message);
        this.code = ErrorCode.CONFLICT;
    }
}
