# Fix Prisma Client Issue

## Problem
The Prisma client was generated from the SQLite test schema instead of the PostgreSQL schema, causing the error:
```
error: Error validating datasource `db`: the URL must start with the protocol `file:`.
```

## Solution

### Step 1: Stop the Dev Server
Press `Ctrl+C` in the terminal where `pnpm dev:web` is running.

### Step 2: Regenerate Prisma Client from PostgreSQL Schema

```bash
pnpm --filter db generate
```

This will regenerate the Prisma client from `packages/db/prisma/schema.prisma` (PostgreSQL) instead of `schema.test.prisma` (SQLite).

### Step 3: Verify DATABASE_URL

Make sure your `DATABASE_URL` is set to PostgreSQL, not SQLite:

**For PostgreSQL (correct):**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ummati?schema=public
```

**NOT SQLite (wrong):**
```env
DATABASE_URL=file:./test.db
```

### Step 4: Restart Dev Server

```bash
pnpm dev:web
```

## Why This Happened

When we ran `pnpm --filter db generate:test` for E2E tests, it generated a Prisma client from the SQLite schema. This client overwrote or conflicted with the PostgreSQL client needed for development.

## Prevention

- Always use `pnpm --filter db generate` for development (PostgreSQL)
- Only use `pnpm --filter db generate:test` when specifically working on E2E tests
- The test client uses a different schema file (`schema.test.prisma`) and should not interfere with the main client

