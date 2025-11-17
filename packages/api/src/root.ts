import { router } from "./trpc";
import { authRouter } from "./routers/auth";

// Root router
export const rootRouter = router({
  auth: authRouter
});

export type AppRouter = typeof rootRouter;

