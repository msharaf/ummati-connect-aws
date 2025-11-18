import { useEffect } from "react";
import { BackHandler, Platform } from "react-native";

/**
 * Hook to handle Android hardware back button
 * @param onBackPress - Callback function when back button is pressed
 * @returns true to prevent default back behavior, false to allow it
 */
export function useBackHandler(onBackPress: () => boolean | null | undefined) {
  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      const result = onBackPress();
      // Return true to prevent default back behavior, false/null/undefined to allow it
      return result === true;
    });

    return () => backHandler.remove();
  }, [onBackPress]);
}

