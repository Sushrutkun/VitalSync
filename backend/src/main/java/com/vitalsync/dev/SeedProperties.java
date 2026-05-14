package com.vitalsync.dev;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("seed-kafka")
@ConfigurationProperties(prefix = "vitalsync.seed")
@Getter
@Setter
public class SeedProperties {
  private int count = 100_000;
  private int users = 500;
  private int daysBack = 30;
  private int logEvery = 5_000;
}
