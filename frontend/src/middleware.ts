import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);

const intlMiddleware = createMiddleware({
  locales: ["de", "en"],
  defaultLocale: "de",
});

// Edge-runtime safe JWT payload decode (no signature verification — middleware only)
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split(".")[1];
    if (!b64) return null;
    const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (padded.length % 4)) % 4;
    return JSON.parse(atob(padded + "=".repeat(pad)));
  } catch {
    return null;
  }
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF Protection for API proxies
  if (pathname.startsWith("/api/")) {
    if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
      const origin = request.headers.get("origin") ?? request.headers.get("referer");
      const host = request.headers.get("host");
      const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      if (origin) {
        try {
          const originUrl = new URL(origin);
          if (originUrl.host !== host && !origin.startsWith(allowedOrigin)) {
            return new NextResponse("Forbidden - CSRF Origin Mismatch", { status: 403 });
          }
        } catch {
          return new NextResponse("Forbidden - Invalid Origin", { status: 403 });
        }
      }

      const clientHeader = request.headers.get("x-studynexus-client");
      if (clientHeader !== "true") {
        return new NextResponse("Forbidden - Missing Client Header", { status: 403 });
      }
    }
    return NextResponse.next();
  }

  // Strip the locale segment to get the bare path
  const bare = pathname.replace(/^\/(de|en)/, "") || "/";
  const locale = pathname.startsWith("/en") ? "en" : "de";

  // Admin route guard — requires JWT + is_admin=true
  if (bare.startsWith("/admin")) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const payload = parseJwtPayload(token);
    if (!payload?.is_admin) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
    return intlMiddleware(request);
  }

  // Regular protected routes
  if (!PUBLIC_PATHS.has(bare)) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
