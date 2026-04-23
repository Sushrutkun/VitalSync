package com.vitalsync.dto;

import java.time.Instant;
import java.util.List;

/**
 * Standard API response wrapper.
 */
public class ApiResponse {

    private boolean success;
    private String message;
    private int totalRecords;
    private int publishedRecords;
    private int failedRecords;
    private String timestamp;
    private List<String> errors;

    public ApiResponse() {
    }

    public ApiResponse(boolean success, String message, int totalRecords,
                       int publishedRecords, int failedRecords,
                       String timestamp, List<String> errors) {
        this.success = success;
        this.message = message;
        this.totalRecords = totalRecords;
        this.publishedRecords = publishedRecords;
        this.failedRecords = failedRecords;
        this.timestamp = timestamp;
        this.errors = errors;
    }

    // --- Static factory methods ---

    public static ApiResponse success(int totalRecords, int publishedRecords) {
        ApiResponse resp = new ApiResponse();
        resp.success = publishedRecords > 0;
        resp.message = publishedRecords == totalRecords
                ? "All records published to Kafka successfully"
                : publishedRecords + " of " + totalRecords + " records published successfully";
        resp.totalRecords = totalRecords;
        resp.publishedRecords = publishedRecords;
        resp.failedRecords = totalRecords - publishedRecords;
        resp.timestamp = Instant.now().toString();
        return resp;
    }

    public static ApiResponse failure(String message, List<String> errors) {
        ApiResponse resp = new ApiResponse();
        resp.success = false;
        resp.message = message;
        resp.totalRecords = 0;
        resp.publishedRecords = 0;
        resp.failedRecords = 0;
        resp.timestamp = Instant.now().toString();
        resp.errors = errors;
        return resp;
    }

    // --- Getters and setters ---

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }

    public int getPublishedRecords() { return publishedRecords; }
    public void setPublishedRecords(int publishedRecords) { this.publishedRecords = publishedRecords; }

    public int getFailedRecords() { return failedRecords; }
    public void setFailedRecords(int failedRecords) { this.failedRecords = failedRecords; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
