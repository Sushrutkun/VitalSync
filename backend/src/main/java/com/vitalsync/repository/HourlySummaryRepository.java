package com.vitalsync.repository;

import com.vitalsync.entity.HourlySummary;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HourlySummaryRepository extends JpaRepository<HourlySummary, UUID> {

  Optional<HourlySummary> findByUserIdAndHourBucket(String userId, Instant hourBucket);

  List<HourlySummary> findByUserIdAndHourBucketBetweenOrderByHourBucketAsc(
      String userId, Instant from, Instant to);
}
