import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { syncLastMinute } from "./sync";

const FOREGROUND_INTERVAL_MS = 60_000;

export function useForegroundSync(enabled: boolean): void {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        await syncLastMinute();
      } finally {
        inFlight.current = false;
      }
    };

    const start = () => {
      if (timer.current) return;
      void tick();
      timer.current = setInterval(() => {
        void tick();
      }, FOREGROUND_INTERVAL_MS);
    };

    const stop = () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };

    const onAppStateChange = (state: AppStateStatus) => {
      if (state === "active") start();
      else stop();
    };

    if (AppState.currentState === "active") start();
    const sub = AppState.addEventListener("change", onAppStateChange);

    return () => {
      stop();
      sub.remove();
    };
  }, [enabled]);
}
