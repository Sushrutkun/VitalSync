import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Theme, useTheme, YStack } from "tamagui";

import { AuthProvider, useAuth } from "@/src/auth/AuthContext";
import { queryClient } from "@/src/lib/queryClient";
import { ThemeProvider, useThemePref } from "@/src/theme/ThemeProvider";

void SplashScreen.preventAutoHideAsync();

function LoadingScreen() {
  const theme = useTheme();
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
      <ActivityIndicator color={theme.accent?.val} />
    </YStack>
  );
}

function RootStack() {
  const { isReady, userId } = useAuth();

  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return <LoadingScreen />;

  const isAuthenticated = userId !== null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

function ThemedShell() {
  const { resolved } = useThemePref();
  return (
    <Theme name={resolved}>
      <YStack flex={1} backgroundColor="$background">
        <StatusBar style={resolved === "dark" ? "light" : "dark"} />
        <RootStack />
      </YStack>
    </Theme>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ThemedShell />
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
