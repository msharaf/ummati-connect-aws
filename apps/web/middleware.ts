import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@ummati/db";

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

  // User is authenticated - check onboarding status
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        investorProfile: true,
        visionaryProfile: true
      }
    });

    if (user) {
      const onboardingComplete =
        user.role !== null &&
        ((user.role === "INVESTOR" && user.investorProfile !== null) ||
          (user.role === "VISIONARY" && user.visionaryProfile !== null));

      // If onboarding is not complete, force them to stay in onboarding
      if (!onboardingComplete && !isOnboardingRoute(req)) {
        return NextResponse.redirect(new URL("/onboarding/choose-role", req.url));
      }

      // If onboarding is complete but they're trying to access onboarding, redirect to dashboard
      if (onboardingComplete && isOnboardingRoute(req)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  } catch (error) {
    console.error("Error checking user onboarding status:", error);
    // On error, allow the request to proceed
  }

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

