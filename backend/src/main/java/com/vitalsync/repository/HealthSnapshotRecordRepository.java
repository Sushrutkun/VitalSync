package com.vitalsync.repository;

import com.vitalsync.entity.HealthSnapshotRecord;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HealthSnapshotRecordRepository extends JpaRepository<HealthSnapshotRecord, UUID> {
  boolean existsByIdempotencyKey(String idempotencyKey);
  List<HealthSnapshotRecord> findByUserIdAndPeriodStartBetweenOrderByPeriodStartAsc(
      String userId, Instant from, Instant to);
}
