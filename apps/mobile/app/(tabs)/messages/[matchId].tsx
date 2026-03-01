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
import { BackButton } from "../../../src/components/BackButton";
import { InvestorOnboardingGuard } from "../../../src/components/InvestorOnboardingGuard";

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
  return (
    <InvestorOnboardingGuard>
      <ChatScreenContent />
    </InvestorOnboardingGuard>
  );
}

function ChatScreenContent() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const [messageText, setMessageText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Get current user
  const { data: userData } = trpc.user.me.useQuery();
  const currentUser = userData?.profile;
  const onboardingComplete = userData?.onboardingComplete ?? false;

  // Get match details - gate on onboarding completion
  const { data: match } = trpc.matchmaking.getMatch.useQuery(
    { matchId: matchId! },
    { 
      enabled: Boolean(matchId) && onboardingComplete,
      retry: false
    }
  );

  // Get messages - gate on onboarding completion
  const { data: messagesData, isLoading: isLoadingMessages } =
    trpc.messages.getMessagesForMatch.useQuery(
      { matchId: matchId! },
      {
        enabled: Boolean(matchId) && onboardingComplete,
        retry: false,
        refetchInterval: onboardingComplete ? 10000 : false, // Poll every 10s (reduced from 3s) only if onboarding complete
        refetchOnWindowFocus: false // Prevent excessive refetches
      }
    );

  const utils = trpc.useUtils();
  const messages = messagesData?.messages ?? [];

  // Mark messages as read when screen opens
  const markAsRead = trpc.messages.markAsRead.useMutation({
    onSuccess: () => {
      utils.messages.getMatchesWithLastMessage.invalidate();
    }
  });

  // Send message mutation
  const sendMessage = trpc.messages.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      // Invalidate and refetch messages
      utils.messages.getMessagesForMatch.invalidate({ matchId: matchId! });
      utils.messages.getMatchesWithLastMessage.invalidate();
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

  const otherUser = match?.otherUser ?? null;

  const displayName = otherUser?.fullName || "Unknown User";
  const roleLabel = otherUser?.role === "INVESTOR" ? "Investor" : "Visionary";
  const roleBadgeColor =
    otherUser?.role === "INVESTOR" ? "bg-emerald-600" : "bg-yellow-600";

  if (!matchId) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-600 mb-4">Invalid match ID</Text>
        <BackButton fallbackRoute="/(tabs)/messages" />
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
          <View className="mr-3">
            <BackButton fallbackRoute="/(tabs)/messages" />
          </View>
          <Avatar src={otherUser?.avatarUrl} name={displayName} size="md" className="mr-3" />
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
