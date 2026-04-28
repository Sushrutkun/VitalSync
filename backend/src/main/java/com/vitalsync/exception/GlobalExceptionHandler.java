package com.vitalsync.exception;

import com.vitalsync.auth.exception.AuthErrorCode;
import com.vitalsync.auth.exception.AuthException;
import com.vitalsync.service.HealthSnapshotPublisher.KafkaPublishException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Renders all errors using the API.md §3 envelope:
 *   { "error": { "code": "...", "message": "...", "details": {} } }
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    public record ApiErrorResponse(ErrorBody error) {}
    public record ErrorBody(String code, String message, Map<String, Object> details) {}

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
                fieldErrors.put(err.getField(), err.getDefaultMessage()));
        log.warn("Validation failed: {}", fieldErrors);
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed", fieldErrors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadable(HttpMessageNotReadableException ex) {
        log.warn("Malformed request body: {}", ex.getMessage());
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Malformed JSON request body", Map.of());
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ApiErrorResponse> handleAuth(AuthException ex) {
        AuthErrorCode code = ex.code();
        if (code.status().is5xxServerError()) {
            log.error("Auth error", ex);
        } else {
            log.warn("Auth error: code={} message={}", code, ex.getMessage());
        }
        return error(code.status(), code.name(), ex.getMessage(), Map.of());
    }

    @ExceptionHandler(KafkaPublishException.class)
    public ResponseEntity<ApiErrorResponse> handleKafka(KafkaPublishException ex) {
        log.error("Kafka publish failed", ex);
        return error(HttpStatus.SERVICE_UNAVAILABLE, "INTERNAL_ERROR",
                "Failed to enqueue snapshot for processing", Map.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "An unexpected error occurred", Map.of());
    }

    private ResponseEntity<ApiErrorResponse> error(HttpStatus status, String code, String message,
                                                   Map<String, Object> details) {
        return ResponseEntity.status(status)
                .body(new ApiErrorResponse(new ErrorBody(code, message, details)));
    }
}
