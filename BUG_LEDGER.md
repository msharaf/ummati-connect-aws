# Bug Ledger – V1 App Store Ship-Blocker Audit

**Audit date:** 2025-02-17  
**Scope:** apps/mobile (Expo Router + Clerk + tRPC), apps/api (tRPC routers, DB, auth)

---

## Bug Ledger (sorted by severity)

| # | Title | Severity | Repro | Expected | Actual | Root cause | Fix plan | Files |
|---|-------|----------|-------|----------|--------|------------|----------|-------|
| 1 | InvestorOnboardingGuard skipped HalalFocus | S1 | Investor with incomplete HalalFocus reaches Swipe/Matches/Profile | Redirect to halalfocus first | Guard sent to setup only; setup could fail with "Complete HalalFocus verification first" | Guard only checked `onboardingComplete`, not `halalFocusVerified` | Add halalFocusVerified check; redirect to halalfocus before setup | InvestorOnboardingGuard.tsx |
| 2 | Visionary Dashboard tab visible | S2 | Visionary views tab bar | Core tabs only: Swipe, Connections, Profile | Dashboard tab shown | RoleBasedTabBar allowed visionary/dashboard | Filter out visionary/dashboard | RoleBasedTabBar.tsx |

---

## Fixes Applied

### 1. InvestorOnboardingGuard
- **File:** `apps/mobile/src/components/InvestorOnboardingGuard.tsx`
- **Change:** Two-step gate: (1) HalalFocus first, (2) setup second. Uses `halalFocusVerified` from `user.me`; redirects to `investor/halalfocus` when `!halalFocusVerified`, else to `investor/setup` when `!onboardingComplete`. Uses `queueMicrotask` for redirects to avoid layout loops. Uses `usePathname` for route checks.

### 2. RoleBasedTabBar
- **File:** `apps/mobile/src/components/RoleBasedTabBar.tsx`
- **Change:** Added filter for `visionary/dashboard` so core tabs are Swipe, Connections, Profile only (matches Browse/Messages hidden for investors).

---

## Remaining Risks

| Risk | Notes |
|------|-------|
| API ESLint config missing | `packages/api` lacks `eslint.config.*`; lint fails. Pre-existing |
| API tests failing | `user.test.ts`, `matchmaking.test.ts` may fail due to `user.me` changes; not run in this audit |
| choose-role redirect target | Investor lands on `/(tabs)/investor`; layout gate redirects to halalfocus. Brief flash possible |
| Visionary landing | Visionary lands on `visionary/dashboard`; dashboard is hidden from tabs. User can still navigate via Swipe/Connections/Profile |

---

## Smoke Test Script (for Mouhab)

### Prerequisites
- API running (`pnpm dev:api`)
- Mobile running (`pnpm dev:mobile`)
- Test device or simulator

### 1. Investor flow

1. Sign out (if signed in).
2. Sign up or sign in.
3. Choose role: **Investor**.
4. **Expect:** Redirect to HalalFocus screen.
5. Complete HalalFocus questionnaire.
6. **Expect:** Redirect to investor setup.
7. Fill required fields (min/max ticket, etc.) and save.
8. **Expect:** Redirect to Swipe.
9. **Verify:** Bottom tabs show Swipe, Connections, Profile only (no Browse, no Messages).
10. Swipe on a few cards.
11. **Expect:** No crash or blank screen.
12. Open Connections tab.
13. **Expect:** Matches list or empty state.
14. Tap a match (if any).
15. **Expect:** Message thread opens.
16. Send a message.
17. **Expect:** Message sends; no error.
18. Open Profile tab.
19. **Expect:** Profile loads; edit and save.
20. **Expect:** No crash.

### 2. Visionary flow

1. Sign out.
2. Sign up or sign in.
3. Choose role: **Visionary**.
4. **Expect:** Redirect to visionary dashboard.
5. **Verify:** Bottom tabs show Swipe, Connections, Profile only (no Dashboard tab).
6. Navigate Swipe, Connections, Profile.
7. **Expect:** No crash.

### 3. Auth gates

1. **Signed out:** Navigate to `/` → expect redirect to welcome.
2. **Signed in, no role:** Expect redirect to choose-role.
3. **Investor, HalalFocus incomplete:** Try to reach Swipe directly → expect redirect to halalfocus.
4. **Investor, setup incomplete:** Expect redirect to setup.

### 4. Edge cases

1. Investor with HalalFocus complete but setup incomplete → expect redirect to setup.
2. Investor with both complete → expect access to Swipe.
3. No infinite redirect loops during any flow.
4. No auth/profile flicker.

---

## Stop conditions

- No S0/S1 bugs left.
- Smoke test passes for both roles.
- Report readiness when complete.
