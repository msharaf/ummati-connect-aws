"use client";

import { useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { trpc } from "../lib/trpc";
import { useAuthStore } from "../store/useAuthStore";
import { ProfileCard } from "../components/ProfileCard";

const demoUser = {
  id: "ckdemo-investor",
  fullName: "Demo Investor",
  role: "INVESTOR" as const
};

export function DashboardScreen() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setUser(demoUser);
    }
  }, [setUser, user]);

  const { data: recommendationsData } = trpc.matchmaking.getRecommendations.useQuery(
    undefined,
    { enabled: Boolean(user?.id), staleTime: 1000 * 60 }
  );

  const { data: matches } = trpc.matchmaking.getMatches.useQuery(
    { limit: 20 },
    { enabled: Boolean(user?.id), refetchInterval: 1000 * 30 }
  );

  return (
    <ScrollView className="flex-1 bg-emerald-50" contentInsetAdjustmentBehavior="automatic">
      <View className="px-6 pt-16 pb-24">
        <View>
          <Text className="text-xs font-semibold uppercase text-emerald-700">
            Dashboard
          </Text>
          <Text className="mt-2 text-3xl font-semibold text-charcoal">
            As-salaam, {user?.fullName ?? demoUser.fullName}
          </Text>
          <Text className="mt-2 text-sm text-charcoal/70">
            Swipe through curated visionaries and nurture your active matches.
          </Text>
        </View>

        <View className="mt-10">
          <Text className="text-lg font-semibold text-charcoal">Recommended</Text>
          <View className="mt-4 space-y-4">
            {recommendationsData?.recommendations?.map((profile, idx) => (
              <ProfileCard
                key={(profile as { user?: { id?: string } }).user?.id ?? (profile as { startupName?: string }).startupName ?? String(idx)}
                type="VISIONARY"
                name={(profile as { fullName?: string }).fullName ?? (profile as { user?: { fullName?: string } }).user?.fullName ?? "Unknown"}
                location={(profile as { location?: string }).location ?? ""}
                industries={[(profile as { industry?: string }).industry, (profile as { sector?: string }).sector].filter((v): v is string => typeof v === "string" && v.length > 0)}
                barakahScore={(profile as { barakahScore?: { score?: number } }).barakahScore?.score}
              />
            ))}
            {!recommendationsData?.recommendations?.length && (
              <View className="rounded-3xl border border-dashed border-emerald-200 bg-white/70 p-6">
                <Text className="text-sm text-charcoal/60">
                  No recommendations yet. Complete your profile to unlock tailored dealflow.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="mt-12">
          <Text className="text-lg font-semibold text-charcoal">Matches</Text>
          <View className="mt-4 space-y-4">
            {matches?.map((match) => {
              const other = match.otherUser;
              const industries = other.visionaryProfile?.industry
                ? [other.visionaryProfile.industry]
                : other.investorProfile?.industriesInterestedIn ?? [];
              return (
                <View
                  key={match.id}
                  className="space-y-3 rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow"
                >
                  <Text className="text-xs font-semibold uppercase text-emerald-600">
                    Active Match
                  </Text>
                  <Text className="text-lg font-semibold text-charcoal">
                    {other.fullName ?? other.email}
                  </Text>
                  <Text className="text-sm text-charcoal/70">
                    {industries.join(" • ") ?? ""}
                  </Text>
                  <View className="flex-row gap-3">
                    <TouchableOpacity className="flex-1 rounded-full border border-emerald-200 px-4 py-3">
                      <Text className="text-center text-sm font-semibold text-emerald-700">
                        View Workspace
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 rounded-full bg-emerald-600 px-4 py-3 shadow">
                      <Text className="text-center text-sm font-semibold text-white">
                        Message
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {!matches?.length && (
              <View className="rounded-3xl border border-dashed border-emerald-200 bg-white/70 p-6">
                <Text className="text-sm text-charcoal/60">
                  Swipe with niyyah. When both parties say yes, you'll see the match here.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

