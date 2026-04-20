import { useTranslations } from "next-intl";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Logo } from "@/components/ui/Logo";
import { PartnerBadge } from "@/components/ui/PartnerBadge";

export default function RegisterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("auth");

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <Logo className="h-24 w-auto mx-auto mb-6" />
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("register.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("register.subtitle")}</p>
        </div>

        <RegisterForm locale={locale} />

        <PartnerBadge />
      </div>
    </main>
  );
}
