package com.vitalsync.exception;

import com.vitalsync.dto.HealthSyncResponse;
import com.vitalsync.service.HealthSnapshotPublisher.KafkaPublishException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<HealthSyncResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .toList();
        log.warn("Validation failed: {}", errors);
        return ResponseEntity.badRequest()
                .body(HealthSyncResponse.failure("Request validation failed", errors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<HealthSyncResponse> handleUnreadable(HttpMessageNotReadableException ex) {
        log.warn("Malformed request body: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(HealthSyncResponse.failure(
                        "Malformed JSON request body",
                        List.of(ex.getMostSpecificCause().getMessage())));
    }

    @ExceptionHandler(KafkaPublishException.class)
    public ResponseEntity<HealthSyncResponse> handleKafka(KafkaPublishException ex) {
        log.error("Kafka publish failed", ex);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(HealthSyncResponse.failure(
                        "Failed to enqueue snapshot for processing",
                        List.of(ex.getMessage())));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<HealthSyncResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(HealthSyncResponse.failure(
                        "An unexpected error occurred",
                        List.of(ex.getMessage())));
    }
}
