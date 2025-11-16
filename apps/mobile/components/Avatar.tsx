import { Image, View, Text } from "react-native";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 72
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const sizePx = sizeMap[size];
  const initials = getInitials(name);

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        className={`rounded-full ${className}`}
        style={{ width: sizePx, height: sizePx }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      className={`rounded-full bg-emerald-600 justify-center items-center ${className}`}
      style={{ width: sizePx, height: sizePx }}
    >
      <Text className="text-white font-bold" style={{ fontSize: sizePx * 0.4 }}>
        {initials}
      </Text>
    </View>
  );
}

