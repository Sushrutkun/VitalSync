import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { useForegroundSync } from "@/src/health/foregroundLoop";
import { registerBackgroundSync } from "@/src/health/background";
import { brand } from "@/src/theme/tokens";

type IconName = keyof typeof Ionicons.glyphMap;

type TabDef = { name: string; title: string; icon: IconName; iconActive: IconName };

const TABS: TabDef[] = [
  { name: "index", title: "Today", icon: "pulse-outline", iconActive: "pulse" },
  { name: "history", title: "History", icon: "calendar-outline", iconActive: "calendar" },
  { name: "profile", title: "Profile", icon: "person-outline", iconActive: "person" },
];

export default function AppLayout() {
  useForegroundSync(true);

  useEffect(() => {
    void registerBackgroundSync();
  }, []);

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}
      tabBar={(props: any) => <FloatingTabBar {...props} />}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title }} />
      ))}
    </Tabs>
  );
}

type TabBarProps = {
  state: { index: number; routes: { name: string; key: string }[] };
  navigation: any;
};

function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);

  return (
    <View
      style={{
        position: "absolute",
        left: 20,
        right: 20,
        bottom,
        alignItems: "center",
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          borderRadius: 999,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <MaybeBlur>
          <XStack
            paddingHorizontal={8}
            paddingVertical={8}
            gap={4}
            backgroundColor="rgba(11,20,38,0.55)"
          >
            {state.routes.map((route, idx) => {
              const def = TABS.find((t) => t.name === route.name);
              if (!def) return null;
              const isActive = state.index === idx;
              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isActive && !event.defaultPrevented) navigation.navigate(route.name);
              };
              return (
                <Pressable key={route.key} onPress={onPress} hitSlop={8}>
                  <YStack
                    paddingHorizontal={18}
                    paddingVertical={10}
                    borderRadius={999}
                    alignItems="center"
                    justifyContent="center"
                    backgroundColor={isActive ? "rgba(124,247,176,0.16)" : "transparent"}
                  >
                    <XStack alignItems="center" gap={8}>
                      <Ionicons
                        name={isActive ? def.iconActive : def.icon}
                        size={18}
                        color={isActive ? brand.accent : brand.dark.muted}
                      />
                      {isActive ? (
                        <Text
                          fontFamily="$body"
                          fontSize={11}
                          fontWeight="600"
                          letterSpacing={1.5}
                          color={brand.accent as any}
                          style={{ textTransform: "uppercase" }}
                        >
                          {def.title}
                        </Text>
                      ) : null}
                    </XStack>
                  </YStack>
                </Pressable>
              );
            })}
          </XStack>
        </MaybeBlur>
      </View>
    </View>
  );
}

function MaybeBlur({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") return <>{children}</>;
  return (
    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject}>
      {children}
    </BlurView>
  );
}
