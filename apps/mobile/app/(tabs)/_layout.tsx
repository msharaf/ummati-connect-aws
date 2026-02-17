/**
 * EXPO ROUTER LAYOUT CONTRACT:
 * - Layouts MUST be deterministic (same structure every render)
 * - Layouts MUST only return <Tabs.Screen> children (no conditionals, no wrappers, no fragments)
 * - NO business logic, NO loading states, NO data fetching in the layout itself
 * - Role-based tab visibility handled via custom tabBar component
 */

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LogoutButton } from "../../src/components/LogoutButton";
import { RoleBasedTabBar } from "../../src/components/RoleBasedTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <RoleBasedTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerRight: () => <LogoutButton />,
        headerTitle: "",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#ecfdf5" },
        tabBarActiveTintColor: "#047857",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingBottom: 8,
          paddingTop: 8,
          height: 60
        }
      }}
    >
      <Tabs.Screen
        name="swipe/index"
        options={{
          title: "Swipe",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="matches/index"
        options={{
          title: "Matches",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="messages/index"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="messages/[matchId]"
        options={{
          href: null,
          headerTitle: "Chat"
        }}
      />
      <Tabs.Screen
        name="investor/index"
        options={{
          title: "Browse",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="visionary/dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="visionary/setup"
        options={{
          href: null,
          headerTitle: "Setup"
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
}

