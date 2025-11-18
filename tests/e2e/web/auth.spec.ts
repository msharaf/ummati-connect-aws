/**
 * E2E tests for web authentication
 */

import { test, expect } from "@playwright/test";

test.describe("Web Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Clerk authentication
    await page.goto("/");
  });

  test("should show landing page for unauthenticated users", async ({ page }) => {
    await page.goto("/");
    
    // Check for landing page content
    await expect(page.locator("h1")).toContainText(/Muslim Investors|Visionary Founders/i);
    
    // Check for login button
    const loginButton = page.locator("text=Login").or(page.locator("text=Sign In"));
    await expect(loginButton).toBeVisible();
  });

  test("should redirect authenticated users to dashboard", async ({ page, context }) => {
    // Mock authenticated session
    await context.addCookies([
      {
        name: "__session",
        value: "mock-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    // TODO: Mock tRPC response for authenticated user
    await page.goto("/");
    
    // Should redirect to dashboard or onboarding
    await expect(page).toHaveURL(/\/dashboard|\/onboarding/, { timeout: 5000 });
  });

  test("should handle logout flow", async ({ page, context }) => {
    // Start authenticated
    await context.addCookies([
      {
        name: "__session",
        value: "mock-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/dashboard");
    
    // Click logout
    const logoutButton = page.locator("text=Logout").or(page.locator("text=Sign Out"));
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }

    // Should redirect to landing page
    await expect(page).toHaveURL("/");
  });
});

