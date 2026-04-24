import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import { HealthRepository } from './src/health/HealthRepository';
import { HealthSyncService } from './src/health/HealthSyncService';
import { BackgroundSyncTask, headlessHealthSync } from './src/health/BackgroundSyncTask';
import { AuthService } from './src/auth/AuthService';

// Register headless task for when app is fully killed
BackgroundFetch.registerHeadlessTask(headlessHealthSync);

export default function App() {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Wire up navigation callback — replace with your navigation ref
    AuthService.setSessionExpiredCallback(() => {
      // navigation.reset({ routes: [{ name: 'Login' }] });
      console.warn('[Auth] Session expired — navigate to login');
    });

    async function onAppStart() {
      const available = await HealthRepository.initialize();
      if (available) {
        await HealthRepository.requestPermissions();
        await HealthSyncService.catchUpSync();
        HealthSyncService.start();
      }
    }

    onAppStart();
    BackgroundSyncTask.configure();

    const subscription = AppState.addEventListener(
      'change',
      async (nextState: AppStateStatus) => {
        const prev = appState.current;
        appState.current = nextState;

        if (nextState === 'active' && prev !== 'active') {
          // App returned to foreground
          await HealthSyncService.catchUpSync();
          HealthSyncService.start();
        } else if (nextState !== 'active' && prev === 'active') {
          // App moved to background
          HealthSyncService.stop();
        }
      },
    );

    return () => {
      subscription.remove();
      HealthSyncService.stop();
    };
  }, []);

  // Replace with your actual navigator / screens
  return null;
}
