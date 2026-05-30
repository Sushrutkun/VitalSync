package com.vitalsync.dto.sources;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response from {@code POST /sources/{source}/connect}.
 *
 * <p>Tells the client which connection flow to drive:
 * <ul>
 *   <li>{@code OAUTH} — open {@link #authorizeUrl} in an in-app browser
 *   <li>{@code CREDENTIALS} — render a form for {@link #fields} and POST to {@code /credentials}
 *   <li>{@code DEVICE_LOCAL} — show {@link #instructions}; nothing else to do on backend
 * </ul>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConnectResponse {

  public enum Flow {
    OAUTH,
    CREDENTIALS,
    DEVICE_LOCAL
  }

  private Flow flow;
  private String authorizeUrl;
  private String state;
  private List<String> fields;
  private String instructions;
}
