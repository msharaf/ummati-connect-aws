import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity, Text } from "react-native";
import { trpc } from "../lib/trpc";

// Expo Router adds href to options, but it's not in the base type
type ExpoRouterOptions = {
  href?: string | null;
};

export function RoleBasedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { data: userData } = trpc.user.me.useQuery();
  const userRole = userData?.role;
  const onboardingComplete = userData?.onboardingComplete ?? false;
  const isInvestor = userRole === "INVESTOR";

  // Filter routes based on user role AND onboarding status
  // Core tabs: Swipe, Connections (matches), Profile only. Browse and Messages hidden.
  const filteredRoutes = state.routes.filter((route) => {
    const routeName = route.name;

    // Browse (investor/index) - always hidden from tab bar
    if (routeName === "investor/index") return false;
    // Messages tab - hidden; users reach chat via Connections
    if (routeName === "messages/index") return false;
    // Visionary dashboard - hidden; core tabs only (Swipe, Connections, Profile)
    if (routeName === "visionary/dashboard") return false;

    // HARD GATE: Hide protected tabs for investors until onboarding complete
    if (isInvestor && !onboardingComplete) {
      // During onboarding: only setup; setup has href:null so no tabs shown
      if (routeName.startsWith("investor")) return true;
      return false;
    }

    // Core tabs - show after onboarding complete
    if (routeName.startsWith("swipe")) return true;
    if (routeName.startsWith("matches")) return true;
    if (routeName.startsWith("profile")) return true;

    // Investor-only (Browse excluded above)
    if (routeName.startsWith("investor")) return userRole === "INVESTOR";

    // Visionary-only tabs
    if (routeName.startsWith("visionary")) return userRole === "VISIONARY";

    return false;
  });

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "#ffffff",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        paddingBottom: 8,
        paddingTop: 8,
        height: 60
      }}
    >
      {filteredRoutes.map((route) => {
        const originalIndex = state.routes.indexOf(route);
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === originalIndex;

        // Skip if href is null (hidden screens like chat details, setup pages)
        const expoOptions = options as ExpoRouterOptions;
        if (expoOptions.href === null) {
          return null;
        }

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key
          });
        };

        const color = isFocused ? "#047857" : "#6b7280";

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
            <Text style={{ color, fontSize: 12, marginTop: 4 }}>
              {typeof label === "string" ? label : ""}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
