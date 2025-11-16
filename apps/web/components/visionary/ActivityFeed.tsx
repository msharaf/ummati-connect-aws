"use client";

import { trpc } from "../../../src/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ActivityItemProps {
  type: "profile_view" | "swipe_received" | "match_created" | "message_received";
  timestamp: Date;
  data: any;
}

function ActivityItem({ type, timestamp, data }: ActivityItemProps) {
  const getActivityConfig = () => {
    switch (type) {
      case "profile_view":
        return {
          icon: "👁️",
          text: `${data.investor.name || "An investor"} viewed your profile`,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        };
      case "swipe_received":
        return {
          icon: "💚",
          text: `${data.investor.name || "An investor"} liked your profile`,
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200"
        };
      case "match_created":
        return {
          icon: "✨",
          text: `New match with ${data.investor.name || "an investor"}!`,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          link: `/messages?matchId=${data.matchId}`
        };
      case "message_received":
        return {
          icon: "💬",
          text: `New message from ${data.investor.name || "an investor"}`,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          link: `/messages?matchId=${data.matchId}`,
          preview: data.text
        };
      default:
        return {
          icon: "📌",
          text: "Activity",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200"
        };
    }
  };

  const config = getActivityConfig();
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  const content = (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border ${config.borderColor} ${config.bgColor} hover:shadow-sm transition-shadow`}
    >
      <div className={`${config.bgColor} p-2 rounded-lg`}>
        <span className="text-xl">{config.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${config.color}`}>{config.text}</p>
        {config.preview && (
          <p className="text-sm text-gray-600 mt-1 truncate">
            &quot;{config.preview}&quot;
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
      </div>
    </div>
  );

  if (config.link) {
    return (
      <Link href={config.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function ActivityFeed() {
  const { data: activities, isLoading, error } =
    trpc.visionaryDashboard.getRecentActivity.useQuery();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-charcoal mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 animate-pulse"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-charcoal mb-4">Recent Activity</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-semibold">Error loading activity</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
        <h2 className="text-xl font-semibold text-charcoal mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">No activity yet</p>
          <p className="text-sm">
            Complete your profile and start connecting with investors to see activity here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-emerald-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-charcoal">Recent Activity</h2>
        <span className="text-sm text-gray-500">
          {activities.length} {activities.length === 1 ? "event" : "events"}
        </span>
      </div>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <ActivityItem
            key={`${activity.type}-${activity.timestamp.getTime()}-${index}`}
            type={activity.type}
            timestamp={activity.timestamp}
            data={activity.data}
          />
        ))}
      </div>
    </div>
  );
}

