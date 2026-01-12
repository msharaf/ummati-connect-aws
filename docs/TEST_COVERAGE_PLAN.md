# Test Coverage Plan

## Status Summary

### ✅ Completed Tests
- **visionary.test.ts** - Added comprehensive tests for `verifyHalalCompliance` mutation (critical business logic)
  - Tests for haram category rejection
  - Tests for interest/riba detection
  - Tests for grey area flagging
  - Tests for halal approval
  - Tests for error cases

### 📋 Existing Tests
- `auth.test.ts` ✓
- `matchmaking.test.ts` ✓
- `user.test.ts` ✓
- `context.test.ts` ✓
- `trpc.test.ts` ✓
- `server.test.ts` ✓
- `lib/user.test.ts` ✓
- Component tests: `DashboardGuard.test.tsx`, `navbar.test.tsx`

### 🎯 Priority: Critical Routers Needing Tests

#### High Priority (Business-Critical)
1. **admin.test.ts** - Security-critical, admin operations
   - `checkAdmin`, `getAllUsers`, `getUserById`
   - `banUnbanUser`, `overrideHalalCategory`, `approveRejectUser`

2. **visionary.test.ts** - ✅ COMPLETED (verifyHalalCompliance)
   - Still needed: `saveProfileDetails`, `submitHalalFocus`, `getHalalFocusQuestionnaire`

3. **investorProfile.test.ts** - Core investor functionality
   - `getMyInvestorProfile`, `submitHalalFocus`, `saveProfileDetails`

4. **matchmaking.test.ts** - ✅ EXISTS but may need expansion
   - Current tests are basic; may need more edge cases

#### Medium Priority
5. **investor.test.ts** - Investor dashboard and browsing
6. **visionaryDashboard.test.ts** - Dashboard stats and metrics
7. **messages.test.ts** - Messaging functionality

#### Lower Priority
8. **notifications.test.ts** - Notification system

## Testing Principles Applied

Following `.cursorrules` principles:
- ✅ **KISS**: Simple, focused test cases
- ✅ **YAGNI**: Test behavior, not implementation
- ✅ **Readability**: Clear test names and structure
- ✅ **Small functions**: Each test is single-purpose
- ✅ **Explicit types**: Full TypeScript typing
- ✅ **Boundary testing**: Input validation and error cases

## Next Steps

1. Add tests for `admin.test.ts` (security-critical)
2. Expand `visionary.test.ts` for other endpoints
3. Add `investorProfile.test.ts`
4. Review existing tests for edge cases
5. Add integration tests for API/DB boundaries where needed

## Commands

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm --filter @ummati/api test visionary.test.ts

# Run with coverage
pnpm --filter @ummati/api test:coverage
```
