# Ummati Monorepo - E2E Testing Architecture Plan

## Overview

This document outlines the complete End-to-End (E2E) testing strategy for the Ummati monorepo, covering web, mobile, API, and database integration tests.

## Testing Stack

### Framework Selection

1. **Playwright** - Web E2E tests (Next.js app)
   - Cross-browser testing (Chromium, Firefox, WebKit)
   - Excellent debugging tools
   - Built-in fixtures and test isolation
   - Network interception for mocking

2. **Detox** - Mobile E2E tests (Expo/React Native)
   - Native app testing
   - Fast execution on simulators/emulators
   - CI-friendly

3. **Supertest** - API E2E tests (tRPC)
   - Direct HTTP testing
   - Fast execution
   - Full request/response testing

4. **Test Database** - SQLite for E2E tests
   - Fast, isolated test database
   - Easy cleanup between tests
   - Can be in-memory for speed

5. **MSW (Mock Service Worker)** - Network mocking
   - Mock external services (Clerk, Resend, Push notifications)
   - Works across all testing frameworks

## Folder Structure

```
tests/
├── e2e/
│   ├── web/                    # Playwright tests
│   │   ├── auth.spec.ts
│   │   ├── onboarding.spec.ts
│   │   ├── founder-flow.spec.ts
│   │   ├── investor-flow.spec.ts
│   │   ├── matching.spec.ts
│   │   ├── messaging.spec.ts
│   │   └── admin.spec.ts
│   ├── mobile/                 # Detox tests
│   │   ├── auth.e2e.ts
│   │   ├── onboarding.e2e.ts
│   │   ├── founder-flow.e2e.ts
│   │   ├── investor-flow.e2e.ts
│   │   ├── matching.e2e.ts
│   │   └── messaging.e2e.ts
│   ├── api/                    # Supertest tests
│   │   ├── auth.test.ts
│   │   ├── user.test.ts
│   │   ├── investor.test.ts
│   │   ├── visionary.test.ts
│   │   ├── matchmaking.test.ts
│   │   └── messaging.test.ts
│   ├── fixtures/               # Test data
│   │   ├── users.ts
│   │   ├── profiles.ts
│   │   ├── matches.ts
│   │   └── messages.ts
│   ├── utils/                  # Test utilities
│   │   ├── db.ts               # Database helpers
│   │   ├── auth.ts             # Auth helpers
│   │   ├── api-client.ts       # API client helpers
│   │   └── clerk-mock.ts       # Clerk mock helpers
│   └── mocks/                  # Mock implementations
│       ├── clerk.ts            # Clerk mock
│       ├── resend.ts           # Resend email mock
│       ├── push.ts             # Push notification mock
│       └── msw-handlers.ts     # MSW handlers
├── playwright.config.ts        # Playwright config
├── detox.config.js             # Detox config
└── setup/                      # Test setup scripts
    ├── setup-db.ts             # Database setup
    ├── setup-env.ts            # Environment setup
    └── teardown.ts             # Cleanup
```

## Test Database Setup

### Strategy
- Use SQLite for E2E tests (fast, isolated)
- Create separate test schema file
- Auto-seed test data before test suites
- Clean between test files (not between tests for speed)
- Use transactions where possible for isolation

### Environment Variables
- `DATABASE_URL_TEST` - SQLite test database path
- Separate `.env.test` files for each package

## Mock Strategy

### Clerk Authentication
- Mock Clerk JWT token generation
- Mock session validation
- Test users with known clerkIds
- No real Clerk API calls during tests

### External Services
- **Resend (Email)**: Mock with MSW
- **Push Notifications**: Mock Expo push token service
- **Database**: Use SQLite test DB (no external DB needed)

## Test Flows Coverage

### 1. Authentication E2E Tests

#### Web (Playwright)
- Landing page loads
- Login button opens Clerk modal
- Successful login redirects correctly
- New user → onboarding flow
- Existing user → dashboard
- Logout functionality
- Session persistence

#### Mobile (Detox)
- Splash screen → login
- Clerk login flow
- Session persistence
- Logout and re-login

#### API (Supertest)
- Unauthenticated requests fail
- JWT token validation
- User context injection
- Clerk token parsing

### 2. Founder Onboarding E2E Tests

- Complete registration questionnaire
- Profile data saved correctly
- Dashboard shows correct state
- Swipe interface loads
- Swipe actions create records
- Pagination works
- Filtering works

### 3. Investor Onboarding E2E Tests

- Complete investor setup
- Halal terms acceptance
- Ticket size validation
- Industry preferences saved
- Browse visionaries
- Filter functionality
- Swipe functionality

### 4. Matching E2E Tests

- Founder likes investor
- Investor likes founder
- Match created when mutual
- Match list updates
- Match cards display correctly
- Notifications triggered (mocked)
- Real-time updates (polling)

### 5. Messaging E2E Tests

- Open matched chat
- Send message → saved in DB
- Messages appear in UI
- Cross-platform messaging
- Unread badge updates
- Notification triggered

### 6. Admin Panel E2E Tests

- Admin login
- View all users
- View flagged accounts
- Delete user
- Edit user data
- RBAC protection

### 7. Notifications E2E Tests

- Push token registration
- Match notification triggered
- Message notification triggered
- Email fallback
- All providers mocked

### 8. Cross-Platform E2E Tests

- Login on web → profile visible on mobile
- Swipe on mobile → match visible on web
- Message on mobile → appears on web
- Profile updates sync

## Test Execution Strategy

### Commands
- `pnpm test:e2e` - Run all E2E tests
- `pnpm test:e2e:web` - Run Playwright tests
- `pnpm test:e2e:mobile` - Run Detox tests
- `pnpm test:e2e:api` - Run API tests
- `pnpm test:e2e:web:ui` - Run Playwright with UI
- `pnpm test:e2e:mobile:debug` - Run Detox in debug mode

### CI/CD Integration
- Parallel execution where possible
- Test database cleanup in CI
- Artifact collection (screenshots, videos)
- Test result reporting

## Deterministic Test Behavior

### Principles
- No time-based assertions (use events/waits)
- Deterministic test data
- Isolated test execution
- No shared state between tests
- Proper cleanup between test files

### Best Practices
- Use Playwright's auto-waiting
- Use Detox's synchronization
- Use database transactions for isolation
- Mock external services completely
- Use test fixtures for data

## Performance Considerations

- Use in-memory SQLite where possible
- Parallel test execution
- Optimize test database seeding
- Reuse browser contexts in Playwright
- Cache authentication sessions

## Next Steps

1. Install dependencies (Playwright, Detox, Supertest, MSW)
2. Set up test database configuration
3. Create test utilities and fixtures
4. Implement mocks for external services
5. Write E2E tests for each flow
6. Set up CI/CD integration
7. Document test execution and debugging

## Dependencies to Add

### Root package.json
- `@playwright/test`
- `detox`
- `supertest`
- `msw`
- `better-sqlite3` (for test DB)

### Web package
- `@playwright/test` (dev)

### Mobile package
- `detox` (dev)
- `jest-circus` (for Detox)

### API package
- `supertest` (dev)

### DB package
- `better-sqlite3` (dev)

