import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { trpc } from "../../src/lib/trpc";
import { getBaseUrl } from "../../src/lib/trpc";

export default function TRPCDebugScreen() {
  const { data: meData, isLoading, error, refetch } = trpc.auth.me.useQuery();

  return (
    <ScrollView
      className="flex-1 bg-emerald-50"
      contentContainerStyle={{ padding: 16 }}
    >
      <View className="mb-6">
        <Text className="mb-2 text-3xl font-bold text-charcoal">
          tRPC Debug Screen
        </Text>
        <Text className="text-sm text-charcoal/70">
          Test connection to Next.js tRPC API
        </Text>
      </View>

      <View className="mb-4 rounded-lg border border-emerald-200 bg-white p-4">
        <Text className="mb-2 text-sm font-semibold text-emerald-700">
          Base URL:
        </Text>
        <Text className="font-mono text-xs text-charcoal">
          {getBaseUrl()}/api/trpc
        </Text>
        <Text className="mt-2 text-xs text-charcoal/60">
          Update EXPO_PUBLIC_API_URL in app.config.ts or .env to change
        </Text>
      </View>

      <View className="mb-4 rounded-lg border border-emerald-200 bg-white p-4">
        <Text className="mb-2 text-sm font-semibold text-emerald-700">
          Status:
        </Text>
        {isLoading && (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#059669" />
            <Text className="text-blue-600">Loading tRPC query...</Text>
          </View>
        )}
        {error && (
          <View className="mt-2">
            <Text className="mb-1 font-semibold text-red-800">Error:</Text>
            <Text className="mb-2 text-red-600">{error.message}</Text>
            <Text className="font-mono text-xs text-red-600">
              {JSON.stringify(error, null, 2)}
            </Text>
          </View>
        )}
        {meData !== undefined && !error && (
          <View className="mt-2">
            <Text className="mb-1 text-green-600">✓ tRPC connection successful!</Text>
            <Text className="mt-2 text-sm text-charcoal">
              {meData?.userId ? `User ID: ${meData.userId}` : meData?.message ?? "Connected"}
            </Text>
          </View>
        )}
      </View>

      <View className="mb-4 rounded-lg border border-emerald-200 bg-white p-4">
        <Text className="mb-2 text-sm font-semibold text-emerald-700">
          Response Data:
        </Text>
        <Text className="font-mono text-xs text-charcoal">
          {JSON.stringify(meData, null, 2)}
        </Text>
      </View>

      <View className="rounded-lg border border-emerald-200 bg-white p-4">
        <Text className="mb-2 text-sm font-semibold text-emerald-700">
          Test Query:
        </Text>
        <Text className="mb-2 font-mono text-xs text-charcoal">
          trpc.auth.me.useQuery()
        </Text>
        <Text className="text-xs text-charcoal/70">
          Returns the current session user (null if not authenticated).
          Confirms the mobile ↔ backend connection is working.
        </Text>
      </View>
    </ScrollView>
  );
}

