"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "../../../../src/lib/trpc";
import { format } from "date-fns";
import { Avatar } from "../../../../components/Avatar";
import { BackButtonWeb } from "../../../../components/BackButtonWeb";

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
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`rounded-xl px-4 py-2 max-w-xs ${
          isOwnMessage
            ? "bg-emerald-600 text-white"
            : "bg-gray-200 text-gray-900"
        }`}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
        <p
          className={`text-xs mt-1 ${
            isOwnMessage ? "text-emerald-100" : "text-gray-500"
          }`}
        >
          {timeString}
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get current user
  const { data: currentUser } = trpc.user.me.useQuery();

  // Get match details
  const { data: match } = trpc.matchmaking.getMatch.useQuery(
    { matchId },
    { enabled: Boolean(matchId) }
  );

  // Get messages
  const { data: messages, isLoading: isLoadingMessages } =
    trpc.messages.getMessagesForMatch.useQuery(
      { matchId },
      {
        enabled: Boolean(matchId),
        refetchInterval: 3000 // Poll every 3 seconds for new messages
      }
    );

  const utils = trpc.useUtils();

  // Mark messages as read when page opens
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
      utils.messages.getMessagesForMatch.invalidate({ matchId });
      utils.messages.getMatchesWithLastMessage.invalidate();
    }
  });

  // Mark as read when page loads or matchId changes
  useEffect(() => {
    if (matchId) {
      markAsRead.mutate({ matchId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && !sendMessage.isPending && matchId) {
      sendMessage.mutate({
        matchId,
        text: messageText.trim()
      });
    }
  };

  const otherUser = match?.otherUser ?? null;
  const currentUserId = currentUser?.profile?.id;

  const displayName = otherUser?.fullName ?? "Unknown User";
  const roleLabel = otherUser?.role === "INVESTOR" ? "Investor" : "Visionary";
  const roleBadgeColor =
    otherUser?.role === "INVESTOR" ? "bg-emerald-600" : "bg-yellow-600";

  if (!matchId) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center relative">
        <div className="absolute top-4 left-4 z-10">
          <BackButtonWeb fallbackRoute="/matches" />
        </div>
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invalid match ID</p>
          <BackButtonWeb fallbackRoute="/matches" showLabel label="Go back to matches" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-4 gap-4 bg-emerald-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border border-emerald-200 rounded-xl shadow-sm">
        <BackButtonWeb fallbackRoute="/matches" />
        <Avatar src={otherUser?.avatarUrl} name={displayName} size="md" />
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{displayName}</h1>
          {otherUser?.role && (
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white ${roleBadgeColor}`}
            >
              {roleLabel}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Message List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-white border border-emerald-200 rounded-xl shadow-sm p-4"
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">Loading messages...</p>
          </div>
        ) : messages?.messages && messages.messages.length > 0 ? (
          <>
            {messages.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={{
                  ...message,
                  sender: {
                    id: message.sender.id,
                    name: message.sender.fullName ?? message.sender.email ?? null
                  }
                }}
                isOwnMessage={message.senderId === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No messages yet</p>
              <p className="text-sm text-gray-400">
                Start the conversation by sending a message!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Message Input Row */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-white border border-emerald-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={!messageText.trim() || sendMessage.isPending}
          className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
            messageText.trim() && !sendMessage.isPending
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {sendMessage.isPending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

