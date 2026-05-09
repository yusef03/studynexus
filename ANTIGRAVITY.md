# ANTIGRAVITY.md - StudyNexus Project Memory

> This file is the single source of truth for AI-assisted development.
> Update this file at the end of every session.

---

## Project Overview

**Name:** StudyNexus
**Type:** B2C SaaS — Gamified Study and Collaboration Platform for HsH students
**Status:** 🔧 Sprint 5 In Progress — Phase 2 (User-Management Backend) complete
**Repository:** https://github.com/yusef03/studynexus
**Last Updated:** 2026-05-09

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
| DevOps | Docker Compose (local), GitHub Actions (CI/CD planned Sprint 6) |
| Testing | pytest (backend, 66 tests), Jest (frontend) |

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
Full endpoint list: `docs/sprints/sprint-5-plan.md`

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
    ├── study/
    │   ├── ModuleList.tsx
    │   ├── ModuleModal.tsx     ← Note: <select> mit 11 HsH-Noten, Lock-Icon bei prerequisites_met=false
    │   ├── AddModuleModal.tsx  ← Zwei Modi: Wahlpflicht-Katalog + Ergänzungsmodul (BIN-209)
    │   └── StudyPlanBoard.tsx  ← @dnd-kit, plan_semester
    └── auth/
        └── RegisterForm.tsx    ← Hochschule als Dropdown (fetcht /api/universities)
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
`@dnd-kit` für Kanban + StudyPlanBoard, vollständige i18n (DE/EN), Settings mit echten Daten, Passwort-Änderung, 401-Auto-Redirect.

### Sprint 3.7.7 – BIN PO Datenkorrektur ✅
Migration 0011: alle Kürzel korrigiert, BIN-209 eingefügt, 9 WP-Namen korrigiert, custom_ist_benotet, WAHLPFLICHT-Limit (2).

### Sprint 4 – BIN Studiengang Vollintegration ✅
**Review:** `docs/sprints/sprint-4-review.md` | **Zeitraum:** 08.–09. Mai 2026 | **Tests:** 66/66 grün

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

## Next Steps: Sprint 5 Phase 2 — User-Management Backend

**Masterplan:** `docs/sprints/sprint-5-plan.md`

### Phase 1 ✅ Backend Fundament (komplett)
Migrations 0015–0017, admin_auth, audit, Admin-Session, JWT is_admin claim.

### Phase 2 ✅ User-Management Backend (2026-05-09)
- `app/schemas/admin/user.py` — AdminUserListItem, AdminUserListResponse, AdminUserDetailResponse, AdminUserPatch, DeleteUserRequest
- `app/routers/admin/users.py` — GET (paginated + search/filter), GET detail (GPA+ECTS+modules), PATCH (audit), POST reset-password (Admin-Token), DELETE cascade (Admin-Token + Begründung)
- Audit-Logging: UPDATE, RESET_PASSWORD, DELETE — alle via AuditLogger
- Tests: 25/25 grün — Pagination, 404, PATCH+Audit, Delete-Guards (401/403/404)

### Phase 3 — PO-Verwaltung Backend
- 30+ Admin-Endpunkte: Universities, Faculties, Programs, ExamRegulations, Modules + JSON-Import
- Archive/Restore mit Admin-Token + Begründungspflicht

### Phasen 4–12
KPIs/Analytics → Frontend Layout → Dashboard → AdminDataTable → User-UI → PO-UI → Import/Audit-Log → Admin-Link in Sidebar
- Soft Delete mit Begründungspflicht + Restore
- JSON-Bulk-Import für Module (bis 500, mit Validierung)
- AuditLogger Dependency → automatisches Logging jeder Mutation
- Analytics: KPIs, Wachstums-Zeitreihen, Modul-Stats
- `last_login_at` beim Login gesetzt

### Frontend
- `/admin` Route mit eigenem Layout (keine Dashboard-Komponenten)
- Middleware: `/admin/*` → 403 für is_admin=false
- AdminDataTable (server-side paginiert, sortierbar, filterbar, CSV-Export)
- Dashboard: KPI-Cards + Recharts LineChart
- User-Management: Tabelle + Detail + Quick-Actions
- PO-Tree: University → Faculty → Program → ExamReg → Modulkatalog
- Modul-Formular: alle Felder + Voraussetzungs-Editor + Audit-Sidebar
- JSON-Import-Seite mit Drag & Drop + Validierungsvorschau
- Audit-Log Timeline-View

### Admin-Flag setzen (einmalig nach erstem Login)

Kein Email-Seed im Code — Admin-Flag wird manuell gesetzt, damit keine persönlichen Daten im Repository landen:

```bash
docker compose exec db psql -U studynexus -d studynexus \
  -c "UPDATE users SET is_admin = TRUE WHERE email = 'deine@email.de';"
```

> Danach beim nächsten Login erhält der Account `is_admin: true` im JWT und hat Zugang zu `/admin/*`.
