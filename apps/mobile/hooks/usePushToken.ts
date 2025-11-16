import * as Notifications from "expo-notifications";
import * as Constants from "expo-constants";
import { useEffect } from "react";
import { trpc } from "../src/lib/trpc";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

export function usePushToken() {
  const saveToken = trpc.notifications.savePushToken.useMutation();

  useEffect(() => {
    async function register() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.log("[PUSH] Permission not granted");
          return;
        }

        // Get project ID from EAS config or use undefined (Expo will handle it)
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || undefined;

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId
        });

        if (tokenData.data) {
          saveToken.mutate({ token: tokenData.data });
        }
      } catch (error) {
        console.error("[PUSH] Failed to register push token:", error);
      }
    }

    register();
  }, [saveToken]);
}

