package com.smartcampost.backend.exception;

import lombok.Getter;

@Getter
public class ResourceNotFoundException extends RuntimeException {

    private final ErrorCode code;

    public ResourceNotFoundException(String message) {
        super(message);
        this.code = ErrorCode.RESOURCE_NOT_FOUND;
    }
}
