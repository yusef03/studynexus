import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { BACKEND, bearerHeaders } from "@/lib/backend";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/dashboard/SettingsClient";

export default async function SettingsPage({ params: { locale } }: { params: { locale: string } }) {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("access_token");
  
  if (!tokenCookie) redirect(`/${locale}/login`);

  let user = null;
  try {
    const res = await fetch(`${BACKEND}/me`, {
      headers: bearerHeaders(tokenCookie.value),
      cache: "no-store"
    });
    if (res.ok) user = await res.json();
  } catch {}

  if (!user) redirect(`/${locale}/login`);

  const t = await getTranslations("settings");

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <SettingsClient user={user} />
    </div>
  );
}
