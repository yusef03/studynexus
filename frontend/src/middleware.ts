import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);

const intlMiddleware = createMiddleware({
  locales: ["de", "en"],
  defaultLocale: "de",
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
