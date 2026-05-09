import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BACKEND, bearerHeaders } from "@/lib/backend";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";
import { AdminSessionBanner } from "@/components/admin/AdminSessionBanner";

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

async function fetchAdminName(token: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${BACKEND}/admin/me`, {
      headers: bearerHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.full_name ?? data.email ?? undefined;
  } catch {
    return undefined;
  }
}

export default async function AdminLayout({ children, params: { locale } }: Props) {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("access_token");
  if (!tokenCookie) redirect(`/${locale}/login`);

  const adminName = await fetchAdminName(tokenCookie.value);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <AdminSidebar locale={locale} adminName={adminName} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with hamburger + slide drawer */}
        <AdminMobileHeader locale={locale} adminName={adminName} />

        {/* Session warning / info banner */}
        <AdminSessionBanner locale={locale} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
