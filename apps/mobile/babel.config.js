module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "expo-router/babel",
      [
        "nativewind/babel",
        {
          tailwindConfig: "./tailwind.config.js"
        }
      ],
      "react-native-reanimated/plugin"
    ]
  };
};

