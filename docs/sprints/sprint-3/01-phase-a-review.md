# Sprint 3A Review – StudyNexus

**Sprint:** 3A – Auth hardening + Dashboard fixes
**Zeitraum:** 20. April 2026
**Status:** 🟢 Abgeschlossen

---

## Sprint Ziel

Sicherheits-Hardening der Authentifizierung, Einführung eines strikten E-Mail-Verifizierungs Workflows (HsH exklusiv) sowie architektonisches Refactoring des Dashboards zur Vermeidung von State-Bugs und Prop-Drilling.

---

## Erledigte User Stories

| Issue | User Story | Story Points | Status |
|---|---|---|---|
| #12 | Nur Registrierungen mit `@stud.hs-hannover.de` erlauben | 3 | ✅ Done |
| #13 | E-Mail Verifizierung nach Registrierung (6 Digits) | 5 | ✅ Done |
| #14 | Optionale Erfassung der Matrikelnummer | 2 | ✅ Done |
| #15 | TanStack Query Refactoring (Data Fetching Management) | 5 | ✅ Done |
| #16 | Vollständige CSRF Security Implementierung | 3 | ✅ Done |
| #17 | Marken-Identität (Branding & Logo Injection) | 2 | ✅ Done |

**Gesamt:** 20 Story Points

---

## Was wurde gebaut

### Backend (FastAPI & Security)
- **E-Mail Domain Filter:** Striktes Abfangen aller Mail-Requests. Nur `*@stud.hs-hannover.de` Mails können angelegt werden.
- **Resend Integration:** SMTP Implementierung via Python-SDK (ohne Heavy-Libraries) verbunden mit FastAPIs `BackgroundTasks` zur performanten Code-Versendung im Hintergrund.
- **Code Generierung:** 6-stelliger Verify-Code Mechanismus mit 15-Minuten Expiry-Timer (`verification_code_expires_at`).
- **Data Collections:** Optionale Integration in die `UserCreate` Payload für die Matrikelnummer inklusive systemweitem Unique-Constraint.
- Bugfix gelöst (`ImportError: get_current_user`) im Core `Dependencies` Tree.

### Frontend (Next.js & Architektur)
- **TanStack Query Architektur (React Query):** Vollständiges Refactoring (Rule #17) ALLER manuellen `useEffect`/`fetch` Logiken im Dashboard.
- **Cache Invalidation:** Einfaches Refreshing der Components ohne Prop-Drilling bei Mutations (Speichern von Noten zwingt Dashboard sofort zum unsichtbaren Live-Update).
- **CSRF Middlewares:** 2-Layer Protection
  - Layer 1: Origin/Referer Überprüfung (`http://localhost:3000`)
  - Layer 2: Custom Header Pre-flight (`x-studynexus-client: "true"`) in Mutations (POST, PUT, DELETE).
- **React Crash Prevention:** Sicherheits-Guard gegen Array-Injections in API Error-Responses.
- **Branding UI:** Erstellung einer skalierbaren, SVG-integrierten Next.js `<Logo />` Komponente sowie eines dynamischen `<PartnerBadge />` für den Login und Regisrierungs-Screen.

---

## Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| **TanStack Query Mandat (Rule #17)** | Beseitigt inkonsistente States, "Eingefrorene Ladebildschirme" und übermäßiges Prop-Drilling bei tiefen Widget-Bäumen (z.B. StatsCard vs. ModuleList). |
| Resend statt klassischem SMTP-Relay | Moderne, performantere Zustellung mit direkter Python SDK Kontrolle und weniger Overhead bei lokalen Deployments. |
| Matrikelnummer optional & direkt | Ursprünglicher UI Dialog verworfen. Zur DSGVO Datensparsamkeit optional gestaltet und direkt, unaufdringlich in den Sign-Up Flow integriert. |
| Doppelte CSRF Layer | HttpOnly JWT-Cookies sind sicher, können aber ohne Origin-Prüfungen ausgenutzt werden. Die Custom Headers erzwingen OPTIONS Pre-flight Checks als Blockade. |

---

## Probleme und Lösungen

| Problem | Lösung |
|---|---|
| Dashboard Freeze Bug nach Mutation | TanStack Query Cache Validation (`queryClient.invalidateQueries()`) implementiert. Backend Änderungen triggern Live-Repaints. |
| React Invalid Hook Call / State Null Exception | Strict `"use client";` Directives bei SSR Component/Hook Splits gesetzt. |
| Auth-Formular Crashest bei Detail-Arrays | Validierung der `body.detail` Error-Payload Struktur der FastAPI Responses. |
| Logo Whitespace/Scaling Bug | SVG `viewBox` von den originalen Graphic-Masks auf das absolute visuelle Limit (`145px`) gecroppt und CSS `fill-current` Farben injeziert. |

---

## Metriken

| Metrik | Wert |
|---|---|
| Refactored Hooks | 5 vollwertige Query-Mutations |
| Neue Sicherheits-Middleware | 1x global `middleware.ts` |
| Alembic Migrations | +2 (Matrikelnummer + Validierung) |
| Story Points | 20 |

---

## Sprint 3B Vorschau

**Thema:** Mission Control
**Ziel:** Studenten-Planungstools aktivieren (Kalender, Kanban Boards, interaktiver Stundenplan und visuelle Timelines).
