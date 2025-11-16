import { View, Text, Modal, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { User } from "@ummati/db";

interface MatchModalProps {
  visible: boolean;
  currentUser: User | null;
  matchedUser: User | null;
  onClose: () => void;
}

export function MatchModal({
  visible,
  currentUser,
  matchedUser,
  onClose
}: MatchModalProps) {
  if (!matchedUser) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-white rounded-3xl p-8 items-center w-full max-w-sm shadow-2xl">
          {/* Islamic greeting */}
          <Text className="text-3xl font-bold text-emerald-700 mb-2">
            MashaAllah!
          </Text>
          <Text className="text-2xl font-semibold text-charcoal mb-6">
            It's a Match!
          </Text>

          {/* Profile photos */}
          <View className="flex-row items-center justify-center gap-4 mb-6">
            {/* Current user */}
            <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500">
              {currentUser?.avatarUrl ? (
                <Image
                  source={{ uri: currentUser.avatarUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={["#047857", "#059669"]}
                  className="w-full h-full items-center justify-center"
                >
                  <Text className="text-3xl text-white font-bold">
                    {(currentUser?.name || currentUser?.fullName)
                      ?.charAt(0)
                      .toUpperCase() || "?"}
                  </Text>
                </LinearGradient>
              )}
            </View>

            {/* Heart icon */}
            <Text className="text-4xl">💚</Text>

            {/* Matched user */}
            <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-gold">
              {matchedUser.avatarUrl ? (
                <Image
                  source={{ uri: matchedUser.avatarUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={["#d4a017", "#f4c430"]}
                  className="w-full h-full items-center justify-center"
                >
                  <Text className="text-3xl text-white font-bold">
                    {matchedUser.name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </LinearGradient>
              )}
            </View>
          </View>

          {/* Names */}
          <Text className="text-lg font-semibold text-charcoal mb-1">
            {currentUser?.name || currentUser?.fullName || "You"} &{" "}
            {matchedUser.name || "Match"}
          </Text>
          <Text className="text-sm text-charcoal/70 mb-6 text-center">
            You both liked each other. Start a conversation!
          </Text>

          {/* Continue button */}
          <TouchableOpacity
            onPress={onClose}
            className="w-full bg-emerald-600 rounded-full py-4 items-center shadow-lg"
          >
            <Text className="text-white font-bold text-lg">Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

