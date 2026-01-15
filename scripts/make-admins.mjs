/**
 * Script to make specific users application admins
 * Run with: pnpm --filter db exec node ../../scripts/make-admins.mjs
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

  for (const email of adminEmails) {
    try {
      const result = await prisma.user.updateMany({
        where: { email },
        data: { isAdmin: true }
      });

      if (result.count > 0) {
        console.log(`✅ Updated ${email} to admin (${result.count} user(s))`);
      } else {
        console.log(`⚠️  User not found: ${email}`);
      }
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
