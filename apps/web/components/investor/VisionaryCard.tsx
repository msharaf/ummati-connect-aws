"use client";

import Image from "next/image";
import { useState } from "react";
import { trpc } from "../../src/lib/trpc";
import { StartupStage } from "@ummati/db";

interface VisionaryCardProps {
  profile: {
    id: string;
    userId: string;
    name: string | null;
    avatarUrl: string | null;
    startupName: string;
    sector: string;
    stage: StartupStage;
    location: string | null;
    halalCategory: string | null;
    description: string;
    fundingAsk: number | null;
    websiteUrl: string | null;
    barakahScore: number | null;
    barakahNotes: string | null;
  };
  onSelect: (profileId: string) => void;
}

export function VisionaryCard({ profile, onSelect }: VisionaryCardProps) {
  const [isShortlisting, setIsShortlisting] = useState(false);
  const utils = trpc.useUtils();

  const shortlist = trpc.investor.shortlistVisionary.useMutation({
    onSuccess: () => {
      utils.investor.getShortlist.invalidate();
      utils.investor.browseVisionaries.invalidate();
    },
    onSettled: () => {
      setIsShortlisting(false);
    }
  });

  const handleShortlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShortlisting(true);
    shortlist.mutate({ visionaryId: profile.id });
  };

  const displayName = profile.name || "Unknown Founder";

  return (
    <div
      onClick={() => onSelect(profile.id)}
      className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-emerald-100"
    >
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-emerald-200 flex-shrink-0">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
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

        {/* Header Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-charcoal text-lg truncate">
            {profile.startupName}
          </h3>
          <p className="text-sm text-charcoal/70 truncate">{displayName}</p>
        </div>

        {/* Shortlist Button */}
        <button
          onClick={handleShortlist}
          disabled={isShortlisting}
          className="text-2xl hover:scale-110 transition-transform disabled:opacity-50"
          title="Shortlist"
        >
          ⭐
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
          {profile.sector}
        </span>
        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
          {profile.stage}
        </span>
        {profile.barakahScore && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            Barakah: {profile.barakahScore}/10
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-charcoal/70 line-clamp-2 mb-3">{profile.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-charcoal/60">
        <span>{profile.location || "Location not specified"}</span>
        {profile.fundingAsk && (
          <span className="font-medium text-emerald-600">
            ${(profile.fundingAsk / 1000).toFixed(0)}k ask
          </span>
        )}
      </div>
    </div>
  );
}

