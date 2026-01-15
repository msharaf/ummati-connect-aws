/**
 * Script to check existing users in the database
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUsers() {
  console.log("📋 Checking all users in database...\n");
  
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  console.log(`Found ${users.length} user(s):\n`);
  
  users.forEach(user => {
    const adminStatus = user.isAdmin ? "✅ ADMIN" : "❌ Not admin";
    console.log(`  ${user.email} (${user.name || "No name"}) - ${adminStatus}`);
  });

  await prisma.$disconnect();
}

checkUsers()
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
