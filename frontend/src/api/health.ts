import { request } from "../lib/api";
import type {
  DailySummary,
  HealthSyncRequest,
  HealthSyncResponse,
  HistoryQuery,
  HistoryResponse,
} from "../types/api";

export const healthApi = {
  sync(payload: HealthSyncRequest): Promise<HealthSyncResponse> {
    return request<HealthSyncResponse>("/api/v1/health/sync", {
      method: "POST",
      body: payload,
    });
  },
  summary(date?: string): Promise<DailySummary> {
    return request<DailySummary>("/api/v1/health/summary", {
      method: "GET",
      query: { date },
    });
  },
  history(q: HistoryQuery): Promise<HistoryResponse> {
    return request<HistoryResponse>("/api/v1/health/history", {
      method: "GET",
      query: {
        from: q.from,
        to: q.to,
        types: q.types,
        limit: q.limit,
        cursor: q.cursor,
      },
    });
  },
};
