import type { HealthSource } from "../types/api";

export type SourceStatus =
  | "NOT_CONNECTED"
  | "CONNECTED"
  | "EXPIRED"
  | "REVOKED"
  | "ERROR";

export type ConnectFlow = "OAUTH" | "CREDENTIALS" | "DEVICE_LOCAL";

export type SourceStatusDto = {
  source: HealthSource;
  status: SourceStatus;
  connectedAt: string | null;
  lastPolledAt: string | null;
  supportsBackfill: boolean;
  lastError: string | null;
  cloudPolled: boolean;
};

export type SourcesListResponse = {
  sources: SourceStatusDto[];
};

export type ConnectResponse = {
  flow: ConnectFlow;
  authorizeUrl?: string;
  state?: string;
  fields?: string[];
  instructions?: string;
};
