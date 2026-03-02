import { router, publicProcedure, protectedProcedure } from "../trpc";

export const authRouter = router({
  // Get current user info
  me: protectedProcedure.query(async ({ ctx }) => {
    // This will be implemented with database queries
    return {
      userId: ctx.userId,
      message: "User authenticated"
    };
  }),

  // Health check
  ping: publicProcedure.query(() => {
    return { message: "pong" };
  })
});

