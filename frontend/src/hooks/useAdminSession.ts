"use client";

import { useCallback, useEffect, useState } from "react";

const SESSION_KEY = "sn_admin_session";
const TTL_MS = 15 * 60 * 1000; // 15 minutes
const WARN_THRESHOLD_S = 120; // show warning below 2 minutes

interface StoredSession {
  token: string;
  expiresAt: number; // Unix ms
}

export function useAdminSession() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredSession;
      if (parsed.expiresAt > Date.now()) {
        setSession(parsed);
        setSecondsLeft(Math.floor((parsed.expiresAt - Date.now()) / 1000));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // sessionStorage unavailable (SSR guard)
    }
  }, []);

  // 1-second countdown
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        sessionStorage.removeItem(SESSION_KEY);
        setSession(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  const saveSession = useCallback((token: string) => {
    const s: StoredSession = { token, expiresAt: Date.now() + TTL_MS };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
    setSecondsLeft(TTL_MS / 1000);
  }, []);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setSecondsLeft(0);
  }, []);

  const isActive = session !== null && secondsLeft > 0;
  const isExpiringSoon = isActive && secondsLeft <= WARN_THRESHOLD_S;

  return {
    token: session?.token ?? null,
    isActive,
    isExpiringSoon,
    secondsLeft,
    saveSession,
    clearSession,
  };
}
