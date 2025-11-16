import { SignIn } from "@clerk/clerk-expo";
import { View } from "react-native";

export default function SignInScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-emerald-50 p-6">
      <SignIn />
    </View>
  );
}

