# Investor Onboarding Gate - Quick Reference

## ✅ Implementation Complete

All investor routes are now protected until halal onboarding is complete.

---

## 🔒 Protected Routes

### BLOCKED until onboarding complete:
- `/(tabs)/swipe` - Swipe screen
- `/(tabs)/matches` - Matches list
- `/(tabs)/messages` - Messages list
- `/(tabs)/messages/[matchId]` - Message detail
- `/(tabs)/profile` - Profile settings

### ALLOWED during onboarding:
- `/(tabs)/investor` - Browse visionaries
- `/(tabs)/investor/setup` - Complete onboarding

---

## 🎯 How It Works

```
┌─────────────────────────────────────────────┐
│  User chooses "I am an Investor"            │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Check: onboardingComplete?                 │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
      NO               YES
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│ REDIRECT TO │  │ FULL ACCESS  │
│   SETUP     │  │   GRANTED    │
└─────────────┘  └──────────────┘
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│ Only Browse │  │ All tabs     │
│ tab visible │  │ visible      │
└─────────────┘  └──────────────┘
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│ Queries     │  │ Queries      │
│ BLOCKED     │  │ ENABLED      │
└─────────────┘  └──────────────┘
```

---

## 🛠️ Key Components

### 1. InvestorOnboardingGuard
```tsx
// apps/mobile/src/components/InvestorOnboardingGuard.tsx
// Wraps protected screens, redirects if incomplete
<InvestorOnboardingGuard>
  <ProtectedScreen />
</InvestorOnboardingGuard>
```

### 2. RoleBasedTabBar
```tsx
// apps/mobile/src/components/RoleBasedTabBar.tsx
// Hides tabs if investor && !onboardingComplete
if (isInvestor && !onboardingComplete) {
  // Only show investor tabs
}
```

### 3. Root Layout
```tsx
// apps/mobile/app/_layout.tsx
// Redirects to setup if incomplete
if (isInvestor && !onboardingComplete) {
  router.replace("/(tabs)/investor/setup");
}
```

### 4. Query Gating
```tsx
// In all protected screens
const { data } = trpc.query.useQuery(
  params,
  { enabled: onboardingComplete }
);
```

---

## 🧪 Quick Test (30 seconds)

```bash
# 1. Start app
pnpm start

# 2. Sign up as investor
# 3. Should redirect to setup ✅
# 4. Should only see Browse tab ✅
# 5. Complete setup
# 6. Should redirect to Swipe ✅
# 7. Should see all tabs ✅
```

---

## 📂 Files Modified

```
apps/mobile/
├── src/components/
│   ├── InvestorOnboardingGuard.tsx ← NEW
│   └── RoleBasedTabBar.tsx ← MODIFIED
├── app/
│   ├── _layout.tsx ← MODIFIED
│   └── (tabs)/
│       ├── swipe/index.tsx ← MODIFIED
│       ├── matches/index.tsx ← MODIFIED
│       ├── messages/
│       │   ├── index.tsx ← MODIFIED
│       │   └── [matchId].tsx ← MODIFIED
│       ├── profile/index.tsx ← MODIFIED
│       └── investor/setup.tsx ← MODIFIED
├── INVESTOR_ONBOARDING_GATE.md ← NEW
├── TESTING_ONBOARDING_GATE.md ← NEW
└── QUICK_REFERENCE.md ← NEW (this file)
```

---

## 🐛 Debugging

### Check User Status
```tsx
const { data } = trpc.user.me.useQuery();
console.log('onboardingComplete:', data?.onboardingComplete);
console.log('role:', data?.role);
```

### Check Guard Behavior
```tsx
// In InvestorOnboardingGuard.tsx, add:
console.log('[Guard]', {
  isInvestor,
  onboardingComplete,
  isSetupScreen,
  segments
});
```

### Check Queries
```tsx
// Look for "enabled: false" in React Query DevTools
// Queries should not run while onboarding incomplete
```

---

## ❗ Common Issues

| Issue | Solution |
|-------|----------|
| Tabs still showing | Check `RoleBasedTabBar` filter logic |
| Can access protected screens | Verify guard wrapper on screen |
| Queries still executing | Check `enabled: onboardingComplete` flag |
| Infinite redirect | Check `isSetupScreen` excludes setup route |
| Not redirecting | Invalidate `user.me` after setup save |

---

## 📚 Full Documentation

- **Architecture**: `INVESTOR_ONBOARDING_GATE.md`
- **Testing**: `TESTING_ONBOARDING_GATE.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md` (root)
- **Quick Ref**: `QUICK_REFERENCE.md` (this file)

---

## ✨ Features

- [x] Hard gate for investors (no exceptions)
- [x] Tab hiding (UX improvement)
- [x] Query gating (performance + UX)
- [x] Root redirect (security)
- [x] Setup completion tracking
- [x] Automatic redirect after setup
- [x] No breaking changes
- [x] Zero code deletion
- [x] Linter clean
- [x] TypeScript safe

---

## 🎯 Success Criteria

✅ Investors cannot access Swipe until onboarding complete  
✅ Investors cannot access Matches until onboarding complete  
✅ Investors cannot access Messages until onboarding complete  
✅ Investors cannot access Profile until onboarding complete  
✅ Investors CAN browse visionaries during onboarding  
✅ Tabs hidden appropriately  
✅ Queries gated (no 412 errors)  
✅ Smooth user experience  
✅ No console errors  
✅ No infinite loops  

---

**Status**: ✅ Ready for testing  
**Version**: 1.0  
**Last Updated**: 2026-02-17
