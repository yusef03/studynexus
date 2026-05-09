import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BACKEND, bearerHeaders } from "@/lib/backend";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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
      <AdminSidebar locale={locale} adminName={adminName} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar (admin label) */}
        <div className="md:hidden h-12 flex items-center gap-2 px-4 border-b bg-zinc-950 text-zinc-100">
          <span className="text-xs font-bold tracking-widest text-red-400">ADMIN</span>
          <span className="text-xs text-zinc-400">StudyNexus</span>
        </div>

        {/* Session warning banner */}
        <AdminSessionBanner locale={locale} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
