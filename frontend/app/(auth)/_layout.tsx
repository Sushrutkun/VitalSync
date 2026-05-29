import { Stack } from "expo-router";
import { Theme } from "tamagui";
import { View } from "react-native";
import { brand } from "@/src/theme/tokens";

export default function AuthLayout() {
  return (
    <Theme name="dark">
      <View style={{ flex: 1, backgroundColor: brand.dark.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: brand.dark.background },
          }}
        />
      </View>
    </Theme>
  );
}
