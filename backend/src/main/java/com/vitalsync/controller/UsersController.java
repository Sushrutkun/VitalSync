package com.vitalsync.controller;

import com.vitalsync.auth.exception.AuthErrorCode;
import com.vitalsync.auth.exception.AuthException;
import com.vitalsync.dto.UpdateProfileRequest;
import com.vitalsync.dto.UserProfileDto;
import com.vitalsync.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UsersController {

  private final UserProfileService userProfileService;

  @GetMapping("/me")
  public UserProfileDto me(Authentication authentication) {
    return userProfileService.getById(requireUserId(authentication));
  }

  @PatchMapping("/me")
  public UserProfileDto updateMe(
      @Valid @RequestBody UpdateProfileRequest req, Authentication authentication) {
    return userProfileService.update(requireUserId(authentication), req);
  }

  private static String requireUserId(Authentication authentication) {
    if (authentication == null || authentication.getName() == null) {
      throw new AuthException(AuthErrorCode.TOKEN_INVALID, "Authentication required");
    }
    return authentication.getName();
  }
}
