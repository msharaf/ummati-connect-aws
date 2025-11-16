import { SignUp } from "@clerk/clerk-expo";
import { View } from "react-native";

export default function SignUpScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-emerald-50 p-6">
      <SignUp />
    </View>
  );
}

