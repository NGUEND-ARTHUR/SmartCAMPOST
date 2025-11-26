package com.smartcampost.backend.exception;

public class ResourceNotFoundException extends RuntimeException {

    private final ErrorCode errorCode;

    // Ancien constructeur (pour compatibilité)
    public ResourceNotFoundException(String message) {
        super(message);
        this.errorCode = ErrorCode.USER_NOT_FOUND; // ou une valeur par défaut
    }

    // Nouveau constructeur avec ErrorCode
    public ResourceNotFoundException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
