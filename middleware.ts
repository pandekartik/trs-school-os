import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routeAccess } from "@/lib/auth";

const publicRoutes = ["/sign-in", "/reset-password"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const { data: teacher } = user
    ? await supabase
        .from("teacher")
        .select("role")
        .eq("auth_user_id", user.id)
        .maybeSingle()
    : { data: null };
  const role = teacher?.role ?? null;
  const landingRoute =
    role === "admin" || role === "coordinator"
      ? "/admin"
      : "/teacher";

  // Allow public routes
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    if (pathname.startsWith("/reset-password")) {
      return supabaseResponse;
    }
    // If already signed in, redirect to dashboard
    if (user) {
      return NextResponse.redirect(new URL(landingRoute, request.url));
    }
    return supabaseResponse;
  }

  // Not signed in — redirect to sign-in
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Check role-based access
  const matchedRoute = Object.keys(routeAccess)
    .sort((a, b) => b.length - a.length)
    .find((route) => pathname.startsWith(route));

  if (matchedRoute) {
    const allowed = routeAccess[matchedRoute];

    if (!role) {
      if (pathname.startsWith("/teacher")) {
        return supabaseResponse;
      }
      return NextResponse.redirect(new URL("/teacher", request.url));
    }

    if (!allowed.includes(role)) {
      const fallback = role === "teacher" ? "/teacher" : "/admin";
      return NextResponse.redirect(new URL(fallback, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
