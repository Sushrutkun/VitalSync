import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { Body, Card, Heading } from "@/src/components/ui";
import {
  getHealthConnectStatus,
  hasHealthPermissions,
  openHealthConnectAppSettings,
} from "@/src/health/permissions";
import { brand } from "@/src/theme/tokens";

type DeviceStatus = "connected" | "no-permission" | "unavailable" | "loading";

type DeviceInfo = {
  name: string;
  type: "health-connect";
  status: DeviceStatus;
  lastSyncLabel: string;
  permissionsGranted: number;
  totalPermissions: number;
};

export default function DevicesScreen() {
  const router = useRouter();
  const [device, setDevice] = useState<DeviceInfo>({
    name: "Health Connect",
    type: "health-connect",
    status: "loading",
    lastSyncLabel: "Checking…",
    permissionsGranted: 0,
    totalPermissions: 8,
  });

  useEffect(() => {
    void (async () => {
      const hcStatus = await getHealthConnectStatus();
      if (hcStatus !== "available") {
        setDevice((d) => ({
          ...d,
          status: "unavailable",
          lastSyncLabel: hcStatus === "provider-update-required" ? "Update required" : "Not available",
        }));
        return;
      }
      const granted = await hasHealthPermissions();
      setDevice((d) => ({
        ...d,
        status: granted ? "connected" : "no-permission",
        lastSyncLabel: granted ? "Just now" : "No permissions",
        permissionsGranted: granted ? 8 : 0,
      }));
    })();
  }, []);

  const statusColor =
    device.status === "connected"
      ? "#4ADE80"
      : device.status === "loading"
        ? brand.dark.muted
        : brand.strain;

  const statusLabel =
    device.status === "connected"
      ? "Connected"
      : device.status === "no-permission"
        ? "No Permission"
        : device.status === "unavailable"
          ? "Unavailable"
          : "Checking…";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{ padding: 24, paddingBottom: 140, gap: 24 }}
      >
        <XStack alignItems="center" gap={12}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
            <Ionicons name="chevron-back" size={22} color={brand.dark.muted} />
          </Pressable>
          <Heading level={2}>Devices</Heading>
        </XStack>

        <Body tone="muted" size="sm">
          Connected health sources and their sync status.
        </Body>

        <Animated.View entering={FadeInDown.duration(400)}>
          <Card padding={20} gap={16}>
            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" gap={12}>
                <YStack
                  width={44}
                  height={44}
                  borderRadius={12}
                  backgroundColor="rgba(255,255,255,0.06)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons name="heart-circle-outline" size={24} color={brand.coral} />
                </YStack>
                <YStack gap={2}>
                  <Body weight="semibold">{device.name}</Body>
                  <XStack alignItems="center" gap={5}>
                    <YStack
                      width={7}
                      height={7}
                      borderRadius={4}
                      backgroundColor={statusColor as any}
                    />
                    <Body tone="muted" size="xs">
                      {statusLabel}
                    </Body>
                  </XStack>
                </YStack>
              </XStack>
              <Ionicons name="phone-portrait-outline" size={18} color={brand.dark.muted} />
            </XStack>

            <YStack gap={8}>
              <XStack justifyContent="space-between">
                <Body tone="muted" size="sm">
                  Last sync
                </Body>
                <Text fontFamily="$heading" fontSize={14}>
                  {device.lastSyncLabel}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Body tone="muted" size="sm">
                  Permissions
                </Body>
                <Text fontFamily="$heading" fontSize={14}>
                  {device.status === "connected"
                    ? `${device.permissionsGranted}/${device.totalPermissions} granted`
                    : "—"}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Body tone="muted" size="sm">
                  Data types
                </Body>
                <Body size="sm" weight="medium">
                  Steps · HR · SpO₂ · Sleep · Calories · Distance · HR Zones · Sessions
                </Body>
              </XStack>
            </YStack>

            {device.status === "no-permission" ? (
              <Pressable
                onPress={openHealthConnectAppSettings}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <XStack
                  backgroundColor={`${brand.accent}22`}
                  borderRadius={12}
                  paddingHorizontal={16}
                  paddingVertical={12}
                  alignItems="center"
                  justifyContent="center"
                  gap={8}
                  borderWidth={1}
                  borderColor={`${brand.accent}44`}
                >
                  <Ionicons name="settings-outline" size={15} color={brand.accent} />
                  <Body size="sm" weight="semibold" style={{ color: brand.accent }}>
                    Open Health Connect Settings
                  </Body>
                </XStack>
              </Pressable>
            ) : null}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <Card padding={20} gap={12}>
            <XStack alignItems="center" gap={10}>
              <Ionicons name="add-circle-outline" size={20} color={brand.dark.muted} />
              <Body tone="muted">More devices coming soon</Body>
            </XStack>
            <Body tone="muted" size="sm">
              Wearables like Whoop, Garmin, Apple Watch, and Fitbit can be connected once device-specific integrations are added.
            </Body>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
