/**
 * Script to make specific users application admins
 * Run with: pnpm --filter db exec node scripts/make-admins.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adminEmails = [
  "rifatc100@gmail.com",
  "mouhabsharaf@gmail.com",
  "khairul.nual@gmail.com"
];

async function makeAdmins() {
  console.log("🔧 Making users admins...\n");
  console.log("Note: Users must exist in the database (signed in via Clerk) to be updated.\n");

  for (const email of adminEmails) {
    try {
      // Check if user exists first
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { email: true, isAdmin: true, name: true }
      });

      if (!existingUser) {
        console.log(`⚠️  User not found: ${email}`);
        console.log(`   → This user exists in Clerk but hasn't signed in yet.`);
        console.log(`   → They will automatically be made admin when they first sign in.\n`);
        continue;
      }

      if (existingUser.isAdmin) {
        console.log(`ℹ️  ${email} is already an admin\n`);
        continue;
      }

      // Update to admin
      const result = await prisma.user.update({
        where: { email },
        data: { isAdmin: true }
      });

      console.log(`✅ Updated ${email} (${result.name || "No name"}) to admin\n`);
    } catch (error) {
      console.error(`❌ Error updating ${email}:`, error);
    }
  }

  // Verify the updates
  console.log("\n📋 Verifying admin status...\n");
  const admins = await prisma.user.findMany({
    where: {
      email: { in: adminEmails }
    },
    select: {
      email: true,
      isAdmin: true,
      name: true
    }
  });

  console.log("Current admin status:");
  admins.forEach(user => {
    const status = user.isAdmin ? "✅ ADMIN" : "❌ Not admin";
    console.log(`  ${user.email} (${user.name || "No name"}) - ${status}`);
  });

  await prisma.$disconnect();
}

makeAdmins()
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
