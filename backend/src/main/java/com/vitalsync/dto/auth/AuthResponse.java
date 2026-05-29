package com.vitalsync.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
  String accessToken;
  String refreshToken;
  long expiresIn;
  AuthUserDto user;
}
