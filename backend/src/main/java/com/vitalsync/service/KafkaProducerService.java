package com.vitalsync.service;

import com.vitalsync.dto.ApiResponse;
import com.vitalsync.dto.DataIngestionRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class KafkaProducerService {

    private static final Logger log = LoggerFactory.getLogger(KafkaProducerService.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${vitalsync.kafka.topic.name}")
    private String topicName;

    public KafkaProducerService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Publishes records from a DataIngestionRequest to the configured Kafka topic.
     * Each record is sent as an individual message keyed by user_id
     * (ensures all records for the same user land on the same partition).
     *
     * @param request the data ingestion request containing user_id, records, and cursor
     * @return ApiResponse with publish statistics
     */
    public ApiResponse publishData(DataIngestionRequest request) {
        String userId = request.getUserId();
        String cursor = request.getCursor();
        List<Object> records = request.getRecords();
        int totalRecords = records.size();

        List<CompletableFuture<SendResult<String, Object>>> futures = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        log.info("Publishing {} records for user [{}] with cursor [{}] to Kafka topic [{}]",
                totalRecords, userId, cursor, topicName);

        for (int i = 0; i < records.size(); i++) {
            Object data = records.get(i);

            try {
                // Use user_id as the message key for consistent partitioning
                CompletableFuture<SendResult<String, Object>> future =
                        kafkaTemplate.send(topicName, userId, data);

                final int index = i;
                future.whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish record [index={}, user={}]: {}",
                                index, userId, ex.getMessage());
                    } else {
                        log.debug("Record [index={}, user={}] published to partition [{}] at offset [{}]",
                                index, userId,
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });

                futures.add(future);
            } catch (Exception e) {
                log.error("Error sending record [index={}, user={}] to Kafka: {}",
                        i, userId, e.getMessage(), e);
                errors.add("Record " + i + ": " + e.getMessage());
            }
        }

        // Wait for all futures to complete
        int publishedCount = 0;
        for (int i = 0; i < futures.size(); i++) {
            try {
                futures.get(i).join();
                publishedCount++;
            } catch (Exception e) {
                log.error("Record [index={}, user={}] failed during send: {}",
                        i, userId, e.getMessage());
                errors.add("Record " + i + ": " + e.getMessage());
            }
        }

        log.info("Publish complete for user [{}]. Total={}, Published={}, Failed={}",
                userId, totalRecords, publishedCount, totalRecords - publishedCount);

        ApiResponse response = ApiResponse.success(totalRecords, publishedCount);
        if (!errors.isEmpty()) {
            response.setErrors(errors);
        }
        return response;
    }
}
