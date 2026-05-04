package com.vitalsync.auth.repository;

import com.vitalsync.auth.entity.RefreshToken;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
  List<RefreshToken> findAllByUserId(String userId);

  void deleteAllByUserId(String userId);
}
