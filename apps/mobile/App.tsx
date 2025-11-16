import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { TRPCProvider } from "./src/lib/trpc";
import { TRPCDebugScreen } from "./src/screens/TRPCDebugScreen";
// import { DashboardScreen } from "./src/screens/DashboardScreen";

export default function App() {
  return (
    <TRPCProvider>
      <SafeAreaView className="flex-1 bg-emerald-50">
        <StatusBar style="dark" />
        <TRPCDebugScreen />
        {/* Switch to DashboardScreen after testing */}
        {/* <DashboardScreen /> */}
      </SafeAreaView>
    </TRPCProvider>
  );
}

