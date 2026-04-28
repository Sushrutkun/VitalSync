package com.vitalsync.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

  @Value("${vitalsync.kafka.topic.name}")
  private String topicName;

  @Value("${vitalsync.kafka.topic.partitions}")
  private int partitions;

  @Value("${vitalsync.kafka.topic.replication-factor}")
  private int replicationFactor;

  /** Auto-creates the Kafka topic on startup if it doesn't already exist. */
  @Bean
  public NewTopic vitalSyncDataTopic() {
    return TopicBuilder.name(topicName).partitions(partitions).replicas(replicationFactor).build();
  }
}
