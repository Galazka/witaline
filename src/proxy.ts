import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const CANONICAL_HOST = "witaline.pl";

async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}

const protectedRoutes = ["/admin", "/dashboard", "/onboarding"];
const guestRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Redirect www → non-www (301 permanent) before everything else
  if (host.startsWith("www.")) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, { status: 301 });
  }

  const { supabaseResponse, user } = await updateSession(request);

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isGuest = guestRoutes.some((route) => pathname.startsWith(route));

  if (!user && isProtected) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isGuest) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const securityHeaders: Record<string, string> = {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(self), camera=()",
  };

  for (const [key, value] of Object.entries(securityHeaders)) {
    supabaseResponse.headers.set(key, value);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/elevenlabs|api/twilio|api/stripe/webhook|api/mcp|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
