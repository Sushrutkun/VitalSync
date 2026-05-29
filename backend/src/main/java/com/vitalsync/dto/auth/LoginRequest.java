package com.vitalsync.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
  @Email
  @NotBlank
  @Size(max = 254)
  String email;

  @NotBlank
  @Size(min = 8, max = 128)
  String password;
}
