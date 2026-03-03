import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useEffect } from "react";
import { trpc } from "../src/lib/trpc";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
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

        // Get project ID from EAS config
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        // In development without EAS, push tokens may not work
        if (!projectId) {
          // Only log in non-dev mode to reduce noise during development
          if (__DEV__) {
            // Silently skip push notifications in dev mode - this is expected
          } else {
            console.log("[PUSH] No projectId found - push notifications disabled");
          }
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId
        });

        if (tokenData.data) {
          saveToken.mutate({ token: tokenData.data });
        }
      } catch (error) {
        // Gracefully handle push token errors in development
        console.log("[PUSH] Push notifications not available:", error);
      }
    }

    register();
  }, [saveToken]);
}

