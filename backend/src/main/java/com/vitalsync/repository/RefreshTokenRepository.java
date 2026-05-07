package com.vitalsync.repository;

import com.vitalsync.entity.RefreshToken;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
  List<RefreshToken> findAllByUserId(String userId);

  void deleteAllByUserId(String userId);
}
