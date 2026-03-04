import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "**/*.config.*",
        "**/dist/",
        "**/build/",
        "**/*.test.ts",
        "**/*.spec.ts"
      ]
    },
  },
  resolve: {
    alias: {
      "@ummati/api": path.resolve(__dirname, "./src"),
      "@ummati/db": path.resolve(__dirname, "../db/src"),
    },
    conditions: ["node", "default"],
  },
  // Use Node.js loader for CommonJS compatibility
  esbuild: {
    target: "node18",
    format: "esm",
  },
});

