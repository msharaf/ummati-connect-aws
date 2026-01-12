# Deployment Guide

Complete guide for deploying Ummati 2.0 to production (App Store + Web Server).

## 📋 Overview

For production deployment, you'll need:

1. **Production Database** (PostgreSQL)
2. **Web Hosting** (for Next.js web app)
3. **API Hosting** (can be same as web, or separate)
4. **Mobile App Build** (iOS/Android via Expo)
5. **Production Environment Variables**

---

## 🗄️ Step 1: Production Database

You need a **hosted PostgreSQL database**. Options:

### Option A: Supabase (Recommended - Easy & Free Tier)
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings → Database**
4. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Update password in connection string
6. This will be your `DATABASE_URL` for production

### Option B: Railway
1. Sign up at [railway.app](https://railway.app)
2. New Project → Provision PostgreSQL
3. Copy the `DATABASE_URL` from the service settings

### Option C: AWS RDS / DigitalOcean / Other
- Follow your provider's instructions for PostgreSQL setup
- Get the connection string

### Run Migrations on Production Database

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Run migrations
pnpm --filter @ummati/db exec prisma migrate deploy
```

---

## 🌐 Step 2: Web Server Deployment

### Option A: Vercel (Recommended for Next.js)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from project root:**
   ```bash
   cd apps/web
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project → Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
     CLERK_SECRET_KEY=sk_live_...
     DATABASE_URL=postgresql://...
     NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
     ```

4. **Configure Build Settings:**
   - Root Directory: `apps/web`
   - Build Command: `pnpm install && pnpm build`
   - Output Directory: `.next`

### Option B: Railway (Full-Stack Deployment)

1. Connect your GitHub repo to Railway
2. Add PostgreSQL service (from Step 1)
3. Add Web Service:
   - Root Directory: `apps/web`
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start`
   - Port: `3000`

4. Set Environment Variables in Railway dashboard

### Option C: Self-Hosted (AWS, DigitalOcean, etc.)

1. Build the app:
   ```bash
   cd apps/web
   pnpm build
   ```

2. Start production server:
   ```bash
   pnpm start
   ```

3. Use PM2 or similar for process management:
   ```bash
   pm2 start pnpm --name "ummati-web" -- start
   ```

---

## 📱 Step 3: Mobile App Store Deployment

### Prerequisites

1. **Expo EAS Account:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure EAS Build:**
   ```bash
   cd apps/mobile
   eas build:configure
   ```
   
   This creates `eas.json` (already exists in your project).

### iOS App Store Deployment

1. **Apple Developer Account** ($99/year)
   - Sign up at [developer.apple.com](https://developer.apple.com)

2. **Configure iOS in `eas.json`:**
   ```json
   {
     "build": {
       "production": {
         "ios": {
           "bundleIdentifier": "com.ummati.app"
         }
       }
     }
   }
   ```

3. **Build iOS App:**
   ```bash
   eas build --platform ios --profile production
   ```

4. **Submit to App Store:**
   ```bash
   eas submit --platform ios --profile production
   ```

### Android Play Store Deployment

1. **Google Play Developer Account** ($25 one-time)

2. **Build Android App:**
   ```bash
   eas build --platform android --profile production
   ```

3. **Submit to Play Store:**
   ```bash
   eas submit --platform android --profile production
   ```

### Environment Variables for Mobile Build

Set in EAS dashboard or via CLI:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://api.ummati.com
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value pk_live_...
```

Or set in `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.ummati.com",
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_..."
      }
    }
  }
}
```

---

## 🔑 Step 4: Production Environment Variables

### Clerk Production Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Switch to **Production** environment
3. Copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (pk_live_...)
   - `CLERK_SECRET_KEY` (sk_live_...)

### Environment Variables Checklist

#### Web App (Vercel/Railway/etc.)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### Mobile App (EAS Build)
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_API_URL=https://api.ummati.com
```

#### API Server (if separate)
```env
CLERK_SECRET_KEY=sk_live_...
DATABASE_URL=postgresql://...
PORT=3001
```

---

## 🔄 Step 5: Update API URLs

### Mobile App Configuration

The mobile app needs to point to your production API. Update:

**Option 1: Via Environment Variable (Recommended)**
- Set `EXPO_PUBLIC_API_URL` in EAS secrets (see Step 3)

**Option 2: Via app.config.ts**
```typescript
// apps/mobile/app.config.ts
extra: {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://api.ummati.com",
  clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""
}
```

### Web App Configuration

The web app's API routes are embedded (Next.js API routes), so no separate API URL needed if deploying as one service.

If using separate API server, update:
```typescript
// apps/web/src/lib/trpc.tsx
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
};
```

---

## ✅ Pre-Deployment Checklist

- [ ] Production database set up (Supabase/Railway/etc.)
- [ ] Database migrations run on production DB
- [ ] Clerk production keys obtained
- [ ] Web app deployed (Vercel/Railway/etc.)
- [ ] Environment variables set in hosting platform
- [ ] Mobile app API URL configured
- [ ] EAS build configured
- [ ] iOS/Android developer accounts set up
- [ ] App icons and splash screens configured
- [ ] App Store/Play Store listings prepared

---

## 🚀 Quick Deploy Commands

### Web to Vercel
```bash
cd apps/web
vercel --prod
```

### Mobile Build
```bash
cd apps/mobile
eas build --platform all --profile production
```

### Database Migration
```bash
DATABASE_URL="your-prod-db-url" pnpm --filter @ummati/db exec prisma migrate deploy
```

---

## 📝 Notes

1. **Database Backups**: Enable automatic backups on your database provider
2. **Monitoring**: Set up error tracking (Sentry, LogRocket, etc.)
3. **Analytics**: Add analytics to track usage
4. **Domain**: Configure custom domain for web app
5. **SSL**: Ensure HTTPS is enabled (automatic on Vercel/Railway)

---

## 🆘 Troubleshooting

### Mobile app can't connect to API
- Check `EXPO_PUBLIC_API_URL` is set correctly
- Verify API server is publicly accessible
- Check CORS settings if using separate API server

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check database is publicly accessible (if needed)
- Verify IP whitelist/security groups allow connections

### Clerk authentication not working
- Ensure production keys are used (not test keys)
- Check API URLs are configured in Clerk dashboard
- Verify environment variables are set correctly
