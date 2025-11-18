/**
 * E2E tests for matching flows
 */

import { test, expect } from "@playwright/test";

test.describe("Matching Flow", () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authenticated founder session
    await context.addCookies([
      {
        name: "__session",
        value: "mock-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Mock authenticated user with complete profile
    await page.route("**/api/trpc/user.me*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            data: {
              role: "VISIONARY",
              onboardingComplete: true,
              profile: {
                id: "user_123",
                email: "founder@test.com",
                name: "Test Founder",
              },
            },
          },
        }),
      });
    });
  });

  test("should show dashboard with recommendations", async ({ page }) => {
    // Mock recommendations
    await page.route("**/api/trpc/matchmaking.getRecommendations*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            data: {
              recommendations: [
                {
                  id: "investor_1",
                  type: "INVESTOR",
                  fullName: "Test Investor",
                  location: "San Francisco, CA",
                  industries: ["Technology", "Fintech"],
                },
              ],
              message: "",
            },
          },
        }),
      });
    });

    await page.goto("/dashboard");
    
    // Check for recommendations section
    await expect(page.locator("text=Recommended")).toBeVisible({ timeout: 5000 });
    
    // Should show at least one recommendation card
    const recommendationCards = page.locator('[data-testid="recommendation-card"]').or(
      page.locator(".grid >> text=Test Investor")
    );
    await expect(recommendationCards.first()).toBeVisible();
  });

  test("should show matches section", async ({ page }) => {
    // Mock matches
    await page.route("**/api/trpc/matchmaking.getMatches*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            data: {
              matches: [
                {
                  id: "match_1",
                  investorId: "investor_1",
                  visionary: {
                    fullName: "Test Founder",
                    industries: ["Technology"],
                  },
                  status: "ACTIVE",
                },
              ],
              message: "",
            },
          },
        }),
      });
    });

    await page.goto("/dashboard");
    
    // Check for matches section
    await expect(page.locator("text=Matches")).toBeVisible({ timeout: 5000 });
  });

  test("should handle empty state for recommendations", async ({ page }) => {
    // Mock empty recommendations
    await page.route("**/api/trpc/matchmaking.getRecommendations*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            data: {
              recommendations: [],
              message: "No recommendations yet. Complete your profile and check again soon.",
            },
          },
        }),
      });
    });

    await page.goto("/dashboard");
    
    // Should show empty state message
    await expect(page.locator("text=No recommendations yet")).toBeVisible({ timeout: 5000 });
  });
});

