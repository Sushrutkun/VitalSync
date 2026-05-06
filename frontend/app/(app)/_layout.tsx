import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { useTheme } from "tamagui";

import { useForegroundSync } from "@/src/health/foregroundLoop";
import { registerBackgroundSync } from "@/src/health/background";

export default function AppLayout() {
  useForegroundSync(true);
  const theme = useTheme();

  useEffect(() => {
    void registerBackgroundSync();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent?.val,
        tabBarInactiveTintColor: theme.muted?.val,
        tabBarStyle: {
          backgroundColor: theme.card?.val,
          borderTopColor: theme.borderColor?.val,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => <Ionicons name="pulse" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
