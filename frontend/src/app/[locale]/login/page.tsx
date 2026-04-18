import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { registered?: string; from?: string };
}) {
  const t = useTranslations("auth");

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("login.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
        </div>

        {searchParams.registered && (
          <p className="text-sm text-center text-green-700 bg-green-50 border border-green-200 rounded-md py-2 px-3">
            {t("register.success")}
          </p>
        )}

        <LoginForm locale={locale} redirectTo={searchParams.from} />
      </div>
    </main>
  );
}
