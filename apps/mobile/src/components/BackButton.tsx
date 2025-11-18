import { TouchableOpacity, View, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBackHandler } from "../hooks/useBackHandler";

interface BackButtonProps {
  /** Custom fallback route if no history exists (default: "/(tabs)/swipe") */
  fallbackRoute?: string;
  /** Custom icon color (default: "#047857" - emerald-600) */
  iconColor?: string;
  /** Custom size (default: 24) */
  iconSize?: number;
  /** Additional className for container */
  className?: string;
}

/**
 * Reusable BackButton component for mobile app
 * Handles navigation backward with safe fallback
 * Automatically handles Android hardware back button
 */
export function BackButton({
  fallbackRoute = "/(tabs)/swipe",
  iconColor = "#047857",
  iconSize = 24,
  className = ""
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Try to go back, if no history, navigate to fallback
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute as any);
    }
  };

  // Handle Android hardware back button
  useBackHandler(() => {
    handleBack();
    return true; // Prevent default back behavior
  });

  return (
    <TouchableOpacity
      onPress={handleBack}
      activeOpacity={0.7}
      className={`flex-row items-center ${className}`}
    >
      <Ionicons name="arrow-back" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

