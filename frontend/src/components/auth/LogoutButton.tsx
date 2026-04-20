"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  locale: string;
}

export function LogoutButton({ locale }: LogoutButtonProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { 
      method: "POST",
      headers: { "x-studynexus-client": "true" }
    });
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleLogout} disabled={loading}>
      {t("logout")}
    </Button>
  );
}
