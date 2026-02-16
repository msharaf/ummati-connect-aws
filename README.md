# Ummati 2.0

A monorepo for connecting halal-compliant startups with investors. Built with Next.js, Expo, tRPC, Prisma, and Clerk.

## 🚀 Quick Start (Get Running in 5 Minutes)

### Step 1: Prerequisites
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **pnpm** v8+ (install: `npm install -g pnpm@8.10.5`)
- **PostgreSQL** v14+ (or use Docker - see below)
- **Git**

### Step 2: Clone & Install
```bash
git clone <repository-url>
cd Ummati2.0
pnpm install
```

### Step 3: Set Up Environment Variables

The project already has `.env` files created. You just need to add your **Clerk keys**:

**1. Get Clerk Keys:**
   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Copy your **Publishable Key** and **Secret Key**

**2. Update Environment Files:**

**`apps/web/.env.local`** (already exists, just update the keys):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
```

**`apps/mobile/.env`** (already exists, just update the key):
```env
CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
```

**`packages/api/.env`** (already exists, just update the key and add DATABASE_URL):
```env
CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ummati?schema=public
```

### Step 4: Set Up Database

**Option A: Using Docker (Easiest)**
```bash
docker run --name ummati-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ummati -p 5432:5432 -d postgres:14
```

**Option B: Local PostgreSQL**
```bash
# Create database
psql -U postgres
CREATE DATABASE ummati;
\q
```

**Then run migrations:**
```bash
# Generate Prisma Client
pnpm --filter @ummati/db exec prisma generate

# Run migrations
pnpm --filter @ummati/db exec prisma migrate dev
```

### Step 5: Start Development Servers

**Run everything at once:**
```bash
pnpm dev
```

This starts:
- 🌐 **Web app** → `http://localhost:3000`
- 🔌 **API server** → `http://localhost:3001`
- 📱 **Mobile app** → Expo DevTools (scan QR code)

**Or run individually:**
```bash
pnpm dev:web      # Web app only
pnpm dev:api      # API server only
pnpm dev:mobile   # Mobile app only
```

### ✅ Verify It's Working

1. **Web App**: Open `http://localhost:3000` - should see the app
2. **API Server**: Open `http://localhost:3001` - should see API info
3. **API Health**: Open `http://localhost:3001/health` - should return `{"status":"ok"}`
4. **Database**: Run `pnpm --filter @ummati/db exec prisma studio` - opens Prisma Studio at `http://localhost:5555`

---

## 📱 Physical Device Setup (Mobile)

When running the mobile app on a **physical phone** (not simulator), the device must reach the API over your LAN:

1. **Same WiFi** – Phone and development machine must be on the same network.
2. **Windows Firewall** – Allow inbound connections on port 3001:
   ```powershell
   netsh advfirewall firewall add rule name="Ummati API 3001" dir=in action=allow protocol=TCP localport=3001
   ```
3. **Set `EXPO_PUBLIC_API_URL`** – In `apps/mobile/.env`, use your PC's LAN IP (run `ipconfig` to find it):
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3001
   ```
4. **Restart Expo with cache clear**:
   ```bash
   pnpm --filter mobile exec npx expo start --clear
   ```

**Verify**: Open `http://<LAN_IP>:3001/health` in phone Safari – should return `{"status":"ok"}`. If it fails, check firewall and WiFi.

---

## 🔐 Authentication (Clerk + tRPC)

Auth is verified **server-side only** via Bearer tokens. No Next.js middleware protects the API.

### Flow

1. **Clients** (web + mobile) call `getToken({ template: "ummati-api" })` from Clerk and attach `Authorization: Bearer <token>` to every tRPC request.
2. **Server** (`createContext`) reads the header, verifies the token with Clerk, and sets `ctx.auth = { userId, sessionId, claims }` or `ctx.auth = null`.
3. **protectedProcedure** throws `UNAUTHORIZED` if `ctx.auth?.userId` is missing.

### Required env vars

| Location | Variable | Purpose |
|----------|----------|---------|
| `packages/api/.env` | `CLERK_SECRET_KEY` | Verify tokens (server only) |
| `apps/web/.env.local` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client |
| `apps/mobile/.env` | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client |

### Token template `ummati-api`

Create a JWT template in [Clerk Dashboard](https://dashboard.clerk.com) → JWT Templates:

- **Name**: `ummati-api`
- **Claims**: Add `"aud": "ummati-api"` (or leave default)

Both web and mobile use `getToken({ template: "ummati-api" })`. If the template doesn't exist, clients fall back to the default session token; the server accepts both during migration.

### Gating `user.me`

Calls to `user.me` should be gated with `enabled: isSignedIn && isLoaded` so the first request is not sent before Clerk is ready.

---

## 📚 More Information

- **Detailed Setup**: See [`docs/LOCAL_DEV.md`](docs/LOCAL_DEV.md) - Complete step-by-step guide with troubleshooting
- **Onboarding Guide**: See [`docs/ONBOARDING.md`](docs/ONBOARDING.md) - For new team members
- **Git Workflow**: See [`docs/GIT_BRANCHING.md`](docs/GIT_BRANCHING.md) - Branch strategy and PR process

---

## 🏗️ Project Structure

```
Ummati2.0/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # Expo mobile application
├── packages/
│   ├── api/          # tRPC API server
│   ├── db/           # Prisma database package
│   ├── notifications/# Email & push notifications
│   └── config/       # Shared TypeScript configs
└── docs/             # Documentation
```

---

## 🔧 Quick Commands Reference

```bash
# Development
pnpm dev              # Start all services
pnpm dev:web          # Web app only
pnpm dev:api          # API server only
pnpm dev:mobile       # Mobile app only

# Database
pnpm --filter @ummati/db exec prisma generate    # Generate Prisma Client
pnpm --filter @ummati/db exec prisma migrate dev # Run migrations
pnpm --filter @ummati/db exec prisma studio      # Open Prisma Studio

# Build & Test
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm test             # Run tests
```

---

## 📚 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Mobile**: Expo, React Native, NativeWind
- **Backend**: tRPC, Node.js
- **Database**: PostgreSQL, Prisma ORM
- **Auth**: Clerk
- **Monorepo**: pnpm workspaces, Turbo

---

## 🆘 Need Help?

1. Check [`docs/LOCAL_DEV.md`](docs/LOCAL_DEV.md) for detailed troubleshooting
2. Review error messages carefully
3. Verify all prerequisites are installed
4. Ensure environment variables are set correctly

