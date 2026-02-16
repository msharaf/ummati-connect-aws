import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && error.cause.name === "ZodError"
            ? error.cause
            : null
      }
    };
  }
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - throws UNAUTHORIZED when ctx.userId is null.
 * ctx.userId is populated by createContext after verifying Bearer token.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (ctx.userId == null) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId
    }
  });
});

