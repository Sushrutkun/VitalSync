package com.vitalsync.service;

import com.vitalsync.dto.HealthSyncRequest;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

/**
 * Publishes health snapshots to Kafka.
 *
 * <p>One sync request produces exactly one Kafka message: - key: userId (guarantees per-user
 * ordering on a single partition) - value: the {@link HealthSyncRequest} payload - header
 * "idempotency-key": carried through so consumers can dedupe retries
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class HealthSnapshotPublisher {

  private static final String IDEMPOTENCY_KEY_HEADER = "idempotency-key";

  private final KafkaTemplate<String, Object> kafkaTemplate;

  @Value("${vitalsync.kafka.topic.name}")
  private String topicName;

  /**
   * Publishes a snapshot synchronously and returns once the broker has acked it.
   *
   * @throws KafkaPublishException if the send fails
   */
  public void publish(HealthSyncRequest request) {
    ProducerRecord<String, Object> record =
        new ProducerRecord<>(topicName, null, request.userId(), request);
    record
        .headers()
        .add(
            new RecordHeader(
                IDEMPOTENCY_KEY_HEADER, request.idempotencyKey().getBytes(StandardCharsets.UTF_8)));

    try {
      SendResult<String, Object> result = kafkaTemplate.send(record).get();
      log.info(
          "Published snapshot user=[{}] idempotencyKey=[{}] partition=[{}] offset=[{}]",
          request.userId(),
          request.idempotencyKey(),
          result.getRecordMetadata().partition(),
          result.getRecordMetadata().offset());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new KafkaPublishException("Interrupted while publishing snapshot", e);
    } catch (Exception e) {
      throw new KafkaPublishException("Failed to publish snapshot for user " + request.userId(), e);
    }
  }

  public static class KafkaPublishException extends RuntimeException {
    public KafkaPublishException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
