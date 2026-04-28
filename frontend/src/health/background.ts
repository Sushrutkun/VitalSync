import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

import { syncLastMinute } from "./sync";

export const BACKGROUND_SYNC_TASK = "vitalsync.background-sync";

// Android's WorkManager won't run more frequently than ~15 minutes — so per-minute
// background snapshots are not possible without a foreground service. While the app
// is in foreground, src/health/foregroundLoop.ts runs a 1-min interval; in the
// background, this task fires at the OS-throttled minimum.
const MIN_INTERVAL_MINUTES = 15;

if (!TaskManager.isTaskDefined(BACKGROUND_SYNC_TASK)) {
  TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
      const result = await syncLastMinute();
      return result.ok
        ? BackgroundTask.BackgroundTaskResult.Success
        : BackgroundTask.BackgroundTaskResult.Failed;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerBackgroundSync(): Promise<void> {
  const status = await BackgroundTask.getStatusAsync();
  if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return;
  await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: MIN_INTERVAL_MINUTES,
  });
}

export async function unregisterBackgroundSync(): Promise<void> {
  if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK)) {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  }
}
