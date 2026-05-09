"use client";

import { useCallback, useEffect, useState } from "react";

const SESSION_KEY = "sn_admin_session";
const TTL_MS = 15 * 60 * 1000; // 15 minutes
const WARN_THRESHOLD_S = 120; // show warning below 2 minutes
const SYNC_EVENT = "sn-admin-session-change"; // cross-instance sync

interface StoredSession {
  token: string;
  expiresAt: number; // Unix ms
}

function readFromStorage(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (parsed.expiresAt > Date.now()) return parsed;
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  } catch {
    return null;
  }
}

export function useAdminSession() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Hydrate on mount AND whenever another hook instance saves/clears a session
  useEffect(() => {
    function hydrate() {
      const s = readFromStorage();
      setSession(s);
      setSecondsLeft(s ? Math.floor((s.expiresAt - Date.now()) / 1000) : 0);
    }
    hydrate();
    window.addEventListener(SYNC_EVENT, hydrate);
    return () => window.removeEventListener(SYNC_EVENT, hydrate);
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
        window.dispatchEvent(new Event(SYNC_EVENT));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  const saveSession = useCallback((token: string) => {
    const s: StoredSession = { token, expiresAt: Date.now() + TTL_MS };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
    setSecondsLeft(TTL_MS / 1000);
    // Notify all other instances of this hook (Banner, Sidebar, etc.)
    window.dispatchEvent(new Event(SYNC_EVENT));
  }, []);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setSecondsLeft(0);
    window.dispatchEvent(new Event(SYNC_EVENT));
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
