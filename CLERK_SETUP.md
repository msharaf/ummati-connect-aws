# Clerk Authentication Setup Guide

This document provides complete instructions for setting up Clerk authentication across the Ummati monorepo.

## 📦 Dependencies Installed

### Web App (`apps/web`)
- `@clerk/nextjs`: ^5.0.0
- `@clerk/types`: ^5.0.0

### Mobile App (`apps/mobile`)
- `@clerk/clerk-expo`: ^2.0.0
- `@clerk/types`: ^5.0.0
- `expo-secure-store`: ^12.3.1

### API Package (`packages/api`)
- `@clerk/backend`: ^1.0.0

## 🔑 Environment Variables

### Root `.env` (or `apps/web/.env.local`)
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ummati
```

### Mobile App (`apps/mobile/.env`)
```env
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# API URL
# For iOS simulator or Android emulator:
EXPO_PUBLIC_API_URL=http://localhost:3000

# For physical device, use your computer's LAN IP:
# EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

## 📁 File Structure

### Modified Files

#### Database
- `packages/db/prisma/schema.prisma` - Added `clerkId` field to User model

#### API Package
- `packages/api/package.json` - Added `@clerk/backend`
- `packages/api/src/context.ts` - Updated to use Clerk authentication
- `packages/api/src/lib/syncUser.ts` - NEW: User syncing logic
- `packages/api/src/routers/auth.ts` - Updated to handle Clerk users

#### Web App
- `apps/web/package.json` - Added Clerk dependencies
- `apps/web/app/layout.tsx` - Wrapped with ClerkProvider
- `apps/web/middleware.ts` - NEW: Route protection
- `apps/web/app/api/trpc/[trpc]/route.ts` - Updated to use Clerk auth
- `apps/web/src/lib/trpc.ts` - Updated to remove manual headers
- `apps/web/app/sign-in/[[...sign-in]]/page.tsx` - NEW: Sign-in page
- `apps/web/app/sign-up/[[...sign-up]]/page.tsx` - NEW: Sign-up page

#### Mobile App
- `apps/mobile/package.json` - Added Clerk dependencies
- `apps/mobile/app.config.ts` - Added Clerk publishable key config
- `apps/mobile/app/_layout.tsx` - Wrapped with ClerkProvider + navigation guards
- `apps/mobile/src/lib/clerk.ts` - NEW: Clerk setup for Expo
- `apps/mobile/src/lib/trpc.ts` - Updated to send Clerk token
- `apps/mobile/app/(auth)/sign-in.tsx` - NEW: Sign-in screen
- `apps/mobile/app/(auth)/sign-up.tsx` - NEW: Sign-up screen
- `apps/mobile/src/features/swipe/SwipeScreen.tsx` - Updated to use Clerk auth

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Clerk Dashboard
1. Go to https://dashboard.clerk.com
2. Create a new application
3. Copy your **Publishable Key** and **Secret Key**
4. Add your application URLs:
   - Web: `http://localhost:3000`
   - Mobile: Configure OAuth redirect URLs

### 3. Configure Environment Variables

#### Web App
Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### Mobile App
Create `apps/mobile/.env`:
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 4. Run Database Migration
```bash
# Generate Prisma client with new schema
pnpm --filter db exec prisma generate

# Run migration (if you have existing data, create a migration)
pnpm --filter db exec prisma migrate dev --name add_clerk_id
```

### 5. Start Development Servers

#### Terminal 1: Web App
```bash
pnpm --filter web dev
```

#### Terminal 2: Mobile App
```bash
pnpm --filter mobile start
```

## 🧪 Testing Instructions

### Web App Testing
1. Navigate to `http://localhost:3000`
2. Try accessing `/dashboard` - should redirect to `/sign-in`
3. Sign up with a new account
4. After sign-up, should redirect to dashboard
5. Test tRPC protected procedures:
   ```typescript
   const { data } = trpc.auth.getCurrentUser.useQuery();
   ```

### Mobile App Testing
1. Start Expo app: `pnpm --filter mobile start`
2. App should redirect to `/(auth)/sign-in` if not authenticated
3. Sign up or sign in
4. After authentication, should redirect to `/(tabs)/swipe`
5. Test tRPC protected procedures:
   ```typescript
   const { data } = trpc.auth.getCurrentUser.useQuery();
   ```

### tRPC Protected Procedure Test
Create a test page that calls:
```typescript
const { data, error } = trpc.auth.getCurrentUser.useQuery();
```

Expected:
- ✅ If authenticated: Returns user data
- ❌ If not authenticated: Returns UNAUTHORIZED error

## 🔄 User Syncing Flow

1. User signs in via Clerk (web or mobile)
2. tRPC context receives Clerk userId or token
3. `syncUserWithDatabase()` is called:
   - Fetches Clerk user data
   - Checks if Prisma user exists by `clerkId`
   - If exists: Updates user data
   - If not exists: Creates new user with `clerkId`
4. Returns Prisma user with role to tRPC context

## 🛡️ Protected Routes

### Web App
Protected routes (require authentication):
- `/dashboard`
- `/investor`
- `/visionary`
- `/messages`

Public routes:
- `/`
- `/sign-in`
- `/sign-up`
- `/pricing`
- `/about`

### Mobile App
Protected routes:
- `/(tabs)/*` - All tab screens

Public routes:
- `/(auth)/sign-in`
- `/(auth)/sign-up`

## 📝 Notes

- User `role` is initially `null` - users must set their role (INVESTOR or VISIONARY) after sign-up
- Clerk automatically handles email verification, password reset, etc.
- Mobile tokens are stored securely using `expo-secure-store`
- User syncing happens automatically on first tRPC request per session

