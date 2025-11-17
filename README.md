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
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aHVtb3JvdXMtdnVsdHVyZS0zNC5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_JNPzDSzaZWfgonZC8YAFhrH5tdv6ELTMFmIgS6kX7Q
```

**`apps/mobile/.env`** (already exists, just update the key):
```env
CLERK_PUBLISHABLE_KEY=pk_test_aHVtb3JvdXMtdnVsdHVyZS0zNC5jbGVyay5hY2NvdW50cy5kZXYk
```

**`packages/api/.env`** (already exists, just update the key and add DATABASE_URL):
```env
CLERK_SECRET_KEY=sk_test_JNPzDSzaZWfgonZC8YAFhrH5tdv6ELTMFmIgS6kX7Q
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

