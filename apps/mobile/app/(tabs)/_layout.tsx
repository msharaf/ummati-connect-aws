"use client";

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "../../src/lib/trpc";
import { View, ActivityIndicator, Text } from "react-native";
import { LogoutButton } from "../../src/components/LogoutButton";

export default function TabsLayout() {
  // Get user role to conditionally show tabs
  const { data: user, isLoading } = trpc.user.getMe.useQuery();

  // Show loading state while fetching user role
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  const userRole = user?.role;

  return (
    <Tabs
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
      {/* Common tabs for both roles */}
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
          href: null, // Hide from tab bar
          headerTitle: "Chat"
        }}
      />

      {/* Investor-specific tabs */}
      {userRole === "INVESTOR" && (
        <Tabs.Screen
          name="investor/index"
          options={{
            title: "Browse",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search" size={size} color={color} />
            )
          }}
        />
      )}

      {/* Visionary-specific tabs */}
      {userRole === "VISIONARY" && (
        <>
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
              href: null, // Hide from tab bar
              headerTitle: "Setup"
            }}
          />
        </>
      )}

      {/* Hide tabs that don't belong to current role */}
      {userRole !== "INVESTOR" && (
        <Tabs.Screen
          name="investor/index"
          options={{
            href: null, // Hide from tab bar
            headerShown: false
          }}
        />
      )}

      {userRole !== "VISIONARY" && (
        <>
          <Tabs.Screen
            name="visionary/dashboard"
            options={{
              href: null, // Hide from tab bar
              headerShown: false
            }}
          />
          <Tabs.Screen
            name="visionary/setup"
            options={{
              href: null, // Hide from tab bar
              headerTitle: "Setup"
            }}
          />
        </>
      )}

      {/* Profile tab - always visible */}
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

