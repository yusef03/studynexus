import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);

const intlMiddleware = createMiddleware({
  locales: ["de", "en"],
  defaultLocale: "de",
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF Protection for API proxies
  if (pathname.startsWith("/api/")) {
    if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
      const origin = request.headers.get("origin") ?? request.headers.get("referer");
      const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      if (!origin || !origin.startsWith(allowedOrigin)) {
        return new NextResponse("Forbidden - CSRF Origin Mismatch", { status: 403 });
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

  if (!PUBLIC_PATHS.has(bare)) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
      const locale = pathname.startsWith("/en") ? "en" : "de";
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
