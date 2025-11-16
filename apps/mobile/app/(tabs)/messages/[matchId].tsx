import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format } from "date-fns";
import { trpc } from "../../../src/lib/trpc";
import { Avatar } from "../../../components/Avatar";

interface MessageBubbleProps {
  message: {
    id: string;
    text: string;
    senderId: string;
    createdAt: Date;
    sender: {
      id: string;
      name: string | null;
    };
  };
  isOwnMessage: boolean;
}

function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const timeString = format(new Date(message.createdAt), "h:mm a");

  return (
    <View
      className={`flex-row ${isOwnMessage ? "justify-end" : "justify-start"} mb-3`}
    >
      <View
        className={`rounded-xl px-4 py-2 max-w-[75%] ${
          isOwnMessage
            ? "bg-emerald-600"
            : "bg-gray-200"
        }`}
      >
        <Text
          className={`text-sm leading-relaxed ${
            isOwnMessage ? "text-white" : "text-gray-900"
          }`}
        >
          {message.text}
        </Text>
        <Text
          className={`text-xs mt-1 ${
            isOwnMessage ? "text-emerald-100" : "text-gray-500"
          }`}
        >
          {timeString}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [messageText, setMessageText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Get current user
  const { data: currentUser } = trpc.user.getMe.useQuery();

  // Get match details
  const { data: match } = trpc.match.getMatchById.useQuery(
    { matchId: matchId! },
    { enabled: Boolean(matchId) }
  );

  // Get messages
  const { data: messages, isLoading: isLoadingMessages } =
    trpc.message.getMessagesForMatch.useQuery(
      { matchId: matchId! },
      {
        enabled: Boolean(matchId),
        refetchInterval: 3000 // Poll every 3 seconds for new messages
      }
    );

  const utils = trpc.useUtils();

  // Mark messages as read when screen opens
  const markAsRead = trpc.message.markAsRead.useMutation({
    onSuccess: () => {
      utils.message.getMatchesWithLastMessage.invalidate();
    }
  });

  // Send message mutation
  const sendMessage = trpc.message.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      // Invalidate and refetch messages
      utils.message.getMessagesForMatch.invalidate({ matchId: matchId! });
      utils.message.getMatchesWithLastMessage.invalidate();
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  });

  // Mark as read when screen loads or matchId changes
  useEffect(() => {
    if (matchId) {
      markAsRead.mutate({ matchId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim() && !sendMessage.isPending && matchId) {
      sendMessage.mutate({
        matchId,
        text: messageText.trim()
      });
    }
  };

  const otherUser = match
    ? match.userAId === currentUser?.id
      ? match.userB
      : match.userA
    : null;

  const displayName = otherUser?.name || "Unknown User";
  const roleLabel = otherUser?.role === "INVESTOR" ? "Investor" : "Visionary";
  const roleBadgeColor =
    otherUser?.role === "INVESTOR" ? "bg-emerald-600" : "bg-yellow-600";

  if (!matchId) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-600 mb-4">Invalid match ID</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-emerald-600">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-emerald-600 text-lg font-semibold">←</Text>
          </TouchableOpacity>
          <Avatar src={otherUser?.avatarUrl} name={otherUser?.name} size="md" className="mr-3" />
          <View className="flex-1">
            <Text className="text-xl font-semibold text-gray-900">
              {displayName}
            </Text>
          </View>
          {otherUser?.role && (
            <View className={`px-2 py-1 rounded-full ${roleBadgeColor}`}>
              <Text className="text-xs font-medium text-white">{roleLabel}</Text>
            </View>
          )}
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwnMessage={item.senderId === currentUser?.id}
            />
          )}
          keyExtractor={(item) => item.id}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          ListEmptyComponent={
            isLoadingMessages ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color="#047857" />
                <Text className="text-gray-500 mt-2">Loading messages...</Text>
              </View>
            ) : (
              <View className="py-8 items-center">
                <Text className="text-gray-500">
                  No messages yet. Start the conversation!
                </Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Input Area */}
        <View className="flex-row items-center p-3 border-t border-gray-200 bg-white">
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type your message..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={2000}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 mr-2 text-gray-900 max-h-24"
            style={{ fontSize: 16 }}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim() || sendMessage.isPending}
            className={`px-4 py-2 rounded-xl ${
              messageText.trim() && !sendMessage.isPending
                ? "bg-emerald-600"
                : "bg-gray-300"
            }`}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white font-bold">Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
