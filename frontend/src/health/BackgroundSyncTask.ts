import BackgroundFetch from 'react-native-background-fetch';
import { HealthSyncService } from './HealthSyncService';

const TASK_ID = 'com.vitalsync.healthsync';

export const BackgroundSyncTask = {
  configure(): void {
    BackgroundFetch.configure(
      {
        minimumFetchInterval: 15,    // minutes — Android OS minimum
        stopOnTerminate: false,      // keep running when app is killed
        startOnBoot: true,           // re-register after reboot
        enableHeadless: true,        // run even when app is fully terminated
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
      },
      async (taskId) => {
        try {
          await HealthSyncService.catchUpSync();
        } finally {
          // Must call finish() or the OS will penalise the app
          BackgroundFetch.finish(taskId);
        }
      },
      (taskId) => {
        // OS timeout — finish immediately
        BackgroundFetch.finish(taskId);
      },
    );
  },
};

// Headless task — runs when app is fully killed on Android
// Registered in index.js via BackgroundFetch.registerHeadlessTask()
export async function headlessHealthSync(event: { taskId: string }): Promise<void> {
  try {
    await HealthSyncService.catchUpSync();
  } finally {
    BackgroundFetch.finish(event.taskId);
  }
}
