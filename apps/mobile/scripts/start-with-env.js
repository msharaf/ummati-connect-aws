/**
 * Loads .env and starts Expo with REACT_NATIVE_PACKAGER_HOSTNAME set.
 * Fixes Metro advertising the wrong IP (e.g. virtual adapter) on physical devices.
 */
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Load .env manually (avoids dotenv-cli dependency)
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (key && value) process.env[key] = value;
      }
    }
  }
}

const cwd = path.join(__dirname, "..");
// Use --offline to skip Expo API version check when network fetch fails (firewall, proxy, etc.)
// Set EXPO_ONLINE=1 to force online mode and enable version validation
const useOffline = process.env.EXPO_ONLINE !== "1" && process.env.EXPO_ONLINE !== "true";
const args = ["expo", "start", ...(useOffline ? ["--offline"] : [])];

const result = spawnSync("npx", args, {
  stdio: "inherit",
  env: process.env,
  cwd,
  shell: true, // Required for npx on Windows
});
if (result.error) {
  console.error("Failed to start Expo:", result.error.message);
  process.exit(1);
}
process.exit(result.status !== null ? result.status : 1);
