import type { PrismaClient } from "@prisma/client";

/**
 * Create a match between two users
 */
export async function createMatch(
  prisma: PrismaClient,
  userAId: string,
  userBId: string
) {
  // Create swipes in both directions
  await prisma.swipe.create({
    data: {
      swiperId: userAId,
      targetId: userBId,
      direction: "LIKE",
    },
  });

  await prisma.swipe.create({
    data: {
      swiperId: userBId,
      targetId: userAId,
      direction: "LIKE",
    },
  });

  // Create match
  return prisma.match.create({
    data: {
      userAId,
      userBId,
    },
  });
}

/**
 * Create a message in a match
 */
export async function createMessage(
  prisma: PrismaClient,
  matchId: string,
  senderId: string,
  text: string
) {
  return prisma.message.create({
    data: {
      matchId,
      senderId,
      text,
      readBy: "[]",
    },
  });
}

