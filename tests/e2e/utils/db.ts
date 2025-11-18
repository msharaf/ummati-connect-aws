import { PrismaClient } from "@ummati/db/client";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let prisma: PrismaClient | null = null;

/**
 * Get test Prisma client connected to SQLite test database
 * Note: SQLite works through Prisma without requiring better-sqlite3 directly
 */
export function getTestPrismaClient(): PrismaClient {
  if (!prisma) {
    // Find project root (3 levels up from tests/e2e/utils)
    const projectRoot = path.resolve(__dirname, "../../../..");
    const testDbPath = path.join(projectRoot, "packages/db/test.db");
    // Use absolute path for Windows compatibility
    const normalizedPath = testDbPath.replace(/\\/g, "/");
    const testDbUrl = `file:${normalizedPath}`;

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });
  }

  return prisma;
}

/**
 * Initialize test database
 */
export async function initTestDatabase(): Promise<void> {
  const projectRoot = path.resolve(__dirname, "../../../..");
  
  // Generate Prisma client for test schema
  execSync(
    "pnpm --filter db generate:test",
    { 
      stdio: "inherit",
      cwd: projectRoot,
      shell: true, // Required for Windows
    }
  );

  // For SQLite test database, we need to use migrate dev to create fresh migrations
  // Since existing migrations are for PostgreSQL, we'll push the schema directly
  const testDbPath = path.join(projectRoot, "packages/db/test.db");
  const normalizedDbPath = testDbPath.replace(/\\/g, "/");
  const testDbUrl = `file:${normalizedDbPath}`;
  
  // Use prisma db push instead of migrate deploy for SQLite (avoids migration mismatch)
  // This directly pushes the schema to the database
  execSync(
    `pnpm --filter db exec cross-env DATABASE_URL=${testDbUrl} prisma db push --schema=./prisma/schema.test.prisma --skip-generate`,
    { 
      stdio: "inherit",
      cwd: projectRoot,
      shell: true, // Required for Windows
    }
  );
}

/**
 * Clean test database (remove all data but keep schema)
 */
export async function cleanTestDatabase(): Promise<void> {
  const client = getTestPrismaClient();

  // Delete in correct order to respect foreign keys
  await client.message.deleteMany();
  await client.match.deleteMany();
  await client.swipe.deleteMany();
  await client.shortlist.deleteMany();
  await client.profileView.deleteMany();
  await client.barakahScore.deleteMany();
  await client.visionaryProfile.deleteMany();
  await client.investorProfile.deleteMany();
  await client.user.deleteMany();
}

/**
 * Close test database connection
 */
export async function closeTestDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Reset test database (clean and seed)
 */
export async function resetTestDatabase(): Promise<void> {
  await cleanTestDatabase();
  // Seed data would go here if needed
}

