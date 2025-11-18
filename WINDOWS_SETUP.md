# Windows Setup Guide for E2E Testing

## Overview

This guide helps you set up the E2E testing environment on Windows, including handling native dependencies.

## Issue: better-sqlite3 Native Compilation

The `better-sqlite3` package requires native compilation on Windows, which needs Visual Studio Build Tools with Windows SDK.

## Solutions

### Option 1: Install Windows Build Tools (Recommended for Full Support)

If you want to use `better-sqlite3` directly (though it's not strictly required for E2E tests):

1. **Install Visual Studio Build Tools**:
   - Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - Install with "Desktop development with C++" workload
   - Include "Windows SDK" (latest version)

2. **Or use windows-build-tools** (alternative):
   ```powershell
   npm install -g windows-build-tools
   ```

3. **Then install optional dependencies**:
   ```powershell
   pnpm install --include-optional
   ```

### Option 2: Skip better-sqlite3 (Current Setup - Recommended)

The E2E tests **don't actually require `better-sqlite3`** because:
- Prisma Client handles SQLite through its own driver
- The test database utilities use Prisma Client, not better-sqlite3 directly
- SQLite works through Prisma's built-in driver

**Current Status**: `better-sqlite3` is set as `optionalDependencies`, so installation will continue even if it fails.

### Option 3: Use In-Memory SQLite (Alternative)

If you encounter SQLite issues, you can modify the test database URL to use in-memory:

```typescript
// In tests/e2e/utils/db.ts
const testDbUrl = "file::memory:?cache=shared";
```

## Running E2E Tests on Windows

### 1. Install Dependencies

```powershell
# This will install everything except better-sqlite3 if build fails
pnpm install

# If you want to try installing optional dependencies:
pnpm install --include-optional
```

### 2. Set Up Test Database

```powershell
# Generate Prisma client for test schema (Windows-compatible)
pnpm prisma:generate:test

# Or directly:
pnpm --filter db generate:test

# Run migrations
pnpm --filter db migrate:test

# Or directly:
pnpm --filter db exec cross-env DATABASE_URL=file:./test.db prisma migrate deploy --schema=./prisma/schema.test.prisma
```

### 3. Run E2E Tests

```powershell
# Run all E2E tests
pnpm test:e2e

# Run specific suites
pnpm test:e2e:web
pnpm test:e2e:api
```

## Windows-Specific Notes

### PowerShell Compatibility

All scripts should work in PowerShell. If you encounter path issues:

```powershell
# Use forward slashes in paths or escape backslashes
$env:DATABASE_URL = "file:./packages/db/test.db"
```

### File Paths

The test utilities normalize paths for Windows compatibility:
- Uses `path.join()` for cross-platform paths
- Normalizes backslashes to forward slashes for SQLite URLs

### SQLite Database Location

Test database location: `packages/db/test.db`

You can customize this by setting `DATABASE_URL_TEST` environment variable:

```powershell
$env:DATABASE_URL_TEST = "file:C:/path/to/test.db"
```

## Troubleshooting

### Issue: "Cannot find module 'better-sqlite3'"

**Solution**: This is expected if you skipped installation. It's not required because Prisma handles SQLite internally.

### Issue: "SQLite database locked"

**Solution**: 
- Close any processes accessing the test database
- Delete `packages/db/test.db` and re-run migrations
- Use in-memory database for tests (see Option 3 above)

### Issue: Prisma Client Generation Fails

**Solution**:
```powershell
# Clean and regenerate
rm -r packages/db/node_modules/.prisma
pnpm prisma:generate:test
```

### Issue: Playwright Browsers Not Installed

**Solution**:
```powershell
cd apps/web
npx playwright install
```

## Alternative: Use Docker (Recommended for CI/CD)

For consistent testing across platforms, consider using Docker:

```dockerfile
# Dockerfile.test
FROM node:20
# ... setup ...
```

This avoids Windows-specific build issues entirely.

## Verification

Verify your setup works:

```powershell
# Test Prisma connection
pnpm --filter db prisma studio --schema=./packages/db/prisma/schema.test.prisma

# Test API E2E tests
pnpm test:e2e:api

# Test Web E2E tests (requires app to be running)
pnpm test:e2e:web
```

## Summary

- ✅ E2E tests work without `better-sqlite3` (it's optional)
- ✅ Prisma handles SQLite through its own driver
- ✅ All test utilities are Windows-compatible
- ✅ Installation continues even if better-sqlite3 fails
- ⚠️ If you want better-sqlite3, install Windows Build Tools first

Your current installation should have completed successfully despite the better-sqlite3 warning!

