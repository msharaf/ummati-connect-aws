import { Stack } from "expo-router";
import { LogoutButton } from "../../src/components/LogoutButton";

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerRight: () => <LogoutButton />,
        headerTitle: "",
        presentation: "modal"
      }}
    >
      <Stack.Screen name="visionary/[id]" />
    </Stack>
  );
}

