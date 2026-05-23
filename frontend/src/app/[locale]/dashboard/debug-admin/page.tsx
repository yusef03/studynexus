"use client";

import { useEffect, useState } from "react";

// Client-side JWT payload parser (no verification, just reading claims)
function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split(".")[1];
    if (!b64) return null;
    const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (padded.length % 4)) % 4;
    return JSON.parse(atob(padded + "=".repeat(pad)));
  } catch {
    return null;
  }
}

export default function DebugAdminPage() {
  const [cookies, setCookies] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    // Read all cookies
    const allCookies = document.cookie;
    setCookies(allCookies);

    // Find access_token
    const cookieArray = allCookies.split("; ");
    const tokenCookie = cookieArray.find((c) => c.startsWith("access_token="));
    
    if (tokenCookie) {
      const tokenValue = tokenCookie.split("=")[1];
      setToken(tokenValue);
      
      const parsedPayload = parseJwtPayload(tokenValue);
      setPayload(parsedPayload);
      setIsAdmin(!!parsedPayload?.is_admin);
    }
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">🔍 Admin-Link Debug</h1>
      
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold mb-2">1. Alle Cookies:</h2>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            {cookies || "Keine Cookies gefunden"}
          </pre>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold mb-2">2. Access Token:</h2>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto break-all">
            {token || "Kein Token gefunden"}
          </pre>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold mb-2">3. JWT Payload:</h2>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            {payload ? JSON.stringify(payload, null, 2) : "Kein Payload"}
          </pre>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold mb-2">4. is_admin Wert:</h2>
          <p className="text-lg">
            <span className={`font-bold ${isAdmin ? "text-green-600" : "text-red-600"}`}>
              {isAdmin ? "✅ TRUE" : "❌ FALSE"}
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {isAdmin 
              ? "Admin-Link sollte sichtbar sein!" 
              : "Admin-Link wird NICHT angezeigt (is_admin ist false oder fehlt)"}
          </p>
        </div>

        <div className="rounded-lg border bg-amber-100 dark:bg-amber-900/20 p-4">
          <h2 className="font-semibold mb-2">💡 Lösung:</h2>
          <p className="text-sm">
            Wenn <code>is_admin</code> hier <strong>false</strong> ist, obwohl es in der DB <strong>true</strong> ist:
          </p>
          <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
            <li>Logout im Browser</li>
            <li>Login erneut</li>
            <li>Diese Seite neu laden</li>
          </ol>
          <p className="text-sm mt-2">
            Der JWT-Token wird nur beim <strong>Login</strong> erstellt und enthält dann den aktuellen <code>is_admin</code> Wert aus der DB.
          </p>
        </div>
      </div>
    </div>
  );
}
