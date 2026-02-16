import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { getBaseUrl } from "../lib/trpc";

/**
 * In __DEV__ on native, fetches /health before rendering children.
 * If unreachable, shows a user-friendly error screen.
 */
export function ApiReachabilityGate({
  children
}: {
  children: React.ReactNode;
}) {
  const [reachable, setReachable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!__DEV__ || Platform.OS === "web") {
      setReachable(true);
      return;
    }
    const baseUrl = getBaseUrl();
    const healthUrl = `${baseUrl.replace(/\/$/, "")}/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(healthUrl, { signal: controller.signal })
      .then((res) => setReachable(res.ok))
      .catch(() => setReachable(false))
      .finally(() => clearTimeout(timeoutId));

    return () => controller.abort();
  }, []);

  if (!__DEV__ || Platform.OS === "web" || reachable === true) {
    return <>{children}</>;
  }

  if (reachable === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Checking API...</Text>
      </View>
    );
  }

  const baseUrl = getBaseUrl();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cannot reach API</Text>
      <Text style={styles.url}>{baseUrl}</Text>
      <Text style={styles.hint}>
        Check WiFi and Windows firewall port 3001. Ensure phone and PC are on
        the same network. Set EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3001 in
        apps/mobile/.env
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0f172a"
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 12,
    textAlign: "center"
  },
  url: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 16,
    textAlign: "center"
  },
  hint: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22
  }
});
