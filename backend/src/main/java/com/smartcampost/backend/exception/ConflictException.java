package com.smartcampost.backend.exception;

public class ConflictException extends RuntimeException {

    private final ErrorCode errorCode;

    // Ancien constructeur (pour compatibilité)
    public ConflictException(String message) {
        super(message);
        this.errorCode = ErrorCode.BUSINESS_ERROR; // valeur par défaut (tu peux changer)
    }

    // Nouveau constructeur avec ErrorCode
    public ConflictException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
