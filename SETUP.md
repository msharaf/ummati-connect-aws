# Quick Setup Guide

## 🚀 Fast Setup (5 minutes)

### 1. Prerequisites Check

```bash
# Check Node.js version (should be v18+)
node --version

# Check pnpm version (should be v8.10.5+)
pnpm --version

# Check PostgreSQL (should be running)
psql --version
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Create Environment Files

#### Root `.env`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ummati?schema=public"
CLERK_SECRET_KEY="sk_test_your_key_here"
RESEND_API_KEY="re_your_key_here"
EMAIL_FROM="notifications@ummati.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### `apps/web/.env.local`
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_key_here"
CLERK_SECRET_KEY="sk_test_your_key_here"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ummati?schema=public"
RESEND_API_KEY="re_your_key_here"
EMAIL_FROM="notifications@ummati.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### `apps/mobile/.env`
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_key_here"
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

#### `packages/api/.env`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ummati?schema=public"
CLERK_SECRET_KEY="sk_test_your_key_here"
RESEND_API_KEY="re_your_key_here"
EMAIL_FROM="notifications@ummati.com"
PORT=2023
```

### 4. Set Up Database

```bash
# Create database
createdb ummati

# Or using PostgreSQL CLI
psql -U postgres -c "CREATE DATABASE ummati;"

# Generate Prisma Client
pnpm --filter db exec prisma generate

# Run migrations
pnpm --filter db exec prisma migrate dev
```

### 5. Start Development

```bash
# Start all services
pnpm dev

# Or start individually:
# Terminal 1: Web (http://localhost:3000)
pnpm --filter web dev

# Terminal 2: Mobile
pnpm --filter mobile start
```

### 6. Test Setup

1. Open `http://localhost:3000`
2. Sign up with a new account
3. Choose a role (Investor or Visionary)
4. Complete onboarding

### 7. Create Admin User

```bash
# Open Prisma Studio
pnpm --filter db exec prisma studio

# Or use SQL:
psql -U postgres -d ummati -c "UPDATE \"User\" SET \"isAdmin\" = true WHERE email = 'your-email@example.com';"
```

Then navigate to `http://localhost:3000/admin`

---

## 🐛 Common Issues

### Database Connection Failed
- Verify PostgreSQL is running: `psql -U postgres -c "SELECT 1;"`
- Check `DATABASE_URL` is correct
- Ensure database exists: `createdb ummati`

### Clerk Authentication Failed
- Verify Clerk keys are correct
- Check environment variables are loaded
- Restart dev server after changing env vars

### Mobile App Can't Connect
- For physical device: Use LAN IP instead of localhost
- For emulator: Use `http://localhost:3000`
- Verify web app is running

### Prisma Client Not Found
```bash
pnpm --filter db exec prisma generate
pnpm install
```

---

## 📝 Environment Variables Checklist

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- [ ] `CLERK_SECRET_KEY` - Clerk secret key
- [ ] `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk key for mobile
- [ ] `EXPO_PUBLIC_API_URL` - API URL for mobile
- [ ] `RESEND_API_KEY` - (Optional) For email notifications
- [ ] `EMAIL_FROM` - (Optional) Email sender address

---

## 🎯 Next Steps

1. ✅ Set up environment variables
2. ✅ Create database and run migrations
3. ✅ Start development servers
4. ✅ Test sign-up and onboarding
5. ✅ Create admin user
6. ✅ Test admin panel

---

For detailed instructions, see [README.md](./README.md)

