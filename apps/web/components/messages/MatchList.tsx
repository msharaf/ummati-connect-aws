"use client";

import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

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

interface MatchListProps {
  matches: Match[];
  selectedMatchId: string | null;
  onSelect: (matchId: string) => void;
}

export function MatchList({ matches, selectedMatchId, onSelect }: MatchListProps) {
  return (
    <div className="divide-y divide-emerald-100">
      {matches.map((match) => {
        const isSelected = match.matchId === selectedMatchId;
        const displayName = match.otherUser.name || "Unknown User";
        const role = match.otherUser.role || "";

        return (
          <button
            key={match.matchId}
            onClick={() => onSelect(match.matchId)}
            className={`w-full p-4 text-left hover:bg-emerald-100 transition-colors ${
              isSelected ? "bg-emerald-200 border-l-4 border-emerald-600" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-emerald-200 flex-shrink-0">
                {match.otherUser.avatarUrl ? (
                  <Image
                    src={match.otherUser.avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-300">
                    <span className="text-emerald-700 font-semibold text-lg">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-charcoal truncate">{displayName}</h3>
                  {match.lastMessage && (
                    <span className="text-xs text-charcoal/60 flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(match.lastMessage.createdAt), {
                        addSuffix: true
                      })}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-1">
                  {role && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                      {role}
                    </span>
                  )}
                  {match.unreadCount > 0 && (
                    <span className="ml-auto bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {match.unreadCount}
                    </span>
                  )}
                </div>

                {match.lastMessage ? (
                  <p className="text-sm text-charcoal/70 truncate">
                    {match.lastMessage.senderId === match.otherUser.id ? "" : "You: "}
                    {match.lastMessage.text}
                  </p>
                ) : (
                  <p className="text-sm text-charcoal/50 italic">No messages yet</p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

