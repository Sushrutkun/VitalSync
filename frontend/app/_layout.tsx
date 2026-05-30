import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts as useGeist, Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from "@expo-google-fonts/geist";
import {
  useFonts as useSerif,
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from "@expo-google-fonts/instrument-serif";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Theme, useTheme, YStack } from "tamagui";

import { AuthProvider, useAuth } from "@/src/auth/AuthContext";
import { DebugOverlay } from "@/src/components/DebugOverlay";
import { AuroraBackground } from "@/src/components/ui";
import { queryClient } from "@/src/lib/queryClient";
import { ThemeProvider, useThemePref } from "@/src/theme/ThemeProvider";
import { brand } from "@/src/theme/tokens";

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
    <YStack flex={1} backgroundColor={resolved === "light" ? brand.light.background : brand.dark.background}>
      <AuroraBackground isLight={resolved === "light"} />
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
      <YStack flex={1} backgroundColor="transparent">
        <RootStack />
      </YStack>
      {__DEV__ ? <DebugOverlay /> : null}
    </YStack>
  );
}

export default function RootLayout() {
  const [geistLoaded] = useGeist({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });
  const [serifLoaded] = useSerif({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  if (!geistLoaded || !serifLoaded) {
    return <View style={{ flex: 1, backgroundColor: "#0B1426" }} />;
  }

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
