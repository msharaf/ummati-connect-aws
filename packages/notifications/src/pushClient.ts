import { Expo } from "expo-server-sdk";

const expo = new Expo();

export async function sendPush(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.warn("[PUSH] Invalid Expo push token:", pushToken);
    return;
  }

  try {
    await expo.sendPushNotificationsAsync([
      {
        to: pushToken,
        sound: "default",
        title,
        body,
        data: data || {}
      }
    ]);
  } catch (error) {
    console.error("[PUSH] Failed to send push notification:", error);
    throw error;
  }
}

