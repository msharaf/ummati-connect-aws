import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/about"
]);

// Define onboarding routes
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const url = req.nextUrl.clone();

  // If user is not authenticated, let Clerk handle protection
  if (!userId) {
    // Allow public routes and onboarding routes
    if (isPublicRoute(req) || isOnboardingRoute(req)) {
      return NextResponse.next();
    }
    // Redirect to sign-in for protected routes
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", url.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // User is authenticated
  // Note: We can't use Prisma in middleware (Edge Runtime limitation)
  // Onboarding checks are handled client-side in DashboardGuard and server-side in page components
  // Middleware only handles basic auth redirects
  
  // Allow the request to proceed - detailed onboarding checks happen in components
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)"
  ]
};

