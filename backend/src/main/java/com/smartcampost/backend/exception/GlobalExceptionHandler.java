package com.smartcampost.backend.exception;

import com.smartcampost.backend.dto.error.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ================== AUTH EXCEPTIONS ==================
    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuthException(
            AuthException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (ex.getCode()) {
            case AUTH_INVALID_CREDENTIALS -> HttpStatus.UNAUTHORIZED;
            case AUTH_PHONE_EXISTS        -> HttpStatus.CONFLICT;
            case AUTH_USER_NOT_FOUND      -> HttpStatus.NOT_FOUND;
            case AUTH_ACCOUNT_LOCKED      -> HttpStatus.LOCKED;  // 423 Locked
            case AUTH_FORBIDDEN           -> HttpStatus.FORBIDDEN; // 403
            default -> HttpStatus.BAD_REQUEST;
        };

        return buildErrorResponse(ex.getMessage(), ex.getCode(), request, status);
    }

    // ================== OTP EXCEPTIONS ==================
    @ExceptionHandler(OtpException.class)
    public ResponseEntity<ErrorResponse> handleOtpException(
            OtpException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = switch (ex.getCode()) {
            case OTP_TOO_MANY_REQUESTS -> HttpStatus.TOO_MANY_REQUESTS;  // 429
            case OTP_INVALID, OTP_EXPIRED -> HttpStatus.BAD_REQUEST;
            default -> HttpStatus.BAD_REQUEST;
        };

        return buildErrorResponse(ex.getMessage(), ex.getCode(), request, status);
    }

    // ================== RESOURCE NOT FOUND ==================
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            ResourceNotFoundException ex,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                ex.getMessage(),
                ex.getErrorCode(),
                request,
                HttpStatus.NOT_FOUND
        );
    }

    // ================== CONFLICT ==================
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(
            ConflictException ex,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                ex.getMessage(),
                ex.getErrorCode(),
                request,
                HttpStatus.CONFLICT
        );
    }

    // ================== VALIDATION @Valid ==================
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + " " + err.getDefaultMessage())
                .orElse("Validation error");

        return buildErrorResponse(
                msg,
                ErrorCode.VALIDATION_ERROR,
                request,
                HttpStatus.BAD_REQUEST
        );
    }

    // ================== NO HANDLER FOUND (404) ==================
    @ExceptionHandler(org.springframework.web.servlet.NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoHandlerFound(
            org.springframework.web.servlet.NoHandlerFoundException ex,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                "Endpoint not found: " + request.getMethod() + " " + request.getRequestURI(),
                ErrorCode.BUSINESS_ERROR,
                request,
                HttpStatus.NOT_FOUND
        );
    }

    // ================== METHOD NOT ALLOWED (405) ==================
    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotAllowed(
            org.springframework.web.HttpRequestMethodNotSupportedException ex,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                "Method not allowed: " + request.getMethod() + " " + request.getRequestURI(),
                ErrorCode.BUSINESS_ERROR,
                request,
                HttpStatus.METHOD_NOT_ALLOWED
        );
    }

    // ================== NO RESOURCE FOUND (404 for static resources) ==================
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(
            org.springframework.web.servlet.resource.NoResourceFoundException ex,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                "Resource not found: " + request.getRequestURI(),
                ErrorCode.BUSINESS_ERROR,
                request,
                HttpStatus.NOT_FOUND
        );
    }

    // ================== DATA INTEGRITY (duplicate keys, constraint violations) ==================
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(
            org.springframework.dao.DataIntegrityViolationException ex,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                "A data conflict occurred. The resource may already exist.",
                ErrorCode.BUSINESS_ERROR,
                request,
                HttpStatus.CONFLICT
        );
    }

    // ================== RUNTIME (Biz errors) ==================
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(
            RuntimeException ex,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                ex.getMessage(),
                ErrorCode.BUSINESS_ERROR,
                request,
                HttpStatus.BAD_REQUEST
        );
    }

    // ================== CATCH-ALL (500) ==================
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(
            Exception ex,
            HttpServletRequest request
    ) {
        ex.printStackTrace(); // log serveur

        return buildErrorResponse(
                "An unexpected error occurred",
                ErrorCode.BUSINESS_ERROR,
                request,
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    // ================== GENERIC BUILDER ==================
    private ResponseEntity<ErrorResponse> buildErrorResponse(
            String message,
            ErrorCode code,
            HttpServletRequest request,
            HttpStatus status
    ) {
        ErrorResponse body = ErrorResponse.builder()
                .timestamp(Instant.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .code(code.name())
                .message(message)
                .path(request.getRequestURI())
                .build();

        return ResponseEntity.status(status).body(body);
    }
}
