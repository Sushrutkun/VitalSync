package com.vitalsync.service;

import com.vitalsync.dto.user.UpdateProfileRequest;
import com.vitalsync.dto.user.UserProfileDto;
import com.vitalsync.entity.User;
import com.vitalsync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserProfileService {

  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public UserProfileDto getById(String userId) {
    return userRepository
        .findById(userId)
        .map(UserProfileService::toDto)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
  }

  @Transactional
  public UserProfileDto update(String userId, UpdateProfileRequest patch) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (patch.getName() != null) user.setName(patch.getName());
    if (patch.getDateOfBirth() != null) user.setDateOfBirth(patch.getDateOfBirth());
    if (patch.getHeightCm() != null) user.setHeightCm(patch.getHeightCm());
    if (patch.getWeightKg() != null) user.setWeightKg(patch.getWeightKg());

    User saved = userRepository.save(user);
    return toDto(saved);
  }

  private static UserProfileDto toDto(User u) {
    return new UserProfileDto(
        u.getId(),
        u.getEmail(),
        u.getName(),
        u.getDateOfBirth(),
        u.getHeightCm(),
        u.getWeightKg(),
        u.getCreatedAt());
  }
}
