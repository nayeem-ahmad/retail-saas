import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./lib/redis";

// 1. Initialize Ratelimiter
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
  analytics: true,
  prefix: "@upstash/ratelimit",
});

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. Auth state & Tenant identification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Try to get tenant_id from user metadata or session if possible
  // For now, we'll use user.id or IP as the rate limit identifier
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const identifier = user?.id || ip;

  // 3. Rate Limiting Check (Task 2)
  if (request.nextUrl.pathname.startsWith("/api")) {
    const { success, limit, reset, remaining } = await ratelimit.limit(
      `ratelimit_${identifier}`
    );

    if (!success) {
      const requestId = Math.random().toString(36).substring(7);
      
      // Task 3: Standardized 429 response
      return NextResponse.json(
        {
          error: {
            code: "too_many_requests",
            message: "Rate limit exceeded. Please try again later.",
            timestamp: new Date().toISOString(),
            requestId,
          },
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  const url = request.nextUrl.clone();

  // 4. Auth check for protected routes
  const isProtectedRoute =
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/api/protected");
  const isAuthRoute =
    url.pathname.startsWith("/signup") || url.pathname.startsWith("/login");

  if (isProtectedRoute && !user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
