package com.vitalsync.auth.repository;

import com.vitalsync.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    List<RefreshToken> findAllByUserId(String userId);

    @Transactional
    void deleteAllByUserId(String userId);
}
