import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { trpc } from "../../../src/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { ActivityIndicator } from "react-native";
import { Avatar } from "../../../components/Avatar";

interface MatchListItemProps {
  match: {
    id: string;
    otherUser: {
      id: string;
      fullName: string | null;
      avatarUrl: string | null;
      role: "INVESTOR" | "VISIONARY" | null;
    };
    lastMessage: { text: string; createdAt: Date } | null;
  };
  onPress: () => void;
}

function MatchListItem({ match, onPress }: MatchListItemProps) {
  const { otherUser, lastMessage } = match;
  const displayName = otherUser.fullName || "Unknown User";

  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const roleBadgeColor =
    otherUser.role === "INVESTOR" ? "bg-emerald-600" : "bg-yellow-600";
  const roleLabel = otherUser.role === "INVESTOR" ? "Investor" : "Visionary";

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-4 p-4 bg-white border border-emerald-100 rounded-xl shadow-sm mb-3"
    >
      {/* Avatar */}
      <Avatar src={otherUser.avatarUrl} name={displayName} size="md" />

      {/* Content */}
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-lg font-semibold text-gray-900 flex-1" numberOfLines={1}>
            {displayName}
          </Text>
          {otherUser.role && (
            <View className={`px-2 py-0.5 rounded-full ${roleBadgeColor}`}>
              <Text className="text-xs font-medium text-white">{roleLabel}</Text>
            </View>
          )}
        </View>
        <Text className="text-sm text-gray-600 mb-1" numberOfLines={1}>
          {lastMessage?.text || "No messages yet"}
        </Text>
        <Text className="text-xs text-gray-500">
          {formatTimestamp(lastMessage?.createdAt ?? new Date())}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MatchesScreen() {
  const router = useRouter();
  const { data: matches, isLoading } = trpc.matchmaking.getMatches.useQuery();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-emerald-50 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-gray-600 mt-4">Loading matches...</Text>
      </SafeAreaView>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-emerald-50">
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-6xl mb-4">💬</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-2">No Matches Yet</Text>
          <Text className="text-gray-600 text-center">
            Start swiping to find investors or visionaries to connect with!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-emerald-50">
      <View className="flex-1 px-4 pt-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Matches</Text>
          <Text className="text-gray-600">Your connections and conversations</Text>
        </View>

        {/* Matches List */}
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MatchListItem
              match={item}
              onPress={() => router.push(`/(tabs)/messages/${item.id}`)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}
