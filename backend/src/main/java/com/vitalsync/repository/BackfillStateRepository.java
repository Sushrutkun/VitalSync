package com.vitalsync.repository;

import com.vitalsync.entity.BackfillState;
import com.vitalsync.entity.BackfillState.PhaseStatus;
import com.vitalsync.entity.HealthSource;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BackfillStateRepository extends JpaRepository<BackfillState, UUID> {

  Optional<BackfillState> findByUserIdAndSourceAndPhase(
      String userId, HealthSource source, Integer phase);

  List<BackfillState> findAllByUserIdAndSource(String userId, HealthSource source);

  List<BackfillState> findAllByPhaseStatus(PhaseStatus phaseStatus);
}
