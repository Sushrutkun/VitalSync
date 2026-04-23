package com.vitalsync.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Request payload for the data ingestion API.
 *
 * Example:
 * {
 *   "user_id": "u1",
 *   "records": [ { "sensorId": "hr-001", "value": 72 } ],
 *   "cursor": "hc_token"
 * }
 */
public class DataIngestionRequest {

    @JsonProperty("user_id")
    private String userId;

    private List<Object> records;

    private String cursor;

    public DataIngestionRequest() {
    }

    public DataIngestionRequest(String userId, List<Object> records, String cursor) {
        this.userId = userId;
        this.records = records;
        this.cursor = cursor;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public List<Object> getRecords() { return records; }
    public void setRecords(List<Object> records) { this.records = records; }

    public String getCursor() { return cursor; }
    public void setCursor(String cursor) { this.cursor = cursor; }
}
