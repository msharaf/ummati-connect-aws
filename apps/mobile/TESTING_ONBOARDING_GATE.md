# Testing the Investor Onboarding Hard Gate

## Quick Test Guide

### Prerequisites
```bash
# Ensure API server is running
cd packages/api
pnpm dev

# Ensure mobile app is running
cd apps/mobile
pnpm start
```

## Test Scenario 1: New Investor Flow ✅

### Steps
1. **Sign Out** (if already signed in)
   - Tap logout button in header

2. **Sign Up as New User**
   - Welcome screen → "Get Started"
   - Create new account with Clerk

3. **Choose Investor Role**
   - Select "I am an Investor"
   - Should redirect to `investor/setup`

4. **Verify Tab Bar**
   - ✅ Should see: Browse tab only
   - ❌ Should NOT see: Swipe, Matches, Messages, Profile

5. **Attempt Manual Navigation** (optional)
   - Try to access protected route via deep link
   - Should redirect back to setup

6. **Complete Onboarding**
   - Fill in:
     - Minimum Ticket Size: 10000
     - Maximum Ticket Size: 100000
     - Select 2-3 sectors
     - Geographic Focus: "MENA region"
     - Investment Thesis: (write a few sentences)
   - Tap "Save & Continue"

7. **Verify Full Access**
   - ✅ Should redirect to Swipe screen
   - ✅ All tabs visible: Swipe, Matches, Messages, Profile, Browse
   - ✅ Can navigate freely

### Expected Behavior
- **Before onboarding**: Only Browse accessible, hard redirect from protected screens
- **After onboarding**: Full app access

---

## Test Scenario 2: Incomplete Investor Returns ✅

### Steps
1. **Create Test User with Incomplete Profile**
   - Sign up as investor
   - Don't complete setup form
   - Sign out

2. **Sign In Again**
   - Use same credentials
   - Should immediately redirect to `investor/setup`

3. **Verify Restricted Access**
   - ❌ Cannot access Swipe
   - ❌ Cannot access Matches
   - ❌ Cannot access Messages
   - ❌ Cannot access Profile
   - ✅ Can access Browse

4. **Complete Setup**
   - Fill form and submit
   - Gain full access

### Expected Behavior
- Incomplete investors are always redirected to setup on app launch

---

## Test Scenario 3: Query Gating Verification 🔍

### Steps
1. **Open Network DevTools**
   - React Native Debugger or Expo DevTools

2. **Sign In as Incomplete Investor**
   - Watch network tab

3. **Verify No Protected Queries**
   - ❌ No `matchmaking.getRecommendations`
   - ❌ No `matchmaking.getMatches`
   - ❌ No `messages.getMatchesWithLastMessage`
   - ❌ No `messages.getMessagesForMatch`

4. **Complete Onboarding**
   - Watch network tab

5. **Verify Queries Start**
   - ✅ `matchmaking.getRecommendations` fires
   - ✅ Other queries work normally

### Expected Behavior
- Protected queries never execute while onboarding incomplete
- Queries start immediately after onboarding complete

---

## Test Scenario 4: Visionary Not Affected ✅

### Steps
1. **Sign Out**

2. **Sign Up as Visionary**
   - Choose "I am a Visionary"

3. **Verify Different Flow**
   - Should redirect to visionary dashboard
   - Visionary setup flow works independently
   - Not affected by investor gate

### Expected Behavior
- Visionaries have their own onboarding flow
- Investor gate only affects investors

---

## Test Scenario 5: Edge Cases 🧪

### Deep Link Attempt
```bash
# If user tries to manually navigate via deep link
# Guard should catch and redirect
```

**Steps**:
1. While in setup screen, use router to navigate:
   ```typescript
   router.push('/(tabs)/swipe')
   ```
2. Should redirect back to setup

### Back Button Behavior
**Steps**:
1. In setup screen, press Android back button
2. Should stay in setup or go to welcome
3. Should NOT go to protected screens

### Browser Refresh (Web Only)
**Steps**:
1. If running on web, refresh page while incomplete
2. Should redirect to setup on mount

---

## Debugging Tips 💡

### Check User Data
```typescript
// In React DevTools or console
const { data: userData } = trpc.user.me.useQuery();
console.log('onboardingComplete:', userData?.onboardingComplete);
console.log('role:', userData?.role);
```

### Check Investor Profile
```typescript
const { data: profile } = trpc.investorProfile.getMyInvestorProfile.useQuery();
console.log('profile:', profile);
```

### Enable Debug Logs
```typescript
// In InvestorOnboardingGuard.tsx, add:
console.log('[Guard]', { isInvestor, onboardingComplete, isSetupScreen });
```

---

## Common Issues & Fixes 🔧

### Issue: Tabs not updating after onboarding
**Fix**: Ensure `user.me` is invalidated in setup mutation

### Issue: Still seeing protected screens
**Fix**: Check guard is imported and wrapping component correctly

### Issue: Queries still executing
**Fix**: Verify `enabled: onboardingComplete` in query options

### Issue: Infinite redirect loop
**Fix**: Check `isSetupScreen` logic in guard excludes setup route

---

## Manual Test Checklist ✓

- [ ] New investor redirected to setup
- [ ] Protected tabs hidden during onboarding
- [ ] Browse tab visible during onboarding
- [ ] Cannot manually navigate to protected screens
- [ ] Queries don't execute while incomplete
- [ ] Setup form saves successfully
- [ ] After setup, redirected to Swipe
- [ ] All tabs visible after onboarding
- [ ] Queries execute after onboarding
- [ ] Returning incomplete investor redirected to setup
- [ ] Visionary flow unaffected
- [ ] No console errors
- [ ] No infinite loops
- [ ] Back button behaves correctly
- [ ] Deep links blocked appropriately

---

## Automated Testing (Future) 🤖

### Unit Tests
```typescript
// InvestorOnboardingGuard.test.tsx
describe('InvestorOnboardingGuard', () => {
  it('redirects investor without onboarding', () => {
    // Mock user.me with onboardingComplete: false
    // Render guard
    // Assert redirect called
  });
  
  it('allows investor with onboarding', () => {
    // Mock user.me with onboardingComplete: true
    // Render guard
    // Assert children rendered
  });
  
  it('allows non-investor', () => {
    // Mock user.me with role: VISIONARY
    // Render guard
    // Assert children rendered
  });
});
```

### Integration Tests
```typescript
// investor-onboarding-flow.e2e.ts
describe('Investor Onboarding Flow', () => {
  it('enforces onboarding gate end-to-end', async () => {
    // Sign up as investor
    // Verify redirected to setup
    // Verify tabs hidden
    // Complete setup
    // Verify tabs shown
    // Verify can access swipe
  });
});
```

---

## Performance Metrics 📊

### Things to Monitor
- Guard component re-render count (should be minimal)
- Query execution timing (should not run until enabled)
- Navigation performance (redirects should be instant)
- Tab bar render performance (filtering should be fast)

### Expected Performance
- Guard overhead: < 1ms
- Query gating: Prevents unnecessary network calls
- Tab filtering: O(n) where n = number of tabs (~10)
- Redirect latency: < 100ms

---

**Last Updated**: 2026-02-17  
**Status**: Ready for testing ✅
