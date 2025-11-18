#!/usr/bin/env tsx

/**
 * E2E API Test Runner
 * Runs all API E2E tests using Supertest
 */

import { spawn } from "child_process";
import path from "path";

const testFiles = [
  "auth.test.ts",
  "user.test.ts",
  "investor.test.ts",
  "visionary.test.ts",
  "matchmaking.test.ts",
  "messaging.test.ts",
];

console.log("🧪 Running API E2E tests...\n");

// Run tests sequentially
async function runTests() {
  for (const testFile of testFiles) {
    const testPath = path.join(__dirname, testFile);
    console.log(`Running ${testFile}...`);
    
    await new Promise((resolve, reject) => {
      const proc = spawn("tsx", [testPath], {
        stdio: "inherit",
        shell: true,
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve(undefined);
        } else {
          reject(new Error(`Test ${testFile} failed with code ${code}`));
        }
      });
    });
  }

  console.log("\n✅ All API E2E tests passed!");
}

runTests().catch((error) => {
  console.error("\n❌ E2E tests failed:", error);
  process.exit(1);
});

