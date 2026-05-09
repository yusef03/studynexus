import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { BACKEND, bearerHeaders } from "@/lib/backend";
import { redirect } from "next/navigation";
import { computeCurrentSemesterNumber, formatSemesterLabel } from "@/lib/semesterUtils";

export default async function ProfilePage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations("profile");
  const tDash = await getTranslations("dashboard");
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("access_token");

  if (!tokenCookie) redirect(`/${locale}/login`);

  let user = null;
  let program = null;
  try {
    const [userRes, progRes] = await Promise.all([
      fetch(`${BACKEND}/me`, { headers: bearerHeaders(tokenCookie.value), cache: "no-store" }),
      fetch(`${BACKEND}/me/program`, { headers: bearerHeaders(tokenCookie.value), cache: "no-store" }),
    ]);
    if (userRes.ok) user = await userRes.json();
    if (progRes.ok) program = await progRes.json();
  } catch {}

  if (!user) redirect(`/${locale}/login`);

  const semesterNum = program?.start_semester
    ? computeCurrentSemesterNumber(program.start_semester)
    : null;
  const semesterLabel = program?.start_semester
    ? formatSemesterLabel(program.start_semester, locale)
    : null;

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>

      <div className="flex items-center justify-center py-10">
        <div className="relative w-full max-w-md bg-gradient-to-br from-background/80 to-muted/40 backdrop-blur-xl border border-primary/10 rounded-2xl shadow-2xl overflow-hidden group">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-700"></div>

          <div className="relative p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80">StudyNexus ID</h3>
                <p className="text-[10px] text-muted-foreground mt-1">{t("idSubtitle")}</p>
              </div>
              {semesterNum !== null && (
                <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1">
                  <span className="text-xs font-bold text-primary">{tDash("semester.label", { n: semesterNum })}</span>
                </div>
              )}
            </div>

            <div className="flex gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0 z-10">
                <div className="h-32 w-24 rounded-xl bg-muted border border-primary/20 overflow-hidden relative shadow-lg">
                  {user.profile_picture_url ? (
                    <img src={user.profile_picture_url} alt="Profile" className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                  )}
                </div>
              </div>

              {/* User Details */}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">{t("fields.name")}</p>
                  <p className="font-bold text-lg leading-tight">{user.full_name || t("unknown")}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold">{t("fields.matrikelnummer")}</p>
                    <p className="font-medium text-sm font-mono">{user.matrikelnummer || t("empty")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold">{t("fields.birthDate")}</p>
                    <p className="font-medium text-sm">{user.birth_date ? new Date(user.birth_date).toLocaleDateString(locale === "de" ? "de-DE" : "en-US") : t("empty")}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">{t("fields.university")}</p>
                  <p className="font-medium text-sm">{user.university || "Hochschule Hannover"}</p>
                </div>

                {program && (
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold">{t("fields.program")}</p>
                    <p className="font-medium text-sm">{program.program?.name || t("empty")}</p>
                    {semesterLabel && (
                      <p className="text-[10px] text-muted-foreground">{tDash("semester.startedWith", { sem: semesterLabel })}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Barcode / Footer */}
            <div className="mt-8 pt-6 border-t border-muted-foreground/10 flex justify-between items-center">
              <div className="flex gap-1 h-8 opacity-40 mix-blend-overlay">
                <div className="w-1 bg-foreground h-full"></div>
                <div className="w-2 bg-foreground h-full"></div>
                <div className="w-1 bg-foreground h-full"></div>
                <div className="w-0.5 bg-foreground h-full"></div>
                <div className="w-1.5 bg-foreground h-full"></div>
                <div className="w-3 bg-foreground h-full"></div>
                <div className="w-1 bg-foreground h-full"></div>
                <div className="w-0.5 bg-foreground h-full"></div>
                <div className="w-2 bg-foreground h-full"></div>
                <div className="w-1.5 bg-foreground h-full"></div>
                <div className="w-1 bg-foreground h-full"></div>
                <div className="w-2 bg-foreground h-full"></div>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground">{user.id.split("-")[0].toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <a href={`/${locale}/dashboard/settings`} className="text-sm text-primary hover:underline flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"></path><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
          {t("editLink")}
        </a>
      </div>
    </div>
  );
}
