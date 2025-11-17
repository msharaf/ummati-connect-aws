# Local Development Guide

Complete step-by-step instructions to get Ummati 2.0 running locally.

## 📋 Prerequisites

Before starting, ensure you have:

1. **Node.js** v18 or higher
   - Download: [nodejs.org](https://nodejs.org/)
   - Verify: `node --version`

2. **pnpm** v8.10.5 or higher
   - Install: `npm install -g pnpm@8.10.5`
   - Verify: `pnpm --version`

3. **PostgreSQL** v14 or higher
   - **Option A (Docker - Recommended):**
     ```bash
     docker run --name ummati-postgres \
       -e POSTGRES_PASSWORD=postgres \
       -e POSTGRES_DB=ummati \
       -p 5432:5432 \
       -d postgres:14
     ```
   - **Option B (Local Install):**
     - Download: [postgresql.org](https://www.postgresql.org/download/)
     - Create database: `psql -U postgres -c "CREATE DATABASE ummati;"`

4. **Clerk Account** (for authentication)
   - Sign up: [clerk.com](https://clerk.com)
   - Create a new application
   - Get your API keys from the dashboard

5. **Git** (for cloning the repository)

---

## 🚀 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Ummati2.0
```

### Step 2: Install Dependencies

```bash
pnpm install
```

This installs all dependencies for all packages in the monorepo.

### Step 3: Configure Environment Variables

The project includes `.env` files that need your Clerk keys and database URL.

#### 3.1: Get Clerk API Keys

1. Login to [Clerk Dashboard](https://dashboard.clerk.com) using ummatination credential
2. Click on Application name "ummati2.0"
3. Navigate to **API Keys**
4. Copy:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)

#### 3.2: Update Environment Files

**`apps/web/.env.local`** (Web App):
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

**`apps/mobile/.env`** (Mobile App):
```env
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# API URL - Use localhost for simulator/emulator
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**`packages/api/.env`** (API Server):
```env
# Clerk Authentication
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ummati?schema=public
```

> **Note:** If using Docker, the default connection string is:
> `postgresql://postgres:postgres@localhost:5432/ummati?schema=public`
>
> If using local PostgreSQL, adjust username/password as needed.

### Step 4: Set Up Database

#### 4.1: Generate Prisma Client

```bash
pnpm --filter @ummati/db exec prisma generate
```

#### 4.2: Run Database Migrations

```bash
pnpm --filter @ummati/db exec prisma migrate dev
```

This will:
- Create all database tables
- Set up relationships
- Apply the schema to your database

> **Alternative (Development Only):** If you want to push schema without creating migrations:
> ```bash
> pnpm --filter @ummati/db exec prisma db push
> ```

#### 4.3: (Optional) Open Prisma Studio

```bash
pnpm --filter @ummati/db exec prisma studio
```

Opens Prisma Studio at `http://localhost:5555` - a visual database browser.

### Step 5: Start Development Servers

#### Option A: Run All Services (Recommended)

```bash
pnpm dev
```

This starts all services in parallel:
- Web app (Next.js) on `http://localhost:3000`
- API server on `http://localhost:3001`
- Mobile app (Expo) - opens DevTools

#### Option B: Run Services Individually

**Terminal 1 - Web App:**
```bash
pnpm dev:web
# or
pnpm --filter web dev
```
→ Available at `http://localhost:3000`

**Terminal 2 - API Server (Optional):**
```bash
pnpm dev:api
# or
pnpm --filter api dev
```
→ Available at `http://localhost:3001`

**Terminal 3 - Mobile App:**
```bash
pnpm dev:mobile
# or
pnpm --filter mobile start
```
→ Opens Expo DevTools. Scan QR code with Expo Go app or press:
- `i` for iOS simulator
- `a` for Android emulator

---

## ✅ Verification Checklist

### 1. Database Connection
```bash
# Open Prisma Studio
pnpm --filter @ummati/db exec prisma studio
```
- Should open at `http://localhost:5555`
- Should see tables: User, InvestorProfile, VisionaryProfile, Match, Message, etc.

### 2. Web App
- Navigate to `http://localhost:3000`
- Should see the application homepage
- Try `/sign-in` - should show Clerk sign-in page

### 3. API Server
- Navigate to `http://localhost:3001`
- Should see API information JSON
- Navigate to `http://localhost:3001/health`
- Should return: `{"status":"ok"}`
- Navigate to `http://localhost:3001/trpc`
- Should see available procedures

### 4. Test tRPC Endpoint
```bash
# Test the ping endpoint
curl http://localhost:3001/trpc/auth.ping
```
Should return: `{"result":{"data":{"json":{"message":"pong"}}}}`

---

## 🛠️ Common Commands

### Database Commands
```bash
# Generate Prisma Client
pnpm --filter @ummati/db exec prisma generate

# Create new migration
pnpm --filter @ummati/db exec prisma migrate dev --name migration_name

# Apply migrations (production)
pnpm --filter @ummati/db exec prisma migrate deploy

# Push schema (dev only, no migrations)
pnpm --filter @ummati/db exec prisma db push

# Open Prisma Studio
pnpm --filter @ummati/db exec prisma studio

# Reset database (⚠️ deletes all data)
pnpm --filter @ummati/db exec prisma migrate reset
```

### Development Commands
```bash
# Run all services
pnpm dev

# Run specific service
pnpm dev:web      # Web app
pnpm dev:api      # API server
pnpm dev:mobile   # Mobile app

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Run tests
pnpm test
```

### Package-Specific Commands
```bash
# Run command in specific package
pnpm --filter <package-name> <command>

# Examples:
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter mobile start
pnpm --filter @ummati/db exec prisma generate
```

---

## 🐛 Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   # Docker
   docker ps | grep postgres
   
   # Local
   psql -U postgres -c "SELECT version();"
   ```

2. Check DATABASE_URL format:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/ummati?schema=public
   ```

3. Verify database exists:
   ```bash
   psql -U postgres -l
   ```

### Clerk Authentication Issues

**Error:** `Missing Clerk Publishable Key`

**Solutions:**
1. Verify environment files exist and have correct keys:
   - `apps/web/.env.local`
   - `apps/mobile/.env`
   - `packages/api/.env`

2. Restart dev servers after changing env variables

3. Verify keys in [Clerk Dashboard](https://dashboard.clerk.com)

### Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solutions:**
```bash
# Generate Prisma Client
pnpm --filter @ummati/db exec prisma generate

# Reinstall dependencies
pnpm install
```

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solutions:**
1. Find process using port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # macOS/Linux
   lsof -i :3000
   ```

2. Kill the process or change port in `apps/web/package.json`

### Mobile App Can't Connect to API

**Error:** Network errors in mobile app

**Solutions:**
1. **For iOS Simulator / Android Emulator:**
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

2. **For Physical Device:**
   - Find your computer's LAN IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Update `apps/mobile/.env`:
     ```env
     EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3000
     ```

3. Verify web app is running on port 3000

4. Check firewall settings

### TypeScript Errors

**Error:** Type errors after pulling latest changes

**Solutions:**
```bash
# Regenerate Prisma Client
pnpm --filter @ummati/db exec prisma generate

# Rebuild packages
pnpm build

# Clear Next.js cache
rm -rf apps/web/.next
```

---

## 📁 Project Structure

```
Ummati2.0/
├── apps/
│   ├── web/              # Next.js web application
│   │   ├── app/          # Next.js app directory
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities and helpers
│   │   └── .env.local    # Web app environment variables
│   └── mobile/           # Expo mobile application
│       ├── app/          # Expo router pages
│       ├── src/          # Source files
│       └── .env          # Mobile app environment variables
├── packages/
│   ├── api/              # tRPC API server
│   │   ├── src/
│   │   │   ├── routers/  # tRPC routers
│   │   │   ├── context.ts
│   │   │   ├── root.ts
│   │   │   └── server.ts
│   │   └── .env          # API environment variables
│   ├── db/               # Prisma database package
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   ├── notifications/    # Email & push notifications
│   └── config/           # Shared configuration
│       └── tsconfig/     # TypeScript configs
├── docs/                 # Documentation
├── .env.example          # Environment variables template
├── package.json          # Root package.json
├── pnpm-workspace.yaml   # pnpm workspace config
└── turbo.json           # Turbo build config
```

---

## 🎯 Next Steps After Setup

1. **Create your first admin user:**
   ```sql
   -- In Prisma Studio or psql
   UPDATE "User" SET "isAdmin" = true WHERE email = 'your-email@example.com';
   ```

2. **Test the authentication flow:**
   - Sign up at `http://localhost:3000/sign-up`
   - Complete onboarding
   - Test sign-in/sign-out

3. **Explore the API:**
   - Visit `http://localhost:3001/trpc` for available procedures
   - Test endpoints using the tRPC client

4. **Set up mobile app:**
   - Scan QR code with Expo Go
   - Test authentication on mobile
   - Verify API connectivity

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [pnpm Documentation](https://pnpm.io/motivation)

---

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review error messages carefully
3. Check that all prerequisites are installed
4. Verify environment variables are set correctly
5. Ensure database is running and accessible
