/**
 * E2E tests for onboarding flows
 */

import { test, expect } from "@playwright/test";

test.describe("Founder Onboarding", () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authenticated session
    await context.addCookies([
      {
        name: "__session",
        value: "mock-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Mock user data - new user without role
    await page.route("**/api/trpc/user.me*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            data: {
              role: null,
              onboardingComplete: false,
              profile: null,
            },
          },
        }),
      });
    });
  });

  test("should redirect new user to onboarding", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 5000 });
  });

  test("should show role selection page", async ({ page }) => {
    await page.goto("/onboarding/choose-role");
    
    // Check for role selection options
    await expect(page.locator("text=Investor")).toBeVisible();
    await expect(page.locator("text=Visionary")).toBeVisible();
  });

  test("should complete founder onboarding flow", async ({ page }) => {
    // Select visionary role
    await page.goto("/onboarding/choose-role");
    await page.locator("text=Visionary").or(page.locator("button:has-text('Visionary')")).click();
    
    // Should navigate to visionary setup
    await expect(page).toHaveURL(/\/visionary\/setup/, { timeout: 5000 });
    
    // TODO: Fill out founder profile form
    // This will require mocking tRPC mutations
    
    // Mock successful profile creation
    await page.route("**/api/trpc/visionary.createOrUpdateProfile*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            data: {
              success: true,
            },
          },
        }),
      });
    });

    // Verify form fields exist
    await expect(page.locator('input[name="startupName"]')).toBeVisible();
    await expect(page.locator('select[name="startupStage"]')).toBeVisible();
  });
});

test.describe("Investor Onboarding", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: "__session",
        value: "mock-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("should complete investor onboarding flow", async ({ page }) => {
    await page.goto("/onboarding/choose-role");
    await page.locator("text=Investor").or(page.locator("button:has-text('Investor')")).click();
    
    // Should navigate to investor setup
    await expect(page).toHaveURL(/\/investor\/setup/, { timeout: 5000 });
    
    // Mock halal terms acceptance
    await page.route("**/api/trpc/investor.acceptHalalTerms*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            data: {
              success: true,
            },
          },
        }),
      });
    });

    // Check for halal pledge requirement
    // This would typically redirect to halal-pledge page first
  });
});

