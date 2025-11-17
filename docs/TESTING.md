# Testing Guide

This document describes the testing setup and how to run tests for the Ummati monorepo.

## Test Setup

The project uses [Vitest](https://vitest.dev/) for unit testing across all packages.

### Test Structure

```
packages/api/
  src/
    *.test.ts          # API router and utility tests
    routers/
      *.test.ts        # Router-specific tests

apps/web/
  src/
    *.test.tsx         # Component and utility tests
  components/
    *.test.tsx         # Component tests
  lib/
    server/
      *.test.ts        # Server utility tests
```

## Running Tests

### Run All Tests

From the root directory:

```bash
pnpm test
```

### Run Tests for Specific Package

**API Package:**
```bash
cd packages/api
pnpm test
```

**Web App:**
```bash
cd apps/web
pnpm test
```

### Watch Mode

Run tests in watch mode for development:

```bash
# API package
cd packages/api
pnpm test:watch

# Web app
cd apps/web
pnpm test:watch
```

### Coverage Reports

Generate coverage reports:

```bash
# API package
cd packages/api
pnpm test:coverage

# Web app
cd apps/web
pnpm test:coverage
```

Coverage reports will be generated in `coverage/` directory.

## Test Files

### API Package Tests

- **`context.test.ts`** - Tests for tRPC context creation and authentication
- **`trpc.test.ts`** - Tests for tRPC setup, public and protected procedures
- **`routers/user.test.ts`** - Tests for user router (me query, setRole mutation)
- **`routers/auth.test.ts`** - Tests for auth router (ping, me queries)
- **`routers/matchmaking.test.ts`** - Tests for matchmaking router
- **`root.test.ts`** - Tests for root router structure
- **`lib/user.test.ts`** - Tests for user profile utility functions

### Web App Tests

- **`components/DashboardGuard.test.tsx`** - Tests for dashboard guard component
- **`components/navbar.test.tsx`** - Tests for navbar component
- **`lib/server/user.test.ts`** - Tests for server-side user utilities
- **`src/lib/trpc.test.tsx`** - Tests for tRPC client setup

## Writing Tests

### Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("ComponentName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should do something", () => {
    // Test implementation
  });
});
```

### Mocking

**Mocking Prisma:**
```typescript
vi.mock("@ummati/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));
```

**Mocking Clerk:**
```typescript
vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(),
  useAuth: vi.fn()
}));
```

**Mocking Next.js Router:**
```typescript
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  })
}));
```

## Test Coverage Goals

- **API Routers**: 80%+ coverage
- **Components**: 70%+ coverage
- **Utilities**: 90%+ coverage

## Continuous Integration

Tests should be run in CI/CD pipeline before deployment. Add to your CI config:

```yaml
- name: Run tests
  run: pnpm test

- name: Generate coverage
  run: pnpm test:coverage
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Use Descriptive Test Names**: Test names should clearly describe what is being tested
3. **Mock External Dependencies**: Mock database, API calls, and external services
4. **Test Edge Cases**: Include tests for error conditions and edge cases
5. **Keep Tests Fast**: Unit tests should run quickly (< 1 second per test)
6. **Isolate Tests**: Each test should be independent and not rely on other tests

## Troubleshooting

### Tests Failing Due to Missing Mocks

If tests fail with "Cannot find module" errors, ensure all dependencies are properly mocked in `vitest.setup.ts` or in the test file.

### TypeScript Errors in Tests

Ensure test files use `.test.ts` or `.test.tsx` extensions and are included in `tsconfig.json`.

### Coverage Not Generating

Make sure `vitest.config.ts` has coverage configuration and the `@vitest/coverage-v8` package is installed.

