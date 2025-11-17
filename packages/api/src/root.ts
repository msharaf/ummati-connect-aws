import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { userRouter } from "./routers/user";
import { matchmakingRouter } from "./routers/matchmaking";

// Root router
export const rootRouter = router({
  auth: authRouter,
  user: userRouter,
  matchmaking: matchmakingRouter
});

export type AppRouter = typeof rootRouter;

