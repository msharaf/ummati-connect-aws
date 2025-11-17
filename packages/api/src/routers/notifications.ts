import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { prisma } from "@ummati/db";

export const notificationsRouter = router({
  // Save push token for the current user
  savePushToken: protectedProcedure
    .input(
      z.object({
        token: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find user by Clerk ID
      const user = await prisma.user.findUnique({
        where: {
          clerkId: ctx.userId
        }
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Update user's push token
      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          pushToken: input.token
        }
      });

      return { success: true };
    })
});

