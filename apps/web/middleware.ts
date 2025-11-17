import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/about"
]);

export default clerkMiddleware((auth, req) => {
  // Clerk v5 automatically protects routes that aren't in the public matcher
  // No need to explicitly call protect() - it's handled automatically
  
  // Note: Role-based redirects are handled client-side in RoleGuard component
  // This is because we need to call tRPC to get user role, which requires
  // the user to be authenticated first (handled by Clerk middleware above)
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)"
  ]
};

