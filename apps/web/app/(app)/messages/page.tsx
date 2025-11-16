"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "../../../src/lib/trpc";
import { MatchList } from "../../../components/messages/MatchList";
import { MessageThread } from "../../../components/messages/MessageThread";

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(
    searchParams.get("match") || null
  );

  const { data: matches, isLoading } = trpc.message.getMatchesWithLastMessage.useQuery(
    undefined,
    {
      refetchInterval: 5000 // Poll every 5 seconds for "real-time" updates
    }
  );

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    router.push(`/messages?match=${matchId}`);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] border border-emerald-200 rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Left Sidebar - Match List */}
      <div className="w-80 border-r border-emerald-200 bg-emerald-50 flex flex-col">
        <div className="p-4 border-b border-emerald-200 bg-emerald-600">
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <p className="text-sm text-emerald-100">
            {matches?.length ?? 0} {matches?.length === 1 ? "match" : "matches"}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-charcoal/70">Loading matches...</div>
          ) : matches && matches.length > 0 ? (
            <MatchList
              matches={matches}
              selectedMatchId={selectedMatchId}
              onSelect={handleSelectMatch}
            />
          ) : (
            <div className="p-8 text-center text-charcoal/70">
              <p className="mb-2">No matches yet</p>
              <p className="text-sm">Start swiping to find your match!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat Thread */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedMatchId ? (
          <MessageThread matchId={selectedMatchId} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-emerald-50">
            <div className="text-center p-8">
              <p className="text-2xl text-charcoal/50 mb-2">Select a match</p>
              <p className="text-charcoal/70">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-4rem)] items-center justify-center">Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}

