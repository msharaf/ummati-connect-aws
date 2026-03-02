const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Force single React instance to fix "Invalid hook call" / "useMemo of null"
// when NativeWind or other deps resolve to a different React copy in monorepo
config.resolver.extraNodeModules = {
  react: path.resolve(__dirname, "node_modules/react"),
  "react-native": path.resolve(__dirname, "node_modules/react-native"),
};

module.exports = config;

