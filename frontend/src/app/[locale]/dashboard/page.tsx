import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { StudyDashboard } from "@/components/study/StudyDashboard";
import { BACKEND, bearerHeaders } from "@/lib/backend";

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("access_token");
  if (!tokenCookie) redirect(`/${locale}/login`);

  // Check program — redirect to setup if not selected yet
  try {
    const res = await fetch(`${BACKEND}/me/program`, {
      headers: bearerHeaders(tokenCookie.value),
      cache: "no-store",
    });
    if (res.status === 401) redirect(`/${locale}/login`);
    if (res.status === 404) redirect(`/${locale}/dashboard/setup`);
  } catch {
    // Backend unreachable — render page, client components will show their own errors
  }

  const t = await getTranslations("dashboard");

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold">StudyNexus</span>
          <LogoutButton locale={locale} />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <StudyDashboard />
      </div>
    </main>
  );
}
