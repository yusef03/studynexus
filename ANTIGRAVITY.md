# ANTIGRAVITY.md - StudyNexus Project Memory

> This file is the single source of truth for AI-assisted development.
> Update this file at the end of every session.

---

## Project Overview

**Name:** StudyNexus
**Type:** B2C SaaS — Gamified Study and Collaboration Platform for HsH students
**Status:** ✅ Sprint 5 Complete — alle 20 Phasen abgeschlossen (inkl. 100% Frontend Coverage & CI/CD Pipeline) (2026-05-23)
**Repository:** https://github.com/yusef03/studynexus
**Last Updated:** 2026-05-23

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| i18n | next-intl (DE + EN), date-fns locale-aware formatting |
| State | TanStack Query (React Query) — ALL data fetching via custom hooks |
| Backend | FastAPI (Python), SQLAlchemy, Alembic, Pydantic v2 |
| Database | PostgreSQL (primary), Redis (cache/sessions) |
| Auth | JWT (python-jose), bcrypt 4.1.3 (direct, no passlib), httpOnly cookies |
| DevOps | Docker Compose (local), GitHub Actions (Frontend CI/CD active) |
| Testing | pytest (backend, 122/122 tests), Jest (frontend, 100% Line/Branch Coverage im Admin Panel) |

---

## Architecture Decisions (All ADRs)

| ADR | Decision | Sprint |
|---|---|---|
| ADR-002 | bcrypt 4.1.3 direct — never passlib | 1 |
| ADR-003 | httpOnly cookie via Next.js API proxy — never localStorage | 1 |
| ADR-004 | Two API URLs: NEXT_PUBLIC_API_URL (browser) + BACKEND_API_URL (Docker-internal) | 1 |
| ADR-005 | next.config.js not .ts (Next.js 14.2.3 limitation) | 1 |
| ADR-007 | HsH-only: registration requires @stud.hs-hannover.de | 3A |
| ADR-009 | Admin-managed POs: exam regulations entered by admin, not crowdsourced | 3A |
| ADR-010 | module_prerequisites table for PO prerequisite rules | 3A → 4 |
| ADR-011 | Resend API for transactional email | 3A |
| ADR-012 | CSRF: x-studynexus-client header + Origin/Host check | 3A |
| ADR-013 | next-intl for i18n (DE + EN), pulled forward from Sprint 6 | 3.7 |
| ADR-014 | JWT lifetime 7 days in dev (was 30 min) | 3.7 |
| ADR-015 | @dnd-kit for all drag-and-drop (replaces HTML5 polyfill) | 3.7 |
| ADR-016 | plan_semester decoupled from semester (StudyPlanBoard only writes plan_semester) | 3.7 |
| ADR-017 | custom_ist_benotet on StudentModule for custom ERGAENZEND modules | 3.7.7 |
| ADR-018 | pruefungsart (PX/EA/R/BAA+Ko) + sws stored per module in DB | 4 |
| ADR-019 | Admin-Session via Redis (15 min TTL, X-Admin-Token header for destructive ops) | 5 |
| ADR-020 | Soft Delete (is_archived) on modules/programs/exam_regulations + Begründungspflicht | 5 |
| ADR-021 | is_admin claim embedded in JWT — middleware reads without DB query | 5 |
| ADR-022 | AdminDataTable server-side paginated (default 25/page) | 5 |

---

## Mandatory Rules for AI Code Generation

1. **Read this file first** before writing any code
2. **Shell:** fish — never use heredoc EOF syntax in fish commands
3. **Config:** next.config.js not next.config.ts
4. **Passwords:** bcrypt 4.1.3 direct, never passlib
5. **Auth:** httpOnly cookie via Next.js API proxy, never localStorage
6. **Data fetching:** ALL fetching via TanStack Query custom hooks in `hooks/queries/`. Never manual useEffect fetching in components.
7. **i18n:** ALL user-facing strings via `useTranslations()`. Zero hardcoded strings. Keys in `messages/de.json` + `messages/en.json`.
8. **Dates:** Always locale-aware (`useLocale()` + date-fns or `toLocaleDateString`)
9. **Migrations:** Always use `postgresql.ENUM` (sqlalchemy.dialects.postgresql), never `sa.Enum`
10. **Commit messages:** `type(scope): description` format
11. **Never commit .env files**
12. **Update ANTIGRAVITY.md at the end of every session**
13. **Shared hooks:** Use `useUserProgram()` from `hooks/queries/useUserProgram.ts` — never duplicate inline `useQuery(["userProgram"])` 
14. **Semester utils:** Use `semesterUtils.ts` (`computeCurrentSemesterNumber`, `formatSemesterLabel`, `generateSemesterOptions`) — never compute manually
15. **Admin routes:** `/admin/*` protected by Middleware (is_admin in JWT) + `get_admin_user` FastAPI dependency
16. **Soft Delete:** Never hard-delete modules/programs/exam_regulations that may have student data — use `is_archived` flag
17. **Audit Log:** Every admin mutation must call `AuditLogger.log()`
18. **Mobile-first (Admin + Dashboard):** Every page/component must work on mobile. Padding: `p-4 sm:p-6`. Grids: start with `grid-cols-1` or `grid-cols-2`, scale up with `sm:` / `lg:` breakpoints. Touch-targets: min `py-3` for interactive elements. Text: `text-xs sm:text-sm` for dense UI labels. Never use `hidden` without providing a mobile alternative.
19. **i18n in Admin:** ALL admin strings in `messages/de.json` + `messages/en.json` under `"admin"` namespace. Use `useTranslations("admin.xyz")` — zero hardcoded strings. Dynamic values via ICU `{variable}` syntax. Add both DE and EN keys simultaneously when creating new components.
20. **Admin Mobile Nav:** `AdminMobileHeader` (hamburger + slide drawer) for mobile, `AdminSidebar` (w-60, sticky) for desktop (`md:flex`). Never add a third nav component — extend these two. Drawer closes on route change via `pathname` useEffect.

---

## Running the Stack

```bash
docker compose up --build
```

Frontend  → http://localhost:3000/de  
API docs  → http://localhost:8000/api/docs

```bash
# Migrations
docker compose exec backend alembic upgrade head

# Tests
docker compose exec backend pytest tests/ -v

# TypeScript check
docker compose exec frontend node_modules/.bin/tsc --noEmit

# Reset all users (cascade deletes all student data too)
docker compose exec db psql -U studynexus -d studynexus -c "TRUNCATE users CASCADE;"
```

---

## Database Migrations (Complete Log)

| Nr | Datum | Inhalt | Status |
|---|---|---|---|
| 0001 | 2026-04-05 | users table | ✅ |
| 0002 | 2026-04-12 | University/Faculty/Program/ExamReg/Module/UserProgram/StudentModule + HSH seed | ✅ |
| 0003 | 2026-04-12 | kuerzel-Fixes, gewichtung, has_prerequisites, 9 WP-Module | ✅ |
| 0004 | 2026-04-18 | Email-Verifikation (is_verified, verification_code, expires) | ✅ |
| 0005 | 2026-04-26 | tasks + events Tabellen | ✅ |
| 0006 | 2026-04-28 | matrikelnummer auf users | ✅ |
| 0007 | 2026-04-28 | semester_tag, event_date, lecturer auf events | ✅ |
| 0008 | 2026-04-28 | FOCUS event type + is_submission auf tasks | ✅ |
| 0009 | 2026-04-29 | birth_date, hochschule auf users | ✅ |
| 0010 | 2026-04-29 | plan_semester auf student_modules (StudyPlanBoard-only) | ✅ |
| 0011 | 2026-05-07 | BIN-Datenfehler-Fix: kuerzel BIN-100..BIN-210, BIN-209 eingefügt, custom_ist_benotet | ✅ |
| 0012 | 2026-05-08 | pruefungsart + sws auf modules, BIN-Seed für alle 37 Module | ✅ |
| 0013 | 2026-05-08 | module_prerequisites Tabelle + parent_module_id auf student_modules + BIN §6 Seed | ✅ |
| 0014 | 2026-05-09 | BIN-209 gewichtung 1.0 → 1.5 (Datenfehler-Fix laut PO Anlage B2) | ✅ |
| 0015 | 2026-05-09 | is_admin, last_login_at, admin_notes auf users (Admin-Flag manuell setzen — kein Email-Seed im Code) | ✅ |
| 0016 | 2026-05-09 | admin_audit_logs Tabelle (3 Indizes: admin_id, entity, created DESC) | ✅ |
| 0017 | 2026-05-09 | is_archived + Soft-Delete-Felder auf modules/programs/exam_regulations | ✅ |

---

## API Endpoints (Complete)

### Auth (`/api/v1/auth`)
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | /auth/register | Register (requires @stud.hs-hannover.de, matrikelnummer, birth_date, university) | No |
| POST | /auth/verify | Verify 6-digit email code | No |
| POST | /auth/login | Login → JWT in httpOnly cookie (sets is_admin claim) | No |
| POST | /auth/logout | Logout, clear cookie | Yes |

### User Profile (`/api/v1/me`)
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /me | Get current user profile | Yes |
| PUT | /me/profile | Update profile fields | Yes |
| PUT | /me/password | Change password (requires old password) | Yes |

### Study Plan (`/api/v1`)
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /universities | List all universities | No |
| GET | /universities/{id}/faculties | List faculties | No |
| GET | /faculties/{id}/programs | List programs | No |
| GET | /programs/{id}/exam-regulations | List exam regulations | No |
| GET | /exam-regulations/{id}/modules | **Modules grouped by semester** `[{semester, modules[]}]` | No |
| POST | /me/program | Select degree program | Yes |
| GET | /me/program | Get my program | Yes |
| PUT | /me/program | Change program | Yes |
| GET | /me/modules | My modules grouped by semester (with prerequisites_met) | Yes |
| POST | /me/modules | Add WAHLPFLICHT (module_id) or custom ERGAENZEND | Yes |
| PUT | /me/modules/{id} | Update status/note/dates (note validated: only 11 HsH grades) | Yes |
| DELETE | /me/modules/{id} | Remove module (forbidden if PASSED) | Yes |
| GET | /me/stats | GPA, ECTS, milestone flags (8 BIN-specific fields) | Yes |

### Mission Control (`/api/v1/mission`)
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /mission/tasks/ | List tasks | Yes |
| POST | /mission/tasks/ | Create task | Yes |
| PUT | /mission/tasks/{id} | Update task | Yes |
| DELETE | /mission/tasks/{id} | Delete task | Yes |
| GET | /mission/events/?semester_tag=X | List events for semester | Yes |
| POST | /mission/events/ | Create event (collision detection HTTP 409) | Yes |
| PUT | /mission/events/{id} | Update event | Yes |
| DELETE | /mission/events/{id} | Delete event | Yes |

### Admin (`/api/v1/admin/`) — Sprint 5
All endpoints require `is_admin=true` in JWT. Destructive ops require `X-Admin-Token` (Redis-based session).
Full endpoint list: `docs/sprints/sprint-5/01-plan.md`

---

## Key Files & Hooks

```
frontend/src/
├── hooks/queries/
│   ├── useUserProgram.ts       ← shared hook for program data (queryKey: ["userProgram"])
│   ├── useUserModules.ts       ← queryKey: ["userModules"]
│   ├── useUserStats.ts         ← queryKey: ["userStats"]
│   ├── useAddModule.ts
│   ├── useUpdateModule.ts
│   ├── useTasks.ts
│   └── useEvents.ts
├── lib/
│   └── semesterUtils.ts        ← computeCurrentSemesterNumber, formatSemesterLabel, generateSemesterOptions
├── types/
│   └── study.ts                ← All TypeScript interfaces
└── components/
    ├── dashboard/
    │   ├── AppSidebar.tsx      ← Semester-Badge im Footer
    │   ├── MobileNav.tsx
    │   ├── MilestoneWidget.tsx ← BIN Vorprüfungs-Status (nur wenn vorpruefung_bestanden !== null)
    │   ├── MobileQuickAdd.tsx  ← FAB (uses useUserProgram, hidden on /settings /profile /setup /po-uebersicht)
    │   └── POUebersicht.tsx    ← /po-uebersicht Seite (6 Sektionen, program-aware)
    ├── admin/
    │   ├── AdminSidebar.tsx      ← Desktop sidebar (zinc-950, md:flex), i18n, Live-Timer-Chip
    │   ├── AdminMobileHeader.tsx ← Mobile top-bar + Hamburger → Slide-Drawer, schließt bei Routenwechsel
    │   ├── AdminSessionBanner.tsx ← Amber-Warning <2 min, Info-Bar ohne Session, i18n
    │   ├── KPICard.tsx           ← KPI-Card mit trend/loading, className prop
    │   ├── GrowthChart.tsx       ← Recharts LineChart, i18n, CSS-Vars-Theming
    │   ├── AdminDataTable.tsx    ← Generische Tabelle: sort/search/pagination, hideOnMobile, Skeleton-Rows
    │   ├── AdminFormModal.tsx    ← Sheet auf Mobile / Modal auf Desktop, Escape-Close, Body-Scroll-Lock
    │   ├── ArchiveDialog.tsx     ← Pflicht-Begründungsfeld, Admin-Session-Prüfung, i18n
    │   ├── DeleteDialog.tsx      ← Tippe "LÖSCHEN" Bestätigung, Admin-Session-Prüfung, i18n
    │   ├── StatusBadge.tsx       ← Farbige Chips: active/inactive/archived/verified/unverified/premium
    │   └── AuditBadge.tsx        ← "Geändert von X am Y", locale-aware Datum
    ├── study/
    │   ├── ModuleList.tsx
    │   ├── ModuleModal.tsx     ← Note: <select> mit 11 HsH-Noten, Lock-Icon bei prerequisites_met=false
    │   ├── AddModuleModal.tsx  ← Zwei Modi: Wahlpflicht-Katalog + Ergänzungsmodul (BIN-209)
    │   └── StudyPlanBoard.tsx  ← @dnd-kit, plan_semester
    └── auth/
        └── RegisterForm.tsx    ← Hochschule als Dropdown (fetcht /api/universities)
hooks/
├── useAdminSession.ts          ← sessionStorage 15-min TTL, window-Event-Sync (SYNC_EVENT), saveSession/clearSession
├── admin/
│   ├── useAdminUsers.ts        ← TanStack Query: paginated user list (search, filter, page)
│   └── useAdminUser.ts         ← TanStack Query: single user detail
lib/
└── adminFetch.ts               ← adminGet(path) + adminMutate(path, method, {body?, adminToken?}) — adds x-admin-token header for destructive ops
types/
└── admin.ts                    ← AdminUserListItem, AdminUserListResponse, AdminUserDetailResponse, AdminUserPatch
app/
├── api/admin/[...path]/route.ts ← Catch-all Proxy → /api/v1/admin/*, Bearer + X-Admin-Token, 204-safe
└── [locale]/admin/
    ├── layout.tsx              ← Server: fetchAdminName, AdminSidebar + AdminMobileHeader + AdminSessionBanner
    ├── page.tsx                ← Dashboard: KPIs + GrowthChart (30d) + quick-nav, i18n, p-4 sm:p-6
    ├── login/page.tsx          ← Re-Auth, i18n, py-2.5 input, h-11 button
    └── users/
        ├── page.tsx            ← User-Tabelle: AdminDataTable + Filter-Tabs + StatusBadges
        └── [id]/page.tsx       ← User-Detail: Toggles, Admin-Notes, Studienplan, Danger Zone
```

---

## Sprint Completion Log

### Sprint 1 – Infrastruktur & Auth ✅
Docker Compose, FastAPI, Next.js, JWT, Login/Register UI.

### Sprint 2 – Studienplan & Noten ✅
7 DB-Modelle (University → StudentModule), GPA-Engine, HSH Seed, ModuleList/Modal/StatsCard.

### Sprint 3A – Auth Hardening ✅
HsH-Domain-Validierung, E-Mail-Verifikation (Resend), TanStack Query, CSRF, Branding.

### Sprint 3B – Mission Control ✅
Schedule Board (15-min CSS Grid), Kanban (DnD), Smart Timeline, Exam Countdown, Collision Detection.

### Sprint 3.5 – Mobile Ergonomics ✅
FAB (Mobile Quick Add), Agenda View, Submissions, iOS Safari Fix.

### Sprint 3.6 – UX Polish ✅
Visual Study Plan Board (DnD Semester-Spalten), Digital ID Card, Settings Page.

### Sprint 3.7 – Rework & i18n ✅
`@dnd-kit` für Kanban + StudyPlanBoard, vollständige i18n (DE/EN), Settings mit echten Daten, Passwort-Ändung, 401-Auto-Redirect.

### Sprint 3.7.7 – BIN PO Datenkorrektur ✅
Migration 0011: alle Kürzel korrigiert, BIN-209 eingefügt, 9 WP-Module korrigiert, custom_ist_benotet, WAHLPFLICHT-Limit (2).

### Sprint 4 – BIN Studiengang Vollintegration ✅
**Review:** `docs/sprints/sprint-4/01-review.md` | **Zeitraum:** 08.–09. Mai 2026 | **Tests:** 66/66 grün

- **Phase 1:** Migration 0012 — pruefungsart + sws auf modules, BIN-Seed für alle 37 Module. ModuleModal: farbige PA-Badges (PX=blau, EA=amber, R=lila, BAA+Ko=emerald). ModuleList: PA-Chip.
- **Phase 2:** GET /me/stats — 8 neue Felder (sem1/2_complete, vorpruefung_bestanden, sem4/5/6_zugaenglich, ba_zulassung_eligible, ects_fuer_ba). MilestoneWidget im Dashboard.
- **Phase 3:** AddModuleModal — BIN-209 Suggestion-Dropdown (7 offizielle Namen), BWL-Hinweis.
- **Phase 4:** FAB semesterTag dynamisch (useUserProgram), /api/me/profile Proxy-Route.
- **Phase 5:** Migration 0013 — module_prerequisites Tabelle + parent_module_id auf student_modules. BIN §6 Seed (alle Voraussetzungsregeln). BIN-209 GPA-Fix (Sub-Module → avg(note) × 1.5). prerequisites_met in GET /me/modules. Lock-Icon in ModuleModal.
- **Phase 6:** Migration 0014 — BIN-209 gewichtung 1.0→1.5. Note-Validator (nur 11 HsH-Noten). ModuleModal: <select> statt Freitextfeld.
- **Phase 7:** /dashboard/po-uebersicht — 6 Sektionen (§6 Zulassungsregeln live, §10 Notenscala, Prüfungsarten, §11 Wiederholung, BIN-209 Sondermodul, BA-Fortschrittsbalken). Program-aware via vorpruefung_bestanden !== null.

### Post-Sprint-4 UX-Session ✅ (2026-05-09)
- **Bug-Fix:** AddModuleModal — WP-Katalog war immer leer (API gibt gruppierten Response `[{semester, modules[]}]`, Code behandelte es als flache Liste → Filter fand nie WAHLPFLICHT). Fix: `groups.flatMap(g => g.modules)`. Neuer Typ `ModulesBySemester` in types/study.ts.
- **Backend-Fix:** ERGAENZEND Sub-Module (BIN-209 Kinder) erscheinen jetzt unter Semester 5 statt "Ungeplant" — Backend lädt Parent-Module und erbt `semester_empfehlung`.
- **AddModuleModal UX:** Komplett neu — Karten-Modus-Auswahl, Erklärungstext pro Modus, PO-Vorschläge als `<details>` ausklappbar, ECTS default=2.
- **semesterUtils.ts:** `computeCurrentSemesterNumber`, `formatSemesterLabel`, `generateSemesterOptions` — zentrale Semester-Berechnungslogik.
- **useUserProgram Hook:** Shared hook (queryKey: ["userProgram"]) — MobileQuickAdd + AppSidebar nutzen diesen statt duplizierter useQuery-Calls.
- **AppSidebar:** Semester-Badge im Footer (aktuelles Semester + Startsemester).
- **ProfilePage (ID-Card):** Aktuelles Semester + Studiengang aus Program-Daten angezeigt.
- **SetupForm:** Semester-Optionen dynamisch via `generateSemesterOptions()`, Anzeige als "WiSe 2024/25".
- **RegisterForm:** Hochschule-Freitextfeld → `<select>` Dropdown (fetcht `/api/universities`, auto-selektiert wenn nur 1 Hochschule).
- **Test-Fix:** test_auth.py — `_make_user` fehlende Felder (matrikelnummer/university/profile_picture_url), Register-Tests mit Pflichtfeldern.

### Sprint 5 Phase 1 ✅ (2026-05-09) — Backend Fundament
- **Migrations 0015–0017:** is_admin + last_login_at + admin_notes auf users, admin_audit_logs Tabelle, Soft-Delete auf modules/programs/exam_regulations. Alle migriert. Admin-Flag manuell setzen (kein Email-Seed im Code — siehe "Admin-Flag setzen" unten).
- **`app/core/admin_auth.py`:** `get_admin_user` (403 für Nicht-Admins), `get_verified_admin` (Redis 15-min Admin-Session Token), `create/revoke/verify_admin_session_token`.
- **`app/core/audit.py`:** `AuditLogger` FastAPI-Dependency — `audit.log(action, entity_type, ...)`, db.flush() in gleicher Transaktion.
- **`app/core/security.py`:** `create_access_token` hat jetzt `is_admin: bool` Parameter → JWT-Claim für Frontend-Middleware.
- **`app/routers/admin/auth.py`:** `POST /admin/auth/session` (Passwort → 15-min Token), `DELETE /admin/auth/session`, `GET /admin/auth/me`.
- **`app/routers/auth.py`:** Login setzt `last_login_at` + übergibt `is_admin` an JWT.
- **Tests:** 15/15 grün — Zugriffskontrolle (403/401), Session Create/Revoke, MagicMock-Fixes (`is_admin=False` in `_make_user`, `mock_admin_user` + `admin_client` Fixtures).

### Sprint 5 Phase 2 ✅ (2026-05-09) — User-Management Backend
- **Schemas:** `AdminUserListItem`, `AdminUserListResponse`, `AdminUserDetailResponse`, `AdminUserPatch`, `DeleteUserRequest`
- **Router `admin/users.py`:** GET paginated (25/page, search/filter), GET detail (GPA+ECTS+Module-Count), PATCH (Audit), POST reset-password (Admin-Token required), DELETE cascade (Admin-Token + Begründung)
- **Tests:** 25/25 grün — Pagination, 404-Guards, PATCH+Audit, Delete-Guards (401/403/404)

### Sprint 5 Phase 3 ✅ (2026-05-09) — PO-Verwaltung Backend
- **Routers:** `admin/universities.py`, `admin/faculties.py`, `admin/programs.py`, `admin/exam_regulations.py`, `admin/modules.py`, `admin/prerequisites.py` — vollständiges CRUD + Archive/Restore mit Admin-Token + Begründungspflicht
- **JSON-Bulk-Import:** `POST /admin/modules/import/json` — bis 500 Module, Duplikat-Detection via `kuerzel`, skip + count, Audit-logged. Import-Route **vor** `/{module_id}` registriert (FastAPI UUID-Parse-Konflikt vermieden).
- **Public Routes:** `universities.py` — alle 3 öffentlichen Endpunkte filtern `is_archived == False`.
- **Tests:** 99/99 grün — 22 neue Tests für PO-Verwaltung. Komplexe Mock-Fixes: `add.side_effect` für UUID-Flush, `call_args.args[0]` für positionale Audit-Args.

### Sprint 5 Phase 4 ✅ (2026-05-09) — Analytics Backend
- **Schemas:** `AdminStatsResponse` (13 Felder), `GrowthResponse`, `DailyRegistration`, `ModuleStatItem`, `ModuleStatsResponse`, `UserStatsResponse`, `SystemHealthResponse`, `SystemInfoResponse`
- **Router `admin/analytics.py`:** `GET /admin/stats` (KPI-Übersicht), `GET /admin/stats/growth?period=7d|30d|90d|1y`, `GET /admin/stats/modules`, `GET /admin/stats/users`
- **Router `admin/system.py`:** `GET /admin/system` (DB-Version + Größe + Counts), `GET /admin/system/health` (DB-Ping + Redis.ping → "ok"/"degraded"/"down")
- **Technisch:** `func.case`, `func.nullif`, `cast(User.created_at, Date)`, `pg_database_size()` via `text()`, `_module_stat_rows()` Helper-Funktion
- **Tests:** 111/111 grün — 12 neue Tests für Analytics

### Sprint 5 Phase 5 ✅ (2026-05-09) — Frontend Fundament
- **`middleware.ts`:** Edge-Runtime JWT-Decode via `atob()` + manuelles Base64url-Padding. `/admin/*` Guard: kein Token → /login, `is_admin=false` → /dashboard.
- **`api/admin/[...path]/route.ts`:** Catch-all für alle HTTP-Methoden, leitet Bearer + X-Admin-Token weiter, 204-safe.
- **`hooks/useAdminSession.ts`:** sessionStorage (Key: `sn_admin_session`), 15-min TTL, 1s-Countdown-Timer, 120s Warn-Schwelle.
- **`components/admin/AdminSidebar.tsx`:** Dark (zinc-950), rotes ADMIN-Badge, 9 Nav-Items, Live-Session-Timer-Chip.
- **`components/admin/AdminSessionBanner.tsx`:** Amber-Warning wenn <2 min, Zinc-Info-Bar wenn keine Session.
- **`app/[locale]/admin/layout.tsx`:** Server-Component, fetcht Admin-Name via `/admin/me`.
- **`app/[locale]/admin/page.tsx`:** Placeholder (4 Quick-Nav-Karten).
- **`app/[locale]/admin/login/page.tsx`:** Dark-Design, Passwort → `POST /api/admin/auth/session` → `saveSession()` → redirect.

### Sprint 5 Phase 6 ✅ (2026-05-09) — Dashboard + Analytics Frontend
- **`components/admin/KPICard.tsx`:** Reusable Card (label/value/sub/icon/trend/loading), TrendingUp/Down Indikatoren, animate-pulse Skeleton.
- **`components/admin/GrowthChart.tsx`:** Recharts `ResponsiveContainer + LineChart`, CSS-Vars für Theming, DE-Datumsformatierung, leerer State + Loading-Skeleton.
- **`app/[locale]/admin/page.tsx`:** Client-Component fetcht `/api/admin/stats` + `/api/admin/stats/growth?period=30d`, rendert 4+3 KPI-Cards + GrowthChart + DB-Größe + Quick-Nav.

### Sprint 5 Phase 7 ✅ (2026-05-10) — Mobile/i18n + Reusable Components
- **Bug-Fix `useAdminSession.ts`:** Cross-Instance-Sync via `window.dispatchEvent("sn-admin-session-change")` — alle Hook-Instanzen (Sidebar, Banner, Login-Seite) synchronisieren sich nach `saveSession()`/`clearSession()`.
- **`components/admin/AdminMobileHeader.tsx`:** Mobile Top-Bar + Hamburger → Slide-Drawer (translate-x Transition), Backdrop-Tap schließt, pathname-useEffect schließt bei Route-Wechsel, Body-Scroll-Lock.
- **i18n Admin komplett:** Alle bisherigen Hardcoded-Strings in DE+EN unter `"admin"` Namespace. Neue Keys: `nav`, `sidebar`, `sessionBanner`, `login`, `dashboard`, `table`, `status`, `archiveDialog`, `deleteDialog`, `formModal`, `auditBadge`.
- **`components/admin/AdminDataTable.tsx`:** Generisch `<T>`, Column-Sort (SortState), debounced Search, server-side Pagination, `hideOnMobile` pro Spalte, 5-Zeilen-Skeleton beim Laden.
- **`components/admin/AdminFormModal.tsx`:** Bottom-Sheet auf Mobile / zentriertes Modal auf Desktop (responsive), Escape + Backdrop schließt, Body-Scroll-Lock, save/create Varianten.
- **`components/admin/ArchiveDialog.tsx`:** Pflicht-Begründung (Textarea), Admin-Session-Prüfung, disabled wenn keine Session.
- **`components/admin/DeleteDialog.tsx`:** Tippe Bestätigungswort (i18n-fähig), Admin-Session-Prüfung, rote Danger-Styling.
- **`components/admin/StatusBadge.tsx`:** 6 Status-Varianten mit Farb-Mapping, dark-mode-aware.
- **`components/admin/AuditBadge.tsx`:** created/modified Varianten, locale-aware Datum + Zeit.
- **Mobile-Regeln** in ANTIGRAVITY.md Regel 18–20 dokumentiert.

### Sprint 5 Phase 10 ✅ (2026-05-10) — Audit-Log + System + Import Frontend
- **`backend/app/schemas/admin/audit_log.py`:** AuditLogItem + AuditLogListResponse.
- **`backend/app/routers/admin/audit_log.py`:** GET /audit-log (paginated, filter: entity_type/action/date_from/date_to), GET /audit-log/{id}. admin_name via Python Set-Lookup gegen User-Query.
- **`types/admin.ts`:** AuditAction union, AdminAuditLog, AdminAuditLogListResponse, AdminServiceStatus, AdminSystemInfo, AdminSystemHealth.
- **`hooks/admin/useAdminAuditLog.ts`:** useAdminAuditLogs(params) + useAdminAuditLogEntry(id), staleTime 10s, placeholderData.
- **`hooks/admin/useAdminSystem.ts`:** useAdminSystemInfo() (staleTime 60s) + useAdminSystemHealth() (refetchInterval 60s).
- **`app/[locale]/admin/audit-log/page.tsx`:** Timeline-View, ActionBadge (8 Farb-Varianten), DiffBlock (old→new diff), Filter-Bar (entity_type+action+date), Pagination.
- **`app/[locale]/admin/system/page.tsx`:** OverallBadge (ok/degraded/down), ServiceBadge, Health+Info+Stack Sections, Auto-Refresh.
- **`app/[locale]/admin/import/page.tsx`:** Exam-Reg-ID + JSON-Textarea → Validate → Preview → POST /modules/import/json → Result. PDF-Placeholder.
- **i18n (DE+EN):** admin.auditLog, admin.system, admin.import (~70 neue Keys).

### Sprint 5 Phase 12 ✅ (2026-05-10) — Tests + TypeScript-Härtung
- **`backend/tests/test_admin_audit_log.py`:** 11 neue Tests — Access Control (403 für Nicht-Admin), List (200 + Shape), Pagination (total_pages), Filter (entity_type/action), Empty List, Single Entry (200 + admin_name), 404, admin_name-Auflösung über scalar(). 122/122 grün.
- **`backend/tests/test_admin_users.py`:** Bug-Fix `test_list_users_returns_paginated` — `get_db` Override fehlte, Test traf echte DB.
- **TypeScript-Härtung:** `@types/jest` installiert (war in package.json, fehlte in node_modules), test files aus tsconfig.json `exclude` entfernt (Test-Typen via jest, nicht via tsc). `archive_reason: string | null` zu `AdminModule` interface hinzugefügt. `adminToken: adminToken ?? undefined` in import/page.tsx (null→undefined Mismatch). **Ergebnis: 0 TypeScript-Fehler.**
- **Sprint 5 Review:** `docs/sprints/sprint-5/02-review.md` erstellt.
- **admin-po-use-cases.md:** Von Phase 9-only auf alle Phasen (Phase 0–12) erweitert.

### Sprint 5 Phase 9 ✅ (2026-05-10) — PO-Verwaltung Frontend + Phase 11 Admin-Link
- **`types/admin.ts`:** 10 neue Interfaces — AdminFaculty, AdminUniversity(Detail), AdminProgram(Detail), AdminExamReg(Detail), AdminModule(Detail), AdminPrerequisite.
- **`hooks/admin/useAdminUniversities.ts`:** useAdminUniversities() + useAdminUniversity(id).
- **`hooks/admin/useAdminPrograms.ts`:** useAdminPrograms(params?) + useAdminProgram(id).
- **`hooks/admin/useAdminModules.ts`:** useAdminModules(params?) + useAdminModule(id) + useAdminExamReg(id) → AdminExamRegDetail.
- **`app/[locale]/admin/universities/page.tsx`:** Liste mit Create-Modal (5 Felder inkl. Typ FH/Uni), Live-Suche.
- **`app/[locale]/admin/universities/[id]/page.tsx`:** Detail + Fakultäten-Tabelle (anlegen/löschen), Edit-Modal, DeleteDialog (Admin-Token).
- **`app/[locale]/admin/programs/page.tsx`:** Liste + Filter-Tabs (Alle/Aktiv/Archiviert) + Create-Modal.
- **`app/[locale]/admin/programs/[id]/page.tsx`:** Detail + PO-Tabelle + ExamReg anlegen + Edit + Archive/Restore.
- **`app/[locale]/admin/exam-regulations/[id]/page.tsx`:** PO-Hub — Modulkatalog (useMemo filter+search), Modul anlegen, JSON-Bulk-Import (client-side JSON.parse validation → POST /modules/import/json), Archive/Restore.
- **`app/[locale]/admin/modules/page.tsx`:** Globale Übersicht, Filter-Tabs + Live-Suche, ModulTypBadge.
- **`app/[locale]/admin/modules/[id]/page.tsx`:** 11 InfoRows, Edit-Modal, Voraussetzungs-Editor (TYPE-conditional: MODULE/ECTS_THRESHOLD/SEMESTER_COMPLETE), Prereq löschen (Admin-Token), Archive/Restore.
- **i18n (DE+EN):** admin.common, admin.universities, admin.programs, admin.examRegs, admin.modules, admin.prerequisites — ~200 neue Keys.
- **Phase 11:** AppSidebar + MobileNav Admin-Link (is_admin guard).

### Sprint 5 Phase 8 ✅ (2026-05-10) — User Management Frontend
- **`types/admin.ts`:** AdminUserListItem, AdminUserListResponse, AdminUserDetail (extends List + university/birth_date/admin_notes/gpa), AdminUserPatch.
- **`lib/adminFetch.ts`:** `adminGet<T>(path)` + `adminMutate<T>(path, method, {body?, adminToken?})` — Content-Type + x-admin-token forwarding, 204-safe.
- **`hooks/admin/useAdminUsers.ts`:** TanStack Query, queryKey `["admin-users", page, search, is_active, is_premium, is_verified, limit]`, staleTime 30s, placeholderData keeps previous page during navigation.
- **`hooks/admin/useAdminUser.ts`:** TanStack Query, queryKey `["admin-user", id]`, enabled wenn id vorhanden.
- **`app/[locale]/admin/users/page.tsx`:** AdminDataTable mit 7 Spalten (User, Matrikel, Status, Programm, Fortschritt, Letzter Login, Registriert), 5 Filter-Tabs (Alle/Aktiv/Inaktiv/Premium/Unverifiziert), debounced Search, Row-Click → Detail.
- **`app/[locale]/admin/users/[id]/page.tsx`:** Persönliche Daten, Studienplan-Summary, Toggle-Switches für is_active/is_premium/is_verified (PATCH ohne Admin-Token), Admin-Notes-Textarea mit Save, Danger Zone: Passwort-Reset (POST + Admin-Token), Nutzer-Löschen (DELETE + Admin-Token, DeleteDialog).

---

## BIN Studiengang — Domain-Wissen

### Modul-Gewichtungen (modules.gewichtung)
| Modul | Gewichtung | Grund |
|---|---|---|
| BIN-114 Programmierprojekt | 0.0 | EA, unbenotet |
| BIN-116 Englisch | 0.0 | Unbenotet, trotzdem Vorprüfungs-Pflicht |
| BIN-204 Seminar | 0.0 | R (Referat), unbenotet |
| BIN-206 Praxisprojekt 1 | 0.0 | EA, unbenotet |
| BIN-208 Praxisprojekt 2 | 0.0 | EA, unbenotet |
| BIN-209 Ergänzende Fächer | 1.5 | GPA-Gewichtung (3 Sub-Module à 2 ECTS, avg → BIN-209-Note) |
| BIN-210 Bachelorarbeit + Kolloquium | 4.0 | Höchste Gewichtung |

### §6 PO BIN 2019 — Zulassungsvoraussetzungen
- **Sem 1** (6 Module): BIN-100, 101, 102, 103, 104, 116
- **Sem 2** (5 Module): BIN-105, 106, 107, 108, 109
- **Sem 3** (6 Module): BIN-110, 111, 112, 113, 114, 115
- **Vorprüfung** = alle 17 Module Sem 1–3 bestanden
- Sem 4 zugänglich: Sem 1 complete
- Sem 5 zugänglich: Sem 1+2 complete
- Sem 6 + BIN-206: Vorprüfung bestanden
- BIN-210 BA: Vorprüfung + ≥134 ECTS
- BIN-209: **KEINE Voraussetzung**
- WAHLPFLICHT: **max. 2 Module** (BIN-211..219, je 6 ECTS), Voraussetzung: Sem 1+2

### GPA-Berechnung
```
GPA = sum(note × ects × gewichtung) / sum(ects × gewichtung)
```
BIN-209 Sub-Module: `avg(note_aller_submodule)` als BIN-209-Note → × 6 ECTS × 1.5 gewichtung.

### API Response Formen (wichtig!)
- `GET /exam-regulations/{id}/modules` → **`[{semester: N, modules: ModuleResponse[]}]`** (GRUPPIERT)
- `GET /me/modules` → **`[{semester: N|null, modules: StudentModuleResponse[]}]`** (GRUPPIERT)
- `GET /me/stats` → flaches StatsResponse-Objekt

---

## Multi-Program-Architektur (Zukunft)

Das DB-Schema `University → Faculty → Program → ExamRegulation → Module` ist multi-program-fähig. **Neue Studiengänge = neue Migration mit Seed-Daten — kein Code-Change.**

**Sprint-7-Kandidaten (ATPO-FIV 2025 Fak. IV):**
- MDI – Medieninformatik und Interaktives Entertainment (Bachelor)
- MIN – Informatik (Master)
- MMI – Medieninformatik (Master)

**Wichtige Invariante:** `StudentModule` hat **keine FK auf `UserProgram`** (bewusst — Bestandsschutz bei Programmwechsel).

**WAHLPFLICHT-Limit:** Aktuell hardcoded = 2 im Backend (korrekt für BIN). Muss program-aware werden in Sprint 7 (program_rules Tabelle oder PO-Feld auf ExamRegulation).

---

## Known Limitations (Stand: Sprint 5 Phase 1 abgeschlossen)

| Limitation | Geplant |
|---|---|
| §11 ATPO: 13-Monate-Wiederholungsfrist (Fristenverfolgung) | Sprint 5+ |
| §11 ATPO: Notenverbesserungs-Tracking | Backlog |
| §11 ATPO: 3 mündliche Ergänzungsprüfungen (Zähler) | Sprint 5+ |
| WAHLPFLICHT-Limit hardcoded = 2 (muss program-aware werden) | Sprint 7 |
| BIN-spezifischer Code in AddModuleModal (BIN_209_SUGGESTIONS) | Sprint 7 |
| POUebersicht rendert BIN-Block hardcoded | Sprint 7 |
| PDF-Parser für PO-Import | Sprint 7 |
| MDI/Master-Programme | Sprint 7 |
| Admin-2FA (TOTP) | Sprint 6 |
| next build: 404/500 prerender warnings (Next.js + next-intl standalone) | Sprint 6 |

---

## Sprint 5 Bug-Fixes (2026-05-18) ✅

**Dokumentation:** `docs/sprints/sprint-5/04-bugfix-umsetzung.md`

Nach manueller QA wurden 17 Bugs identifiziert und systematisch behoben:

### Root Cause A: CSRF-Header fehlte (12 Bugs gelöst)
- `adminFetch.ts` setzte `x-studynexus-client: true` nicht
- **Fix:** Header hinzugefügt → alle Admin-Mutationen (POST/PATCH/DELETE) funktionieren jetzt

### Root Cause B: i18n-Keys fehlten (2 Bugs gelöst)
- Universities-Form-Keys existierten nur in `detail`, nicht in `form`
- **Fix:** Keys `name`, `kuerzel`, `stadt`, `bundesland` + Placeholders hinzugefügt (DE + EN)

### Root Cause C: Admin-Link fehlte (1 Bug gelöst)
- Phase 11 wurde initial unvollständig bzw. fehlerhaft implementiert (client-side `fetch` mit Next.js 14 URL-Cache-Bug).
- **Fix:** JWT-Payload wird jetzt auf dem Server (`layout.tsx`) geparst, und `isAdmin` wird als Prop übergeben. Der fehlende `cache: "no-store"` in der `/api/auth/me` Route wurde korrigiert. Zudem wurde der fehlende i18n-Key `admin.nav.title` ergänzt.

### Weitere Fixes:
- **Prerequisites-Link entfernt:** `/admin/prerequisites` 404 → Link aus Sidebar entfernt (wird in Modul-Detail verwaltet)
- **Premium-Erklärungstext:** Toggle zeigt jetzt "aktuell keine Features, Vorbereitung für Sprint 6+"

### Ausstehend:
- **Alle Bugs via manueller QA und Docker-Tests behoben!**

---

## Sprint 5 Phase 14-20: Admin UI QA & CI/CD Pipeline (2026-05-23) ✅

**Dokumentation:** `docs/qa/sprint-5-qa-report.md` und Einzel-Reports in `docs/qa/`

- **100% Jest Coverage:** Dashboard, Users, Universities, Programs, Modules, Exam Regulations, Audit-Log, System, Import vollständig getestet (Line & Branch Coverage = 100%).
- **DOM Testing Excellence:** Umstellung von `userEvent` auf `fireEvent` für Radix UI Portal Modals. Eliminierung von `MultipleElementsFoundError`.
- **i18n Testing:** Strikte `NextIntlClientProvider` Wrappers mit vollständigen `admin`-Namespaces verhindern fatal `MissingMessage` Errors im Test-DOM.
- **CI/CD Pipeline (DevOps):** `frontend-ci.yml` für GitHub Actions erstellt. Führt `npm ci`, `npm run lint` und `npm run test:coverage` (100% Coverage Enforcer) auf jeden PR in den `main` Branch aus.

---

## Next Steps: Sprint 6 Planung (PWA, Branding & Launch)

### Admin-Flag setzen (einmalig nach erstem Login)

Kein Email-Seed im Code — Admin-Flag wird manuell gesetzt, damit keine persönlichen Daten im Repository landen:

```bash
docker compose exec db psql -U studynexus -d studynexus \
  -c "UPDATE users SET is_admin = TRUE WHERE email = 'deine@email.de';"
```

> Danach beim nächsten Login erhält der Account `is_admin: true` im JWT und hat Zugang zu `/admin/*`.
