"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VerifyFormProps {
  locale: string;
  email: string;
}

export function VerifyForm({ locale, email }: VerifyFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-studynexus-client": "true" },
        body: JSON.stringify({ email, code }),
      });

      if (!res.ok) {
        const body = await res.json();
        let errorMessage = "Verifizierung fehlgeschlagen";
        if (Array.isArray(body.detail) && body.detail.length > 0) {
          errorMessage = body.detail[0].msg;
        } else if (typeof body.detail === "string") {
          errorMessage = body.detail;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Success
      router.push(`/${locale}/login?verified=1`);
    } catch {
      setError("Ein Netzwerkfehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">E-Mail verifizieren</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Wir haben einen 6-stelligen Code an <br/>
          <strong className="text-foreground">{email}</strong> gesendet.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code" className="sr-only">Verifizierungscode</Label>
        <Input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          required
          autoComplete="one-time-code"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="text-center text-3xl font-mono tracking-[0.5em] h-16"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive text-center font-medium">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full h-12 text-lg mt-4" disabled={loading || code.length !== 6}>
        {loading ? "Wird verifiziert..." : "Verifizieren"}
      </Button>
    </form>
  );
}
