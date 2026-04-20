"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerifyForm } from "./VerifyForm";

interface RegisterFormProps {
  locale: string;
}

export function RegisterForm({ locale }: RegisterFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const password = data.get("password") as string;
    const confirm = data.get("confirm_password") as string;

    if (password !== confirm) {
      setError(t("errors.passwordMismatch"));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `${data.get("email")}@stud.hs-hannover.de`,
          password,
          full_name: data.get("full_name") || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        let errorMessage = t("errors.registerFailed");
        if (Array.isArray(body.detail) && body.detail.length > 0) {
          errorMessage = body.detail[0].msg;
        } else if (typeof body.detail === "string") {
          errorMessage = body.detail;
        }
        setError(errorMessage);
        return;
      }

      setRegisteredEmail(`${data.get("email")}@stud.hs-hannover.de`);
    } catch {
      setError(t("errors.networkError"));
    } finally {
      setLoading(false);
    }
  }

  if (registeredEmail) {
    return <VerifyForm locale={locale} email={registeredEmail} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">{t("fields.fullName")}</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          placeholder="Max Mustermann"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("fields.email")}</Label>
        <div className="flex rounded-md shadow-sm">
          <Input
            id="email"
            name="email"
            type="text"
            required
            pattern="[a-zA-Z0-9.\-_]+"
            title="Darf keine Leer- oder Sonderzeichen (wie @) enthalten"
            autoComplete="username"
            placeholder="max.mustermann"
            className="rounded-r-none focus-visible:z-10"
          />
          <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap">
            @stud.hs-hannover.de
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("fields.password")}</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            aria-label={showPassword ? t("fields.hidePassword") : t("fields.showPassword")}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">{t("fields.confirmPassword")}</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            name="confirm_password"
            type={showConfirm ? "text" : "password"}
            required
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            aria-label={showConfirm ? t("fields.hidePassword") : t("fields.showPassword")}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
          >
            {showConfirm ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("register.loading") : t("register.submit")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("register.hasAccount")}{" "}
        <Link
          href={`/${locale}/login`}
          className="underline underline-offset-4 hover:text-foreground"
        >
          {t("register.loginLink")}
        </Link>
      </p>
    </form>
  );
}
