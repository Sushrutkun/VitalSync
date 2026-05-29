package com.vitalsync.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {

  @NotBlank(message = "accessToken is required")
  private String accessToken;
}
