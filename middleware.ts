import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { routeAccess, UserRole } from "@/lib/auth";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes
  if (isPublicRoute(request)) return;

  // Protect all other routes — redirect to sign-in if not authenticated
  await auth.protect();

  // Get role from session claims
  const { sessionClaims } = await auth();
  const metadata = sessionClaims?.metadata as { role?: UserRole } | undefined;
  const role = metadata?.role ?? null;

  const pathname = request.nextUrl.pathname;

  // Find which route rule applies
  const matchedRoute = Object.keys(routeAccess).find((route) =>
    pathname.startsWith(route)
  );

  if (matchedRoute) {
    const allowedRoles = routeAccess[matchedRoute];

    // No role set at all
    if (!role) {
      const url = new URL("/sign-in", request.url);
      return NextResponse.redirect(url);
    }

    // Role not allowed for this route
    if (!allowedRoles.includes(role)) {
      // Redirect teacher to their view, others to admin
      const fallback = role === "teacher" ? "/teacher" : "/admin";
      const url = new URL(fallback, request.url);
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};