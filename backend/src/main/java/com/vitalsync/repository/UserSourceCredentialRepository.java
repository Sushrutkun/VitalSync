package com.vitalsync.repository;

import com.vitalsync.entity.HealthSource;
import com.vitalsync.entity.UserSourceCredential;
import com.vitalsync.entity.UserSourceCredential.Status;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSourceCredentialRepository extends JpaRepository<UserSourceCredential, UUID> {

  Optional<UserSourceCredential> findByUserIdAndSource(String userId, HealthSource source);

  List<UserSourceCredential> findAllByUserId(String userId);

  List<UserSourceCredential> findAllByStatusAndSourceIn(Status status, List<HealthSource> sources);
}
