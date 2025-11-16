import { LinearGradient } from "expo-linear-gradient";
import { View, Text } from "react-native";

type ProfileType = "INVESTOR" | "VISIONARY";

type Props = {
  type: ProfileType;
  name: string;
  location: string;
  industries: string[];
  barakahScore?: number | null;
};

const gradients: Record<ProfileType, [string, string]> = {
  INVESTOR: ["#ecfdf5", "#d1fae5"],
  VISIONARY: ["#fffbeb", "#fde68a"]
};

export function ProfileCard({
  type,
  name,
  location,
  industries,
  barakahScore
}: Props) {
  return (
    <LinearGradient
      colors={gradients[type]}
      className="rounded-3xl p-6 shadow"
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-700">
          {type.toLowerCase()}
        </Text>
        {barakahScore !== undefined && barakahScore !== null && (
          <Text className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-700">
            Barakah {barakahScore}
          </Text>
        )}
      </View>
      <Text className="mt-5 text-xl font-semibold text-charcoal">{name}</Text>
      <Text className="mt-1 text-sm text-charcoal/70">{location}</Text>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {industries.map((industry) => (
          <Text
            key={industry}
            className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-emerald-700"
          >
            {industry}
          </Text>
        ))}
      </View>
    </LinearGradient>
  );
}

