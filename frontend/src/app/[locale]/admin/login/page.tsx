"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminSession } from "@/hooks/useAdminSession";

interface Props {
  params: { locale: string };
}

export default function AdminLoginPage({ params: { locale } }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { saveSession } = useAdminSession();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-studynexus-client": "true",
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail ?? "Authentifizierung fehlgeschlagen.");
        return;
      }

      const data = await res.json();
      saveSession(data.admin_token);
      router.push(`/${locale}/admin`);
      router.refresh();
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-600/20 p-3">
              <KeyRound className="h-6 w-6 text-red-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Admin-Authentifizierung</h1>
          <p className="text-sm text-zinc-500">
            Bestätige dein Passwort für Admin-Operationen (15 Min Session).
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300" htmlFor="password">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-900/30 border border-red-800 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Authentifiziere…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Admin-Session starten
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-600">
          Nach 15 Minuten Inaktivität wird die Session automatisch beendet.
        </p>
      </div>
    </div>
  );
}
