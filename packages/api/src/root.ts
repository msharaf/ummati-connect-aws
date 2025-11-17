import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { userRouter } from "./routers/user";
import { matchmakingRouter } from "./routers/matchmaking";
import { notificationsRouter } from "./routers/notifications";
import { investorRouter } from "./routers/investor";
import { visionaryRouter } from "./routers/visionary";
import { visionaryDashboardRouter } from "./routers/visionaryDashboard";
import { investorProfileRouter } from "./routers/investorProfile";

// Root router
export const rootRouter = router({
  auth: authRouter,
  user: userRouter,
  matchmaking: matchmakingRouter,
  notifications: notificationsRouter,
  investor: investorRouter,
  visionary: visionaryRouter,
  visionaryDashboard: visionaryDashboardRouter,
  investorProfile: investorProfileRouter
});

export type AppRouter = typeof rootRouter;

