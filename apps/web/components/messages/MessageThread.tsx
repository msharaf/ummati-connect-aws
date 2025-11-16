"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "../../src/lib/trpc";

interface MessageThreadProps {
  matchId: string;
}

export function MessageThread({ matchId }: MessageThreadProps) {
  const { user: clerkUser } = useUser();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get current user from tRPC
  const { data: currentUser } = trpc.auth.getCurrentUser.useQuery();

  // Get match details
  const { data: match } = trpc.match.getMatchById.useQuery(
    { matchId },
    { enabled: Boolean(matchId) }
  );

  // Get messages with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = trpc.message.getMessages.useInfiniteQuery(
    { matchId, limit: 30 },
    {
      enabled: Boolean(matchId),
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      refetchInterval: 3000 // Poll every 3 seconds for new messages
    }
  );

  const utils = trpc.useUtils();

  // Mark messages as read when thread opens
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
      utils.message.getMessages.invalidate({ matchId });
      utils.message.getMatchesWithLastMessage.invalidate();
    }
  });

  // Mark as read when component mounts or matchId changes
  useEffect(() => {
    if (matchId) {
      markAsRead.mutate({ matchId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && !sendMessage.isPending) {
      sendMessage.mutate({
        matchId,
        text: messageText.trim()
      });
    }
  };

  const messages = data?.pages.flatMap((page) => page.messages) ?? [];
  const otherUser = match
    ? match.userAId === currentUser?.id
      ? match.userB
      : match.userA
    : null;

  const displayName = otherUser?.name || "Unknown User";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-emerald-200 bg-emerald-50">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-emerald-200">
            {otherUser?.avatarUrl ? (
              <Image
                src={otherUser.avatarUrl}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-emerald-300">
                <span className="text-emerald-700 font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-charcoal">{displayName}</h2>
            {otherUser?.role && (
              <p className="text-xs text-charcoal/60">{otherUser.role}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-emerald-50/30 space-y-4"
      >
        {/* Load More Button */}
        {hasNextPage && (
          <div className="text-center mb-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium px-4 py-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-50 transition-colors"
            >
              {isFetchingNextPage ? "Loading..." : "Load Older Messages"}
            </button>
          </div>
        )}

        {/* Messages */}
        {messages.length === 0 ? (
          <div className="text-center text-charcoal/50 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUser?.id;
            const senderName = message.sender.name || "Unknown";

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-charcoal border border-emerald-200"
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1 opacity-70">{senderName}</p>
                  )}
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? "text-emerald-100" : "text-charcoal/50"
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-emerald-200 bg-white">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 px-4 py-2 border border-emerald-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={sendMessage.isPending}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sendMessage.isPending}
            className="px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sendMessage.isPending ? "Sending..." : "Send"}
          </button>
        </form>
        <p className="text-xs text-charcoal/50 mt-1 text-right">
          {messageText.length}/2000
        </p>
      </div>
    </div>
  );
}

