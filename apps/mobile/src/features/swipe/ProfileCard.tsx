import { View, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { User } from "@ummati/db";

interface ProfileCardProps {
  user: User & {
    investorProfile?: any;
    visionaryProfile?: any;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const profile = user.investorProfile || user.visionaryProfile;
  const barakahScore = user.visionaryProfile?.barakahScore?.score ?? null;
  const role = user.role === "INVESTOR" ? "Investor" : "Visionary";
  const sector = profile?.sector || profile?.sectors?.[0] || "General";
  const location = user.location || "Location not set";

  return (
    <View className="flex-1 rounded-3xl bg-white shadow-lg overflow-hidden">
      {/* Profile Image */}
      <View className="h-96 bg-emerald-100">
        {user.avatarUrl ? (
          <Image
            source={{ uri: user.avatarUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={["#047857", "#059669"]}
            className="w-full h-full items-center justify-center"
          >
            <Text className="text-6xl text-white font-bold">
              {user.name?.charAt(0).toUpperCase() || "?"}
            </Text>
          </LinearGradient>
        )}
      </View>

      {/* Profile Info */}
      <View className="p-6">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-3xl font-bold text-charcoal">{user.name}</Text>
          {barakahScore !== null && (
            <View className="bg-gold px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-charcoal">
                Barakah: {barakahScore}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2 mb-3">
          <View className="bg-emerald-100 px-3 py-1 rounded-full">
            <Text className="text-sm font-semibold text-emerald-700">{role}</Text>
          </View>
          <View className="bg-emerald-50 px-3 py-1 rounded-full">
            <Text className="text-sm text-emerald-600">{sector}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Text className="text-base text-charcoal/70">📍 {location}</Text>
        </View>

        {user.visionaryProfile?.startupStage && (
          <View className="mt-3 pt-3 border-t border-emerald-100">
            <Text className="text-sm text-charcoal/60">
              Stage: {user.visionaryProfile.startupStage}
            </Text>
          </View>
        )}

        {user.investorProfile?.investmentFocus && (
          <View className="mt-3 pt-3 border-t border-emerald-100">
            <Text className="text-sm text-charcoal/60">
              Focus: {user.investorProfile.investmentFocus}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

