import { TEST_USERS } from "../utils/auth";
import type { PrismaClient } from "@prisma/client";

/**
 * Create test founder user in database
 */
export async function createTestFounder(prisma: PrismaClient) {
  return prisma.user.create({
    data: {
      clerkId: TEST_USERS.founder.clerkId,
      email: TEST_USERS.founder.email,
      name: TEST_USERS.founder.name,
      role: TEST_USERS.founder.role,
    },
  });
}

/**
 * Create test investor user in database
 */
export async function createTestInvestor(prisma: PrismaClient) {
  return prisma.user.create({
    data: {
      clerkId: TEST_USERS.investor.clerkId,
      email: TEST_USERS.investor.email,
      name: TEST_USERS.investor.name,
      role: TEST_USERS.investor.role,
    },
  });
}

/**
 * Create test admin user in database
 */
export async function createTestAdmin(prisma: PrismaClient) {
  return prisma.user.create({
    data: {
      clerkId: TEST_USERS.admin.clerkId,
      email: TEST_USERS.admin.email,
      name: TEST_USERS.admin.name,
      role: TEST_USERS.admin.role,
      isAdmin: true,
    },
  });
}

/**
 * Create test founder with complete profile
 */
export async function createTestFounderWithProfile(prisma: PrismaClient) {
  const user = await createTestFounder(prisma);
  
  const profile = await prisma.visionaryProfile.create({
    data: {
      userId: user.id,
      startupName: "Test Startup",
      tagline: "Building the future",
      startupStage: "MVP",
      sector: "Technology",
      description: "A test startup",
      fundingAsk: 50000,
      location: "San Francisco, CA",
      isApproved: true,
    },
  });

  return { user, profile };
}

/**
 * Create test investor with complete profile
 */
export async function createTestInvestorWithProfile(prisma: PrismaClient) {
  const user = await createTestInvestor(prisma);
  
  const profile = await prisma.investorProfile.create({
    data: {
      userId: user.id,
      minTicketSize: 10000,
      maxTicketSize: 100000,
      preferredSectors: JSON.stringify(["Technology", "Fintech"]),
      geoFocus: "Global",
      hasAcceptedHalalTerms: true,
    },
  });

  return { user, profile };
}

