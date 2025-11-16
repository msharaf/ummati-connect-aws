import { View, Text } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate
} from "react-native-reanimated";
import { ProfileCard } from "./ProfileCard";
import type { User } from "@ummati/db";

const SWIPE_THRESHOLD = 120;
const ROTATION_MULTIPLIER = 0.1;

interface CardStackProps {
  profiles: (User & {
    investorProfile?: any;
    visionaryProfile?: any;
  })[];
  onSwipeLeft: (userId: string) => void;
  onSwipeRight: (userId: string) => void;
}

export function CardStack({ profiles, onSwipeLeft, onSwipeRight }: CardStackProps) {
  if (profiles.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <View className="bg-white rounded-3xl p-8 items-center shadow-lg">
          <Text className="text-2xl font-bold text-charcoal mb-2">
            No more profiles
          </Text>
          <Text className="text-charcoal/70 text-center">
            Check back later for new matches!
          </Text>
        </View>
      </View>
    );
  }

  const topCard = profiles[0];
  const secondCard = profiles[1];

  return (
    <View className="flex-1 items-center justify-center">
      {/* Second card (background) */}
      {secondCard && (
        <View
          className="absolute w-11/12"
          style={{
            transform: [{ scale: 0.95 }],
            zIndex: 0
          }}
        >
          <ProfileCard user={secondCard} />
        </View>
      )}

      {/* Top card (swipeable) */}
      {topCard && (
        <SwipeableCard
          user={topCard}
          onSwipeLeft={() => onSwipeLeft(topCard.id)}
          onSwipeRight={() => onSwipeRight(topCard.id)}
        />
      )}
    </View>
  );
}

interface SwipeableCardProps {
  user: User & {
    investorProfile?: any;
    visionaryProfile?: any;
  };
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

function SwipeableCard({ user, onSwipeLeft, onSwipeRight }: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const absX = Math.abs(event.translationX);
      const absY = Math.abs(event.translationY);

      if (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD) {
        // Swipe detected
        if (absX > absY) {
          // Horizontal swipe
          if (event.translationX > 0) {
            // Swipe right (LIKE)
            translateX.value = withSpring(1000, {}, () => {
              runOnJS(onSwipeRight)();
            });
          } else {
            // Swipe left (DISLIKE)
            translateX.value = withSpring(-1000, {}, () => {
              runOnJS(onSwipeLeft)();
            });
          }
        } else {
          // Vertical swipe - reset
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
        }
      } else {
        // Not enough movement - spring back
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      [-15, 0, 15],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` }
      ]
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const dislikeOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        className="absolute w-11/12"
        style={[animatedStyle, { zIndex: 1 }]}
      >
        <ProfileCard user={user} />
        
        {/* Like overlay */}
        <Animated.View
          className="absolute inset-0 items-center justify-center rounded-3xl border-4 border-emerald-500 bg-emerald-500/20"
          style={likeOverlayStyle}
          pointerEvents="none"
        >
          <Text className="text-4xl font-bold text-emerald-600">LIKE</Text>
        </Animated.View>

        {/* Dislike overlay */}
        <Animated.View
          className="absolute inset-0 items-center justify-center rounded-3xl border-4 border-red-500 bg-red-500/20"
          style={dislikeOverlayStyle}
          pointerEvents="none"
        >
          <Text className="text-4xl font-bold text-red-600">NOPE</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

