import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { BACKEND, bearerHeaders } from "@/lib/backend";
import { SetupForm } from "./SetupForm";

export default async function SetupPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("access_token");
  if (!tokenCookie) redirect(`/${locale}/login`);

  try {
    const res = await fetch(`${BACKEND}/me/program`, {
      headers: bearerHeaders(tokenCookie.value),
      cache: "no-store",
    });
    if (res.status === 401) redirect(`/${locale}/login`);
    if (res.ok) {
      const data = await res.json();
      if (data?.exam_regulation_id) redirect(`/${locale}/dashboard`);
    }
    // 404 → fall through and render the form
  } catch (err) {
    if (isRedirectError(err)) throw err;
    // Backend unreachable — render the form anyway
  }

  return <SetupForm locale={locale} />;
}
