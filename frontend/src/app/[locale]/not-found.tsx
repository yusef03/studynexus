"use client";

import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("dashboard");
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-lg text-muted-foreground">Not found</p>
    </div>
  );
}
