# Database Setup Overview

## Database Configuration

The Ummati monorepo uses **two separate databases** for different purposes:

### 1. **Development/Production Database** (PostgreSQL in Docker)
- **Type**: PostgreSQL 16
- **Location**: Docker container (`ummati-postgres`)
- **Schema**: `packages/db/prisma/schema.prisma`
- **Purpose**: Development and production use
- **Connection**: `postgresql://one_ummah:ummati_password@localhost:5432/ummati?schema=public`
- **User**: `one_ummah`
- **Password**: `ummati_password`
- **Database**: `ummati`

### 2. **E2E Test Database** (SQLite)
- **Type**: SQLite
- **Location**: `packages/db/test.db` (file-based)
- **Schema**: `packages/db/prisma/schema.test.prisma`
- **Purpose**: Isolated E2E testing
- **Connection**: `file:./packages/db/test.db`

## Why Two Databases?

1. **Isolation**: E2E tests use a completely separate database, so they won't affect your dev data
2. **Speed**: SQLite is much faster for tests (no network overhead, in-memory option)
3. **Simplicity**: No need to set up Docker for tests
4. **CI/CD**: SQLite works in CI environments without Docker setup

## Current Status

✅ **PostgreSQL Docker Container**: Running
- Container name: `ummati-postgres`
- Status: Up and running
- Port: `5432`
- Database: `ummati`

✅ **E2E Test Database**: Not yet created (will be created when running tests)

## Managing PostgreSQL Container

### Check Status
```powershell
docker ps --filter "name=ummati-postgres"
```

### Start Container (if stopped)
```powershell
docker start ummati-postgres
```

### Stop Container
```powershell
docker stop ummati-postgres
```

### View Logs
```powershell
docker logs ummati-postgres
```

### Connect to Database
```powershell
# Using docker exec with correct user
docker exec -it ummati-postgres psql -U one_ummah -d ummati

# Or using local psql (if installed)
psql -h localhost -U one_ummah -d ummati
# Password: ummati_password

# Check container environment variables
docker exec ummati-postgres env | Select-String -Pattern "POSTGRES"
```

### Reset Database (DANGER: deletes all data)
```powershell
# Stop container
docker stop ummati-postgres

# Remove container and volume
docker rm -v ummati-postgres

# Start fresh
docker run --name ummati-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ummati -p 5432:5432 -d postgres:14
```

## Running Migrations

### Development Database (PostgreSQL)
```powershell
# Run migrations on dev database
pnpm --filter db migrate:dev

# Or deploy migrations
pnpm --filter db migrate:deploy
```

### E2E Test Database (SQLite)
```powershell
# Generate test schema Prisma client
pnpm prisma:generate:test

# Run migrations on test database
pnpm --filter db migrate:test
```

## Environment Variables

### Development (.env files)
**`packages/api/.env`** (if exists):
```
DATABASE_URL=postgresql://one_ummah:ummati_password@localhost:5432/ummati?schema=public
```

**`packages/db/.env`** (if exists):
```
DATABASE_URL=postgresql://one_ummah:ummati_password@localhost:5432/ummati?schema=public
```

**Note**: Your Docker container uses:
- User: `one_ummah`
- Password: `ummati_password`
- Database: `ummati`
- Port: `5432`

### E2E Tests (automatically set)
- Uses SQLite file: `file:./packages/db/test.db`
- Set automatically by test scripts

## Verifying Database Connection

### Check PostgreSQL Connection
```powershell
# Test connection from Node.js
node -e "const {PrismaClient} = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('✅ Connected!')).catch(e => console.error('❌ Error:', e));"
```

### Check Prisma Client
```powershell
# Verify Prisma client is generated
pnpm --filter db prisma generate

# Open Prisma Studio (for dev DB)
pnpm --filter db prisma studio
```

## Troubleshooting

### Issue: "Can't reach database server"
- Check if Docker container is running: `docker ps | grep postgres`
- Check if port 5432 is available: `netstat -an | grep 5432`
- Verify DATABASE_URL is correct

### Issue: "Database does not exist"
- Connect to PostgreSQL: `docker exec -it ummati-postgres psql -U postgres`
- Create database: `CREATE DATABASE ummati;`

### Issue: E2E Tests Fail
- Verify test database file exists: `packages/db/test.db`
- Regenerate test schema: `pnpm prisma:generate:test`
- Run migrations: `pnpm --filter db migrate:test`

## Summary

- ✅ Your PostgreSQL Docker container is running correctly
- ✅ Dev/Production uses PostgreSQL (`ummati-postgres` container)
- ✅ E2E tests use isolated SQLite database (`packages/db/test.db`)
- ✅ Both databases are completely separate (no data conflicts)

Your database setup is correct! The E2E tests will automatically use SQLite, while your development work uses the PostgreSQL Docker container.

