"use client";

import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "../../../src/lib/trpc";

interface Match {
  matchId: string;
  otherUser: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    role: string | null;
    location: string | null;
  };
  lastMessage: {
    id: string;
    text: string;
    createdAt: Date;
    senderId: string;
    sender: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
      role: string | null;
    };
  } | null;
  unreadCount: number;
  createdAt: Date;
}

export default function MessagesTab() {
  const router = useRouter();

  const { data: matches, isLoading, refetch } = trpc.message.getMatchesWithLastMessage.useQuery(
    undefined,
    {
      refetchInterval: 5000 // Poll every 5 seconds for "real-time" updates
    }
  );

  const handleSelectMatch = (matchId: string) => {
    router.push(`/(tabs)/messages/${matchId}`);
  };

  const renderMatchItem = ({ item }: { item: Match }) => {
    const displayName = item.otherUser.name || "Unknown User";
    const role = item.otherUser.role || "";
    const lastMessageText = item.lastMessage
      ? item.lastMessage.senderId === item.otherUser.id
        ? item.lastMessage.text
        : `You: ${item.lastMessage.text}`
      : "No messages yet";

    return (
      <TouchableOpacity
        onPress={() => handleSelectMatch(item.matchId)}
        className="flex-row items-center p-4 border-b border-gray-200 bg-white active:bg-gray-50"
      >
        {/* Avatar */}
        <View className="w-14 h-14 rounded-full overflow-hidden bg-emerald-200 mr-3 flex-shrink-0">
          {item.otherUser.avatarUrl ? (
            <Image
              source={{ uri: item.otherUser.avatarUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full flex items-center justify-center bg-emerald-300">
              <Text className="text-emerald-700 font-semibold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-semibold text-gray-900 text-base" numberOfLines={1}>
              {displayName}
            </Text>
            {item.lastMessage && (
              <Text className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatDistanceToNow(new Date(item.lastMessage.createdAt), {
                  addSuffix: true
                })}
              </Text>
            )}
          </View>

          <View className="flex-row items-center gap-2 mb-1">
            {role && (
              <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-emerald-700 font-medium">{role}</Text>
              </View>
            )}
            {item.unreadCount > 0 && (
              <View className="bg-emerald-600 px-2 py-0.5 rounded-full min-w-[20px] items-center">
                <Text className="text-xs text-white font-bold">{item.unreadCount}</Text>
              </View>
            )}
          </View>

          <Text className="text-sm text-gray-600" numberOfLines={1}>
            {lastMessageText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-gray-600">Loading matches...</Text>
      </View>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-8">
        <Text className="text-2xl font-bold text-gray-900 mb-2">No matches yet</Text>
        <Text className="text-gray-600 text-center">
          Start swiping to find your match!
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={matches}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.matchId}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
}
