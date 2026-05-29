package com.vitalsync.repository;

import com.vitalsync.entity.DailySummary;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DailySummaryRepository extends JpaRepository<DailySummary, UUID> {
  Optional<DailySummary> findByUserIdAndDate(String userId, LocalDate date);
}
