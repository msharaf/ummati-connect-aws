const preset = require("@ummati/config/nativewind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"]
};

