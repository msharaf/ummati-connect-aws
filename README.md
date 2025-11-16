## Ummati 2.0 Monorepo

A pnpm-powered monorepo managed with Turbo for web, mobile, and backend services.

### Quickstart

1) Prerequisites: Node 18+, pnpm 8+, Git
2) Install deps:
```
pnpm install
```
3) Generate Prisma client (if DB used locally):
```
pnpm --filter @ummati/db prisma generate
```
4) Start apps:
```
pnpm dev:web
pnpm dev:mobile
pnpm dev:api
```

More details:
- Local dev: see `docs/LOCAL_DEV.md`
- Onboarding: see `docs/ONBOARDING.md`
- Branch strategy: see `docs/GIT_BRANCHING.md`

# Ummati 2.0 - Local Development Setup

A monorepo for connecting halal-compliant startups with investors. Built with Next.js, Expo, tRPC, Prisma, and Clerk.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)

2. **pnpm** (v8.10.5 or higher)
   ```bash
   npm install -g pnpm@8.10.5
   ```

3. **PostgreSQL** (v14 or higher)
   - Download from [postgresql.org](https://www.postgresql.org/download/)
   - Or use Docker:
     ```bash
     docker run --name ummati-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ummati -p 5432:5432 -d postgres:14
     ```

4. **Clerk Account** (for authentication)
   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Get your Publishable Key and Secret Key

5. **Expo CLI** (for mobile development)
   ```bash
   npm install -g expo-cli
   ```

6. **Resend API Key** (optional, for email notifications)
   - Sign up at [resend.com](https://resend.com)
   - Get your API key

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Ummati2.0
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

#### Root `.env` file (for database)

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ummati?schema=public"

# Clerk Authentication (for API)
CLERK_SECRET_KEY="sk_test_..."

# Email Notifications (optional)
RESEND_API_KEY="re_..."
EMAIL_FROM="notifications@ummati.com"

# App URL (for email links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Web App (`.env.local`)

Create `apps/web/.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Database (same as root)
DATABASE_URL="postgresql://user:password@localhost:5432/ummati?schema=public"

# Email Notifications (optional)
RESEND_API_KEY="re_..."
EMAIL_FROM="notifications@ummati.com"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Mobile App (`.env`)

Create `apps/mobile/.env`:

```env
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# API URL
# For iOS simulator or Android emulator:
EXPO_PUBLIC_API_URL="http://localhost:3000"

# For physical device, use your computer's LAN IP:
# EXPO_PUBLIC_API_URL="http://192.168.1.100:3000"

# Expo Project ID (optional, for push notifications)
EXPO_PROJECT_ID="your-project-id"
```

#### API Package (`.env`)

Create `packages/api/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ummati?schema=public"

# Clerk Authentication
CLERK_SECRET_KEY="sk_test_..."

# Email Notifications (optional)
RESEND_API_KEY="re_..."
EMAIL_FROM="notifications@ummati.com"

# Server Port
PORT=2023
```

### 4. Set Up Database

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ummati;

# Exit
\q
```

#### Run Prisma Migrations

```bash
# Generate Prisma Client
pnpm --filter db exec prisma generate

# Run migrations
pnpm --filter db exec prisma migrate dev

# Or if you want to push schema without migrations (development only)
pnpm --filter db exec prisma db push
```

#### (Optional) Open Prisma Studio

```bash
pnpm --filter db exec prisma studio
```

This opens Prisma Studio at `http://localhost:5555` where you can view and edit your database.

### 5. Set Up Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Go to **API Keys** and copy:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`
4. Configure **Allowed Redirect URLs**:
   - Web: `http://localhost:3000`
   - Mobile: Configure OAuth redirect URLs if needed

### 6. Start Development Servers

#### Option A: Run All Services (Recommended)

```bash
# Run all services in parallel (web, api, mobile)
pnpm dev
```

#### Option B: Run Services Individually

**Terminal 1: Web App**
```bash
pnpm --filter web dev
```
Web app will be available at `http://localhost:3000`

**Terminal 2: API Server** (Optional - web app includes API)
```bash
pnpm --filter api dev
```
API server will be available at `http://localhost:2023`

**Terminal 3: Mobile App**
```bash
pnpm --filter mobile start
```
Expo DevTools will open. Scan QR code with Expo Go app or press `i` for iOS simulator / `a` for Android emulator.

---

## 📁 Project Structure

```
Ummati2.0/
├── apps/
│   ├── web/          # Next.js web app
│   └── mobile/       # Expo mobile app
├── packages/
│   ├── api/          # tRPC API server
│   ├── db/           # Prisma database package
│   ├── notifications/# Email & push notifications
│   └── config/       # Shared configuration
└── package.json      # Root package.json
```

---

## 🔧 Available Scripts

### Root Level

```bash
# Install all dependencies
pnpm install

# Run all dev servers
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Run tests
pnpm test

# Run specific service
pnpm dev:web      # Web app
pnpm dev:api      # API server
pnpm dev:mobile   # Mobile app

# Prisma commands
pnpm prisma:generate  # Generate Prisma Client
```

### Database Package

```bash
# Generate Prisma Client
pnpm --filter db exec prisma generate

# Create migration
pnpm --filter db exec prisma migrate dev --name migration_name

# Apply migrations
pnpm --filter db exec prisma migrate deploy

# Push schema (development only)
pnpm --filter db exec prisma db push

# Open Prisma Studio
pnpm --filter db exec prisma studio
```

### Web App

```bash
# Start dev server
pnpm --filter web dev

# Build for production
pnpm --filter web build

# Start production server
pnpm --filter web start

# Lint
pnpm --filter web lint
```

### Mobile App

```bash
# Start Expo dev server
pnpm --filter mobile start

# Run on iOS
pnpm --filter mobile ios

# Run on Android
pnpm --filter mobile android

# Run on web
pnpm --filter mobile web
```

---

## 🧪 Testing the Setup

### 1. Test Database Connection

```bash
# Open Prisma Studio
pnpm --filter db exec prisma studio

# Verify tables are created
# You should see: User, InvestorProfile, VisionaryProfile, Match, Message, etc.
```

### 2. Test Web App

1. Navigate to `http://localhost:3000`
2. You should see the home page
3. Try accessing `/sign-in` - should show Clerk sign-in page
4. Sign up with a new account
5. After sign-up, you should be redirected to `/onboarding/choose-role`
6. Choose a role (Investor or Visionary)
7. You should be redirected to the appropriate dashboard

### 3. Test Mobile App

1. Start Expo: `pnpm --filter mobile start`
2. Scan QR code with Expo Go app (iOS/Android)
3. Or press `i` for iOS simulator / `a` for Android emulator
4. Sign in with the same account you used on web
5. You should see the same onboarding flow

### 4. Test Admin Panel

1. **Make a user admin** (in Prisma Studio or via SQL):
   ```sql
   UPDATE "User" SET "isAdmin" = true WHERE email = 'your-email@example.com';
   ```

2. Navigate to `http://localhost:3000/admin`
3. You should see the admin dashboard
4. You can:
   - View flagged startups
   - Approve/reject startups
   - Manage users (ban/unban)

---

## 🐛 Troubleshooting

### Database Connection Issues

**Problem:** `Error: Can't reach database server`

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   # Check if PostgreSQL is running
   psql -U postgres -c "SELECT version();"
   ```

2. Verify `DATABASE_URL` is correct:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/ummati?schema=public"
   ```

3. Check if database exists:
   ```bash
   psql -U postgres -l
   ```

### Clerk Authentication Issues

**Problem:** `Missing Clerk Publishable Key`

**Solutions:**
1. Verify environment variables are set:
   - Web: `apps/web/.env.local`
   - Mobile: `apps/mobile/.env`

2. Restart dev servers after changing env variables

3. Verify Clerk keys are correct in [Clerk Dashboard](https://dashboard.clerk.com)

### Prisma Client Not Generated

**Problem:** `Cannot find module '@prisma/client'`

**Solutions:**
```bash
# Generate Prisma Client
pnpm --filter db exec prisma generate

# Reinstall dependencies
pnpm install
```

### Mobile App Can't Connect to API

**Problem:** Mobile app shows network errors

**Solutions:**
1. **For iOS Simulator / Android Emulator:**
   ```env
   EXPO_PUBLIC_API_URL="http://localhost:3000"
   ```

2. **For Physical Device:**
   ```env
   # Use your computer's LAN IP address
   EXPO_PUBLIC_API_URL="http://192.168.1.100:3000"
   ```

3. Verify web app is running on port 3000

4. Check firewall settings

### Port Already in Use

**Problem:** `Port 3000 is already in use`

**Solutions:**
1. Find process using port:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # macOS/Linux
   lsof -i :3000
   ```

2. Kill process or change port in `apps/web/package.json`

---

## 📝 Environment Variables Reference

### Required Variables

| Variable | Description | Where to Set |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Root `.env`, `apps/web/.env.local`, `packages/api/.env` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `apps/web/.env.local` |
| `CLERK_SECRET_KEY` | Clerk secret key | `apps/web/.env.local`, `packages/api/.env` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (mobile) | `apps/mobile/.env` |
| `EXPO_PUBLIC_API_URL` | API URL (mobile) | `apps/mobile/.env` |

### Optional Variables

| Variable | Description | Where to Set |
|----------|-------------|--------------|
| `RESEND_API_KEY` | Resend API key for emails | Root `.env`, `apps/web/.env.local`, `packages/api/.env` |
| `EMAIL_FROM` | Email sender address | Root `.env`, `apps/web/.env.local`, `packages/api/.env` |
| `NEXT_PUBLIC_APP_URL` | App URL for email links | `apps/web/.env.local` |
| `PORT` | API server port | `packages/api/.env` (default: 2023) |
| `EXPO_PROJECT_ID` | Expo project ID (push notifications) | `apps/mobile/.env` |

---

## 🎯 Next Steps

1. **Set up your first admin user:**
   ```sql
   UPDATE "User" SET "isAdmin" = true WHERE email = 'your-email@example.com';
   ```

2. **Test the onboarding flow:**
   - Sign up → Choose role → Complete profile

3. **Test the admin panel:**
   - Navigate to `/admin`
   - Approve/reject flagged startups
   - Manage users

4. **Test notifications:**
   - Set up Resend API key
   - Test email notifications for matches and messages

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Resend Documentation](https://resend.com/docs)

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

---

## 📄 License

[Your License Here]

---

## 🆘 Support

If you encounter any issues, please:
1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information

