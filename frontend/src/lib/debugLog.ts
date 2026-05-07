export type DebugEntryKind = "api" | "auth" | "health" | "info" | "error";

export type DebugEntry = {
  id: string;
  ts: number;
  kind: DebugEntryKind;
  title: string;
  detail?: string;
  status?: number;
  durationMs?: number;
};

const MAX_ENTRIES = 100;
let entries: DebugEntry[] = [];
const listeners = new Set<(entries: DebugEntry[]) => void>();
let counter = 0;

function notify(): void {
  for (const l of listeners) l(entries);
}

export const debugLog = {
  add(kind: DebugEntryKind, title: string, detail?: string, status?: number, durationMs?: number): void {
    const entry: DebugEntry = {
      id: `${Date.now()}-${counter++}`,
      ts: Date.now(),
      kind,
      title,
      detail,
      status,
      durationMs,
    };
    entries = [entry, ...entries].slice(0, MAX_ENTRIES);
    notify();
  },
  clear(): void {
    entries = [];
    notify();
  },
  getAll(): DebugEntry[] {
    return entries;
  },
  subscribe(listener: (entries: DebugEntry[]) => void): () => void {
    listeners.add(listener);
    listener(entries);
    return () => listeners.delete(listener);
  },
};
