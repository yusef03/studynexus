import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // Belt-and-suspenders: middleware already protects this route
  const token = cookies().get("access_token");
  if (!token) redirect(`/${locale}/login`);

  const t = useTranslations("dashboard");

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold">StudyNexus</span>
          <LogoutButton locale={locale} />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>
    </main>
  );
}
