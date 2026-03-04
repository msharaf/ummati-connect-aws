import { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { trpc } from "../../lib/trpc";
import { CardStack } from "./CardStack";
import { MatchModal } from "./MatchModal";

export function SwipeScreen() {
  const { userId } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);

  const { data: userData, isLoading: isLoadingUser } = trpc.user.me.useQuery(
    undefined,
    { enabled: Boolean(userId) }
  );
  const currentUser = userData?.profile;
  const onboardingComplete = userData?.onboardingComplete ?? false;

  const { data: recommendationsData, isLoading, refetch } = trpc.matchmaking.getRecommendations.useQuery(
    undefined,
    { 
      enabled: Boolean(userId) && onboardingComplete,
      retry: false // Don't retry if onboarding incomplete
    }
  );

  const swipeMutation = trpc.matchmaking.swipe.useMutation({
    onSuccess: (result: { matchCreated?: boolean }) => {
      if (result.matchCreated) {
        // Show match modal
        const swipedUser = profiles[0];
        if (swipedUser) {
          setMatchedUser(swipedUser);
          setShowMatchModal(true);
        }
      }
      // Remove the swiped card from the stack
      setProfiles((prev) => prev.slice(1));
    },
    onError: (error: unknown) => {
      console.error("Swipe error:", error);
      // Still remove the card on error to prevent UI blocking
      setProfiles((prev) => prev.slice(1));
    }
  });

  useEffect(() => {
    if (recommendationsData?.recommendations) {
      setProfiles(recommendationsData.recommendations);
    }
  }, [recommendationsData]);

  const handleSwipeLeft = (userId: string) => {
    swipeMutation.mutate({
      targetUserId: userId,
      direction: "DISLIKE"
    });
  };

  const handleSwipeRight = (userId: string) => {
    swipeMutation.mutate({
      targetUserId: userId,
      direction: "LIKE"
    });
  };

  const handleLikeButton = () => {
    if (profiles.length > 0) {
      handleSwipeRight(profiles[0].id);
    }
  };

  const handleDislikeButton = () => {
    if (profiles.length > 0) {
      handleSwipeLeft(profiles[0].id);
    }
  };

  if (isLoadingUser || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50">
        <ActivityIndicator size="large" color="#047857" />
        <Text className="mt-4 text-charcoal/70">Loading profiles...</Text>
      </View>
    );
  }

  // Show friendly message if onboarding not complete
  if (!onboardingComplete) {
    return (
      <View className="flex-1 items-center justify-center bg-emerald-50 p-8">
        <Text className="text-6xl mb-4">👋</Text>
        <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Complete Your Profile
        </Text>
        <Text className="text-gray-600 text-center">
          Please complete your profile setup to start discovering matches
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-emerald-50">
      <CardStack
        profiles={profiles}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
      />

      {/* Action buttons */}
      {profiles.length > 0 && (
        <View className="absolute bottom-8 left-0 right-0 flex-row items-center justify-center gap-6 px-6">
          <TouchableOpacity
            onPress={handleDislikeButton}
            className="w-16 h-16 rounded-full bg-white items-center justify-center shadow-lg border-2 border-red-200"
          >
            <Text className="text-3xl">✕</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLikeButton}
            className="w-20 h-20 rounded-full bg-emerald-600 items-center justify-center shadow-lg"
          >
            <Text className="text-4xl">💚</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Match Modal */}
      <MatchModal
        visible={showMatchModal}
        currentUser={currentUser as any}
        matchedUser={matchedUser}
        onClose={() => {
          setShowMatchModal(false);
          setMatchedUser(null);
        }}
      />
    </View>
  );
}

