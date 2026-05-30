package com.vitalsync.dto.sources;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SourcesListResponse {
  private List<SourceStatusDto> sources;
}
