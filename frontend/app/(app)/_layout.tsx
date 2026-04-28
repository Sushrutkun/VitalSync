import { Tabs } from "expo-router";
import { useEffect } from "react";

import { useForegroundSync } from "@/src/health/foregroundLoop";
import { registerBackgroundSync } from "@/src/health/background";

export default function AppLayout() {
  useForegroundSync(true);

  useEffect(() => {
    void registerBackgroundSync();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0a7",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
