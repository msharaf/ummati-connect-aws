"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { trpc } from "../../src/lib/trpc";
import { StartupStage } from "@ummati/db";

interface VisionaryDetailsProps {
  profileId: string | null;
  onClose: () => void;
}

export function VisionaryDetails({ profileId, onClose }: VisionaryDetailsProps) {
  const [isShortlisting, setIsShortlisting] = useState(false);
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.investor.getVisionaryDetails.useQuery(
    { visionaryId: profileId! },
    { enabled: Boolean(profileId) }
  );

  const shortlist = trpc.investor.shortlistVisionary.useMutation({
    onSuccess: () => {
      utils.investor.getVisionaryDetails.invalidate({ visionaryId: profileId! });
      utils.investor.browseVisionaries.invalidate();
    },
    onSettled: () => {
      setIsShortlisting(false);
    }
  });

  const handleShortlist = () => {
    if (!profileId) return;
    setIsShortlisting(true);
    shortlist.mutate({ visionaryId: profileId });
  };

  if (!profileId) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 h-full flex items-center justify-center">
        <p className="text-charcoal/50 text-center">
          Select a visionary profile to view details
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 h-full flex items-center justify-center">
        <p className="text-charcoal/70">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 h-full flex items-center justify-center">
        <p className="text-charcoal/70">Profile not found</p>
      </div>
    );
  }

  const displayName = profile.name || "Unknown Founder";
  const vp = profile.visionaryProfile;
  const barakahScore = typeof vp?.barakahScore === "object" && vp?.barakahScore !== null
    ? (vp.barakahScore as { score?: number }).score
    : null;
  const barakahNotes = typeof vp?.barakahScore === "object" && vp?.barakahScore !== null
    ? (vp.barakahScore as { notes?: string | null }).notes
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4 flex-1">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-emerald-200 flex-shrink-0">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-emerald-300">
                <span className="text-emerald-700 font-semibold text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-charcoal mb-1">{vp?.startupName ?? "Startup"}</h2>
            <p className="text-charcoal/70">{displayName}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-charcoal/50 hover:text-charcoal text-xl"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
          {vp?.sector ?? vp?.industry ?? "—"}
        </span>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-full">
          {vp?.startupStage ?? "—"}
        </span>
        {vp?.halalCategory && (
          <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-sm font-medium rounded-full">
            {vp.halalCategory}
          </span>
        )}
        {barakahScore != null && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
            Barakah: {barakahScore}/10
          </span>
        )}
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-charcoal mb-2">About</h3>
        <p className="text-charcoal/70 leading-relaxed whitespace-pre-wrap">
          {vp?.description ?? "No description"}
        </p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {(vp?.location ?? profile.location) && (
          <div>
            <p className="text-sm text-charcoal/60 mb-1">Location</p>
            <p className="text-charcoal font-medium">{vp?.location ?? profile.location}</p>
          </div>
        )}
        {vp?.fundingNeeded != null && (
          <div>
            <p className="text-sm text-charcoal/60 mb-1">Funding Ask</p>
            <p className="text-charcoal font-medium">
              ${vp.fundingNeeded.toLocaleString()}
            </p>
          </div>
        )}
        {vp?.websiteUrl && (
          <div className="col-span-2">
            <p className="text-sm text-charcoal/60 mb-1">Website</p>
            <a
              href={vp.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 font-medium break-all"
            >
              {vp.websiteUrl}
            </a>
          </div>
        )}
      </div>

      {/* Barakah Score Details */}
      {barakahScore != null && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Barakah Score: {barakahScore}/10
          </h3>
          {barakahNotes && (
            <p className="text-yellow-700 text-sm">{barakahNotes}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-emerald-200">
        <button
          onClick={handleShortlist}
          disabled={isShortlisting}
          className="flex-1 px-4 py-2 rounded-lg font-semibold transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          {isShortlisting ? "Loading..." : "⭐ Add to Shortlist"}
        </button>
        <Link
          href="/dashboard"
          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-center"
        >
          Go to Swipe Mode
        </Link>
      </div>
    </div>
  );
}

