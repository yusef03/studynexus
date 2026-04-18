import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          {t("description")}
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg">{t("cta.register")}</Button>
          <Button variant="outline" size="lg">{t("cta.login")}</Button>
        </div>
      </div>
    </main>
  );
}
