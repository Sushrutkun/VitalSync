package com.vitalsync.dto.sources;

import jakarta.validation.constraints.NotNull;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Body for {@code POST /sources/{source}/credentials}. Used for sources that don't speak OAuth
 * (currently WHOOP). Keys depend on the source — e.g. WHOOP needs {email, password}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CredentialSubmitRequest {
  @NotNull Map<String, String> credentials;
}
