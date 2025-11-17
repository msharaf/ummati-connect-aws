# Testing Overview

This monorepo has comprehensive unit test coverage using Vitest.

## Quick Start

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## Test Coverage

### API Package (`packages/api`)

✅ **Context Tests** (`context.test.ts`)
- Context creation with userId
- Token verification
- Error handling

✅ **tRPC Setup Tests** (`trpc.test.ts`)
- Router creation
- Public procedures
- Protected procedures

✅ **User Router Tests** (`routers/user.test.ts`)
- `me` query with various user states
- `setRole` mutation
- Onboarding completion logic
- Error cases

✅ **Auth Router Tests** (`routers/auth.test.ts`)
- `ping` query
- `me` query

✅ **Matchmaking Router Tests** (`routers/matchmaking.test.ts`)
- `getRecommendations` query
- `getMatches` query

✅ **Root Router Tests** (`root.test.ts`)
- Router structure verification

✅ **User Utility Tests** (`lib/user.test.ts`)
- Profile fetching
- Onboarding status calculation

### Web App (`apps/web`)

✅ **Dashboard Guard Tests** (`components/DashboardGuard.test.tsx`)
- Loading states
- Authentication redirects
- Onboarding redirects
- Content rendering

✅ **Navbar Tests** (`components/navbar.test.tsx`)
- Loading states
- Login button display
- Dashboard/Logout buttons display
- Navigation links

✅ **Server Utilities Tests** (`lib/server/user.test.ts`)
- User profile fetching
- Onboarding status calculation
- Error handling

✅ **tRPC Client Tests** (`src/lib/trpc.test.tsx`)
- Provider rendering
- Client setup

## Running Tests

### Individual Packages

```bash
# API tests
cd packages/api
pnpm test

# Web app tests
cd apps/web
pnpm test
```

### All Tests

```bash
# From root
pnpm test
```

### Watch Mode

```bash
# API tests in watch mode
cd packages/api
pnpm test:watch

# Web app tests in watch mode
cd apps/web
pnpm test:watch
```

### Coverage

```bash
# API coverage
cd packages/api
pnpm test:coverage

# Web app coverage
cd apps/web
pnpm test:coverage
```

## Test Statistics

- **Total Test Files**: 10+
- **Test Cases**: 50+
- **Coverage Target**: 80%+

## Adding New Tests

1. Create test file next to source file: `*.test.ts` or `*.test.tsx`
2. Follow existing test patterns
3. Mock external dependencies (Prisma, Clerk, Next.js)
4. Test both success and error cases
5. Run tests to verify: `pnpm test`

## CI/CD Integration

Tests run automatically in CI/CD pipeline. All tests must pass before deployment.

For more details, see [docs/TESTING.md](./docs/TESTING.md).

