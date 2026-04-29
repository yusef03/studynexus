"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function SettingsClient({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("settings");

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const old_password = formData.get("old_password") as string;
    const new_password = formData.get("new_password") as string;
    const confirm_password = formData.get("confirm_password") as string;

    if (new_password !== confirm_password) {
      setError(t("account.passwordMismatch"));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password, new_password })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || t("account.passwordError"));
      } else {
        setSuccess(t("account.passwordSuccess"));
        (e.target as HTMLFormElement).reset();
      }
    } catch {
      setError(t("account.networkError"));
    } finally {
      setLoading(false);
    }
  }

  function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value;
    const currentPathname = pathname;
    const segments = currentPathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 flex-1">
      {/* Navigation Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-1">
        <button 
          onClick={() => setActiveTab("profile")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === "profile" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          {t("tabs.profile")}
        </button>
        <button 
          onClick={() => setActiveTab("account")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === "account" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          {t("tabs.account")}
        </button>
        <button 
          onClick={() => setActiveTab("appearance")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === "appearance" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          {t("tabs.appearance")}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-card border rounded-xl shadow-sm p-6">
        {activeTab === "profile" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-medium">{t("profile.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("profile.description")}</p>
            </div>
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label>{t("profile.fullName")}</Label>
                <Input defaultValue={user.full_name} disabled className="bg-muted/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("profile.matrikelnummer")}</Label>
                  <Input defaultValue={user.matrikelnummer} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.birthDate")}</Label>
                  <Input type="date" defaultValue={user.birth_date ? user.birth_date.split("T")[0] : ""} disabled className="bg-muted/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("profile.university")}</Label>
                <Input defaultValue={user.university} disabled className="bg-muted/50" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "account" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-medium">{t("account.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("account.description")}</p>
            </div>
            
            <div className="space-y-2">
              <Label>{t("account.emailLabel")}</Label>
              <Input type="email" defaultValue={user.email} disabled className="bg-muted/50" />
              <p className="text-[10px] text-muted-foreground">{t("account.emailHint")}</p>
            </div>

            <div className="pt-4 border-t mt-6">
              <h4 className="text-md font-medium mb-4">{t("account.changePasswordTitle")}</h4>
              <form onSubmit={handlePasswordChange} className="grid gap-4">
                <div className="space-y-2">
                  <Label>{t("account.oldPassword")}</Label>
                  <Input name="old_password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label>{t("account.newPassword")}</Label>
                  <Input name="new_password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label>{t("account.confirmPassword")}</Label>
                  <Input name="confirm_password" type="password" required />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && <p className="text-sm text-green-500">{success}</p>}
                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? t("account.savingButton") : t("account.saveButton")}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-lg font-medium">{t("appearance.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("appearance.description")}</p>
            </div>
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label>{t("appearance.language")}</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  onChange={handleLanguageChange}
                  value={pathname.startsWith('/en') ? 'en' : 'de'}
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="space-y-2 opacity-50 cursor-not-allowed">
                <Label>{t("appearance.theme")}</Label>
                <select disabled className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed">
                  <option value="system">{t("appearance.themeSystem")}</option>
                  <option value="light">{t("appearance.themeLight")}</option>
                  <option value="dark">{t("appearance.themeDark")}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
