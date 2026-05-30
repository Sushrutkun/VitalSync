import { request } from "../lib/api";
import type { HealthSource } from "../types/api";
import type { BackfillStatusDto, ConnectResponse, SourcesListResponse } from "../sources/types";

export const sourcesApi = {
  list(): Promise<SourcesListResponse> {
    return request<SourcesListResponse>("/api/v1/sources", { method: "GET" });
  },
  connect(source: HealthSource): Promise<ConnectResponse> {
    return request<ConnectResponse>(`/api/v1/sources/${source}/connect`, {
      method: "POST",
    });
  },
  submitCredentials(source: HealthSource, credentials: Record<string, string>): Promise<void> {
    return request<void>(`/api/v1/sources/${source}/credentials`, {
      method: "POST",
      body: { credentials },
    });
  },
  disconnect(source: HealthSource): Promise<void> {
    return request<void>(`/api/v1/sources/${source}`, { method: "DELETE" });
  },
  startBackfill(source: HealthSource, phase: number): Promise<BackfillStatusDto> {
    return request<BackfillStatusDto>(`/api/v1/sources/${source}/backfill`, {
      method: "POST",
      query: { phase },
    });
  },
  backfillStatus(source: HealthSource, phase: number): Promise<BackfillStatusDto> {
    return request<BackfillStatusDto>(`/api/v1/sources/${source}/backfill/status`, {
      method: "GET",
      query: { phase },
    });
  },
};
