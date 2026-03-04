"use client";

import { useRouter } from "next/navigation";
import { trpc } from "../../../src/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "../../../components/Avatar";
import { BackButtonWeb } from "../../../components/BackButtonWeb";

interface MatchCardProps {
  match: {
    id: string;
    otherUser: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
      role: "INVESTOR" | "VISIONARY" | null;
    };
    lastMessage: string | null;
    lastMessageAt: Date;
  };
  onClick: () => void;
}

function MatchCard({ match, onClick }: MatchCardProps) {
  const { otherUser, lastMessage, lastMessageAt } = match;

  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const roleBadgeColor =
    otherUser.role === "INVESTOR" ? "bg-emerald-600" : "bg-yellow-600";
  const roleLabel = otherUser.role === "INVESTOR" ? "Investor" : "Visionary";

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-white border border-emerald-100 rounded-xl shadow-sm hover:bg-gray-50 cursor-pointer transition-colors"
    >
      {/* Avatar */}
      <Avatar src={otherUser.avatarUrl} name={otherUser.name} size="md" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {otherUser.name || "Unknown User"}
          </h3>
          {otherUser.role && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${roleBadgeColor}`}
            >
              {roleLabel}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 truncate mb-1">
          {lastMessage || "No messages yet"}
        </p>
        <p className="text-xs text-gray-500">
          {formatTimestamp(lastMessageAt)}
        </p>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const router = useRouter();
  const { data: matches, isLoading } = trpc.matchmaking.getMatches.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="min-h-screen bg-emerald-50 py-8">
        <div className="max-w-3xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Matches Yet</h1>
            <p className="text-gray-600">
              Start swiping to find investors or visionaries to connect with!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 py-8">
      <div className="max-w-3xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-4">
          <BackButtonWeb fallbackRoute="/dashboard" />
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Matches</h1>
          <p className="text-gray-600">
            Your connections and conversations
          </p>
        </div>

        {/* Matches List */}
        <div className="space-y-3">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={{
                id: match.id,
                otherUser: {
                  id: match.otherUser.id,
                  name: match.otherUser.fullName ?? null,
                  avatarUrl: match.otherUser.avatarUrl ?? null,
                  role: match.otherUser.role ?? null
                },
                lastMessage: match.lastMessage?.text ?? null,
                lastMessageAt: match.lastMessage?.createdAt ?? match.createdAt
              }}
              onClick={() => router.push(`/messages/${match.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

