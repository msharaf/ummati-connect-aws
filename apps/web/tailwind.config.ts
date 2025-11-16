import type { Config } from "tailwindcss";
import sharedPreset from "@ummati/config/tailwind";

const config: Config = {
  presets: [sharedPreset],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ]
};

export default config;

