import { View, Text } from "react-native";

export default function ProfileTab() {
  return (
    <View className="flex-1 items-center justify-center bg-emerald-50 p-8">
      <Text className="text-2xl font-bold text-charcoal mb-2">Profile</Text>
      <Text className="text-charcoal/70 text-center">
        Your profile settings will appear here
      </Text>
    </View>
  );
}

