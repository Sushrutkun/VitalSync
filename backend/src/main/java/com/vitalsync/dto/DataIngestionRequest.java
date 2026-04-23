package com.vitalsync.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DataIngestionRequest {

    @JsonProperty("user_id")
    private String userId;

    private List<Object> records;

    private String cursor;
}
