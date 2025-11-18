# Back Navigation Implementation Plan

## New Files

### 1. `apps/mobile/src/components/BackButton.tsx`
Reusable back button component for mobile app using Expo Router.

### 2. `apps/mobile/src/hooks/useBackHandler.ts`
Hook to handle Android hardware back button with safe fallback.

### 3. `apps/web/components/BackButtonWeb.tsx`
Reusable back button component for web app using Next.js navigation.

---

## Modified Files - Mobile

### 1. `apps/mobile/app/_layout.tsx`
Add Android BackHandler support for hardware back button.

### 2. `apps/mobile/app/(auth)/choose-role.tsx`
Add BackButton component at top-left of screen.

### 3. `apps/mobile/app/(tabs)/investor/setup.tsx`
Add BackButton component in header area.

### 4. `apps/mobile/app/(tabs)/visionary/setup.tsx`
Add BackButton component in header area.

### 5. `apps/mobile/app/(tabs)/messages/[matchId].tsx`
Replace existing back button implementation with BackButton component.

---

## Modified Files - Web

### 1. `apps/web/app/onboarding/choose-role/page.tsx`
Add BackButtonWeb component at top-left.

### 2. `apps/web/app/(app)/investor/setup/page.tsx`
Add BackButtonWeb component in header area.

### 3. `apps/web/app/(app)/investor/halal-pledge/page.tsx`
Add BackButtonWeb component in header area.

### 4. `apps/web/app/(app)/visionary/setup/page.tsx`
Add BackButtonWeb component in header area.

### 5. `apps/web/app/(app)/visionary/verify-halal/page.tsx`
Add BackButtonWeb component in header area.

### 6. `apps/web/app/(app)/messages/[matchId]/page.tsx`
Replace existing back button with BackButtonWeb component.

---

## Implementation Details

- Back buttons use Ionicons `arrow-back` icon for consistency
- Safe fallback: Mobile → `/home`, Web → `/`
- Android hardware back button fully supported
- No back button on landing pages, sign-in, or sign-up screens
- Consistent styling across both platforms

