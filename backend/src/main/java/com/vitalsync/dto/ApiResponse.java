package com.vitalsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Standard API response wrapper.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {

    private boolean success;
    private String message;
    private int totalRecords;
    private int publishedRecords;
    private int failedRecords;
    private String timestamp;
    private List<String> errors;

    // --- Static factory methods ---

    public static ApiResponse success(int totalRecords, int publishedRecords) {
        return ApiResponse.builder()
                .success(publishedRecords > 0)
                .message(publishedRecords == totalRecords
                        ? "All records published to Kafka successfully"
                        : publishedRecords + " of " + totalRecords + " records published successfully")
                .totalRecords(totalRecords)
                .publishedRecords(publishedRecords)
                .failedRecords(totalRecords - publishedRecords)
                .timestamp(Instant.now().toString())
                .build();
    }

    public static ApiResponse failure(String message, List<String> errors) {
        return ApiResponse.builder()
                .success(false)
                .message(message)
                .totalRecords(0)
                .publishedRecords(0)
                .failedRecords(0)
                .timestamp(Instant.now().toString())
                .errors(errors)
                .build();
    }
}
