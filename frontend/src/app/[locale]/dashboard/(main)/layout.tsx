import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { BACKEND, bearerHeaders } from "@/lib/backend";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Settings, UserCircle } from "lucide-react";
import Link from "next/link";
import { MobileQuickAdd } from "@/components/dashboard/MobileQuickAdd";
import { MobileNav } from "@/components/dashboard/MobileNav";

// Edge-runtime safe JWT payload decode
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

export default async function DashboardMainLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("access_token");
  if (!tokenCookie) redirect(`/${locale}/login`);

  const payload = parseJwtPayload(tokenCookie.value);
  const isAdmin = !!payload?.is_admin;

  // Check program — redirect to setup if not selected yet
  try {
    const res = await fetch(`${BACKEND}/me/program`, {
      headers: bearerHeaders(tokenCookie.value),
      cache: "no-store",
    });
    if (res.status === 401) redirect(`/${locale}/login`);
    if (res.status === 404) redirect(`/${locale}/dashboard/setup`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar locale={locale} isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-6">
          <MobileNav locale={locale} isAdmin={isAdmin} />
          <div className="flex-1"></div>
          <div className="flex items-center gap-5">
            <Link href={`/${locale}/dashboard/settings`} className="text-muted-foreground hover:text-primary transition-colors">
              <Settings className="w-5 h-5" />
            </Link>
            <Link href={`/${locale}/dashboard/profile`} className="text-muted-foreground hover:text-primary transition-colors">
              <UserCircle className="w-5 h-5" />
            </Link>
            <div className="h-5 w-px bg-border mx-1"></div>
            <LogoutButton locale={locale} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto relative">
          {children}
          <MobileQuickAdd />
        </main>
      </div>
    </div>
  );
}
