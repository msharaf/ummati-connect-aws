# E2E Testing Guide for Ummati Monorepo

## Overview

This guide covers the complete End-to-End (E2E) testing setup for the Ummati monorepo, including web, mobile, and API testing.

## Architecture

The E2E testing suite uses:
- **Playwright** for web application testing
- **Detox** for mobile (Expo/React Native) testing  
- **Supertest** for API integration testing
- **SQLite** for isolated test database
- **MSW (Mock Service Worker)** for mocking external services

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

This will install all E2E testing dependencies including Playwright, Detox, Supertest, and related packages.

### 2. Set Up Test Database

```bash
# Generate Prisma client for test schema (cross-platform)
pnpm prisma:generate:test

# Or directly:
pnpm --filter db generate:test

# Run test migrations
pnpm --filter db migrate:test
```

**Note**: These scripts use `cross-env` for Windows compatibility. The scripts automatically handle environment variables correctly on all platforms.

### 3. Set Up Environment Variables

Create `.env.test` files in each package:

**`packages/api/.env.test`**:
```
DATABASE_URL=file:../db/test.db
CLERK_SECRET_KEY=test-secret-key
NODE_ENV=test
```

**`packages/db/.env.test`**:
```
DATABASE_URL=file:./test.db
```

**`apps/web/.env.test`**:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
CLERK_PUBLISHABLE_KEY=test-publishable-key
NODE_ENV=test
```

**`apps/mobile/.env.test`**:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=test-publishable-key
```

## Running Tests

### Run All E2E Tests

```bash
pnpm test:e2e
```

### Run Specific Test Suites

```bash
# Web E2E tests only
pnpm test:e2e:web

# Mobile E2E tests only
pnpm test:e2e:mobile

# API E2E tests only
pnpm test:e2e:api
```

### Web Testing with Playwright

```bash
# Run in headed mode (see browser)
pnpm --filter web test:e2e --headed

# Run with UI mode (interactive)
pnpm --filter web test:e2e:ui

# Debug mode
pnpm --filter web test:e2e:debug

# Run specific test file
pnpm --filter web test:e2e tests/e2e/web/auth.spec.ts
```

### Mobile Testing with Detox

```bash
# Build app first (required)
pnpm --filter mobile test:e2e:build

# Run tests
pnpm --filter mobile test:e2e

# Debug mode
pnpm --filter mobile test:e2e:debug
```

## Test Structure

```
tests/e2e/
├── web/                    # Playwright tests
│   ├── auth.spec.ts       # Authentication tests
│   ├── onboarding.spec.ts # Onboarding flow tests
│   ├── matching.spec.ts   # Matching functionality tests
│   └── ...
├── mobile/                 # Detox tests
│   ├── auth.e2e.ts
│   └── ...
├── api/                    # Supertest tests
│   ├── auth.test.ts
│   ├── user.test.ts
│   ├── investor.test.ts
│   ├── visionary.test.ts
│   ├── matchmaking.test.ts
│   └── messaging.test.ts
├── fixtures/               # Test data
│   ├── users.ts           # User fixtures
│   └── matches.ts         # Match fixtures
├── utils/                  # Test utilities
│   ├── db.ts              # Database helpers
│   ├── auth.ts            # Auth helpers
│   └── api-client.ts      # API client helpers
└── mocks/                  # Mock implementations
    ├── clerk.ts           # Clerk mocks
    ├── resend.ts          # Email mocks
    ├── push.ts            # Push notification mocks
    └── msw-handlers.ts    # MSW handlers
```

## Writing Tests

### Web Tests (Playwright)

```typescript
import { test, expect } from "@playwright/test";

test("should login successfully", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Sign In");
  
  // Mock Clerk authentication
  await page.route("**/api/trpc/user.me*", (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        result: { data: { role: "VISIONARY", onboardingComplete: true } }
      })
    });
  });
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL("/dashboard");
});
```

### API Tests (Supertest)

```typescript
import { describe, it, expect } from "vitest";
import { createTestClient, trpcRequest } from "../utils/api-client";
import { TEST_USERS } from "../utils/auth";

describe("User API", () => {
  const client = createTestClient();

  it("should return user profile", async () => {
    const response = await trpcRequest(
      client,
      TEST_USERS.founder.clerkId,
      TEST_USERS.founder.email,
      "user.me",
      {}
    );

    expect(response.status).toBe(200);
    expect(response.body.result.data.role).toBe("VISIONARY");
  });
});
```

### Mobile Tests (Detox)

```typescript
describe("Mobile Auth", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("should show login screen", async () => {
    await expect(element(by.text("Sign In"))).toBeVisible();
  });
});
```

## Test Data Management

### Using Fixtures

```typescript
import { createTestFounderWithProfile } from "../fixtures/users";

const { user, profile } = await createTestFounderWithProfile(prisma);
```

### Database Cleanup

Tests automatically clean the database between test files. Use `beforeAll` and `afterAll` to set up and tear down:

```typescript
beforeAll(async () => {
  await initTestDatabase();
});

afterAll(async () => {
  await cleanTestDatabase();
  await closeTestDatabase();
});
```

## Mocking External Services

### Clerk Authentication

Tests use mock JWT tokens instead of real Clerk authentication:

```typescript
import { getAuthHeader } from "../utils/auth";

const authHeader = getAuthHeader(userId, email);
```

### MSW Handlers

MSW automatically mocks external API calls in Playwright tests. See `tests/e2e/mocks/msw-handlers.ts`.

## CI/CD Integration

E2E tests run automatically in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: |
    pnpm install
    pnpm prisma:generate:test
    pnpm test:e2e
```

## Debugging Tests

### Playwright Debug

1. Run with `--debug` flag
2. Use Playwright Inspector
3. Add `await page.pause()` in test code

### Detox Debug

1. Run with `--loglevel verbose`
2. Use React Native Debugger
3. Check simulator/emulator logs

### API Test Debug

1. Add `console.log()` statements
2. Use debugger in test code
3. Check database state manually

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Mocks**: Mock external services, not internal logic
4. **Deterministic**: Avoid time-based assertions
5. **Readable**: Use descriptive test names and structure

## Troubleshooting

### Test Database Issues

```bash
# Reset test database
rm packages/db/test.db
pnpm prisma:generate:test
pnpm --filter db migrate:test
```

### Playwright Issues

```bash
# Install browsers
npx playwright install

# Show trace
npx playwright show-trace trace.zip
```

### Detox Issues

```bash
# Rebuild app
pnpm --filter mobile test:e2e:build

# Clean build cache
cd apps/mobile/ios && xcodebuild clean
```

## Test Coverage

Current E2E test coverage:

- ✅ Authentication (web, mobile, API)
- ✅ User onboarding (founder & investor)
- ✅ Matching flows
- ✅ Messaging (API layer)
- ✅ Investor browsing
- ✅ Visionary profiles
- ⚠️ Admin panel (needs implementation)
- ⚠️ Notifications (partial)
- ⚠️ Cross-platform flows (partial)

## Next Steps

1. Complete admin panel E2E tests
2. Add notification E2E tests
3. Expand cross-platform tests
4. Add visual regression testing
5. Improve test performance with parallelization

