# ANTIGRAVITY.md - StudyNexus Project Memory

> This file is the single source of truth for AI-assisted development.
> Update this file at the end of every session.

---

## Project Overview

**Name:** StudyNexus
**Type:** B2C SaaS - Gamified Study and Collaboration Platform for HsH students
**Status:** ✅ Sprint 3.7.7 Complete — Sprint 4 (BIN Studiengang Vollintegration) next
**Repository:** https://github.com/yusef03/studynexus
**Last Updated:** 2026-05-08

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| i18n | next-intl (DE + EN), date-fns locale-aware formatting |
| Backend | FastAPI (Python), SQLAlchemy, Alembic, Pydantic |
| Database | PostgreSQL (primary), Redis (cache/sessions) |
| Auth | JWT (python-jose), bcrypt 4.1.3 (direct, no passlib), httpOnly cookies |
| AI | OpenAI API / Claude API via LangChain |
| DevOps | Docker Compose (local), GitHub Actions (CI/CD) |
| Testing | pytest (backend), Jest (frontend) |

---

## Architecture Decisions

- Monorepo: frontend/ and backend/ in one repo
- API-first: FastAPI REST API, Next.js consumes it
- Mobile-First PWA: responsive, offline-capable
- i18n from day 1: German + English (next-intl), default locale: de
- DSGVO compliant: strict permission model, httpOnly cookies
- Freemium-ready: is_premium field on User model
- Shell: fish shell - never use heredoc EOF syntax
- Config: next.config.js not .ts (Next.js 14.2.3 limitation)
- Password hashing: bcrypt 4.1.3 direct, never passlib
- Auth: httpOnly cookie via Next.js API proxy, never localStorage
- Two API URLs: NEXT_PUBLIC_API_URL (browser) + BACKEND_API_URL (Docker-internal)
- **HsH-only platform:** registration restricted to @stud.hs-hannover.de email addresses
- **Admin-managed POs:** exam regulations and module data entered manually by admin (Yusef), not crowdsourced
- **postgresql.ENUM in migrations:** always use `postgresql.ENUM` from `sqlalchemy.dialects.postgresql`, never `sa.Enum`, to avoid duplicate CREATE TYPE errors
- **CSRF Protection:** Next.js middleware validates `x-studynexus-client: true` header on all mutating requests (POST, PUT, DELETE, PATCH) + Origin/Host check
- **Token Lifetime:** JWT access tokens expire after 7 days (10080 minutes) in development. Cookie maxAge matches.
- **i18n Full Coverage:** All UI strings use `useTranslations()` from next-intl. Zero hardcoded German/English strings. Date formatting is locale-aware (`date-fns`, `toLocaleDateString`).

---

## Running the Stack

```
cp .env.example .env
docker compose up --build
```

Frontend  -> http://localhost:3000/de
API docs  -> http://localhost:8000/api/docs

Before building Docker (clears stale pytest cache):
```
sudo rm -rf backend/.pytest_cache
docker compose up --build
```

Run migrations: `docker compose exec backend alembic upgrade head`
Run tests:      `docker compose exec backend pytest tests/ -v`

Migration status:
- 0001: users table ✅
- 0002: study plan tables + HSH seed data ✅
- 0003: kuerzel, gewichtung fixes, has_prerequisites, 9 Wahlpflichtmodule ✅
- 0004: email verification fields (is_verified, verification_code, verification_code_expires) ✅
- 0005: tasks + events tables for Mission Control ✅
- 0006: matrikelnummer field on users ✅
- 0007: semester_tag, event_date, lecturer fields on events ✅
- 0008: focus type + is_submission on tasks ✅
- 0009: profile fields (birth_date, hochschule) on users ✅
- 0010: plan_semester field on student_modules (StudyPlanBoard-only) ✅
- 0011: Fix all BIN module data (correct kuerzel BIN-100..BIN-210, ECTS, ist_benotet, has_prerequisites, gewichtung), delete fake placeholder modules, insert BIN-209 "Ergänzende Fächer", add custom_ist_benotet to student_modules ✅
- 0012: Add pruefungsart VARCHAR(20) + sws SMALLINT (both nullable) to modules; seed all 37 BIN modules with values from ATPO-FIV 2025 §7 + Modulhandbuch BIN 19WS ✅

---

## API Endpoints

### Auth (`/api/v1/auth`)

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | /auth/register | Register user (requires @stud.hs-hannover.de) | No |
| POST | /auth/verify | Verify 6-digit email code | No |
| POST | /auth/login | Login, JWT in httpOnly cookie | No |
| POST | /auth/logout | Logout, clear cookie | Yes |

### User Profile (`/api/v1/me`)

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /me | Get current user profile | Yes |
| PUT | /me/profile | Update profile fields | Yes |
| PUT | /me/password | Change password (old + new) | Yes |

### Study Plan (`/api/v1/me`)

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /universities | List universities | No |
| GET | /universities/{id}/faculties | List faculties | No |
| GET | /faculties/{id}/programs | List programs | No |
| GET | /programs/{id}/exam-regulations | List exam regs | No |
| GET | /exam-regulations/{id}/modules | Modules by semester | No |
| POST | /me/program | Select degree program | Yes |
| GET | /me/program | Get my program (auto-creates PFLICHT modules) | Yes |
| PUT | /me/program | Change program | Yes |
| GET | /me/modules | All my modules grouped by semester | Yes |
| POST | /me/modules | Add WAHLPFLICHT or custom ERGAENZEND module | Yes |
| PUT | /me/modules/{id} | Update status/note/dates | Yes |
| DELETE | /me/modules/{id} | Remove module (not if PASSED) | Yes |
| GET | /me/stats | GPA, ECTS, progress stats | Yes |

### Mission Control - Tasks (`/api/v1/mission/tasks`)

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /mission/tasks/ | List all tasks for current user | Yes |
| POST | /mission/tasks/ | Create a new task | Yes |
| PUT | /mission/tasks/{id} | Update task (status, priority, etc.) | Yes |
| DELETE | /mission/tasks/{id} | Delete a task | Yes |

### Mission Control - Events (`/api/v1/mission/events`)

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /mission/events/?semester_tag=X | List events for semester | Yes |
| POST | /mission/events/ | Create a new event (collision detection) | Yes |
| PUT | /mission/events/{id} | Update event | Yes |
| DELETE | /mission/events/{id} | Delete event | Yes |

### System

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /ping | Health ping | No |
| GET | /health | Health check | No |

---

## Sprint Completion Log

### Sprint 1 – Infrastructure & Auth ✅
- Docker Compose, FastAPI, Next.js boilerplate
- JWT Authentication, httpOnly cookies
- Login/Register UI

### Sprint 2 – Study Plan & Grades ✅
- 7 DB models (University → StudentModule)
- GPA & ECTS calculation engine
- HSH seed data (32 modules, 6 semesters, 180 ECTS)
- Full frontend: Setup wizard, ModuleList, ModuleModal, AddModuleModal, StatsCard

### Sprint 3A – Auth Hardening ✅
- Email domain validation (@stud.hs-hannover.de)
- Email verification (6-digit code via Resend)
- TanStack Query migration
- CSRF protection (middleware)
- StudyNexus branding

### Sprint 3B – Mission Control ✅
- Interactive Schedule Board (15-min CSS Grid)
- Kanban Board (Drag & Drop, 4 columns)
- Smart Timeline, Daily Focus, Exam Countdown widgets
- Soft collision detection (HTTP 409)
- Semester binding, block events, ghosting mode
- Event types: LECTURE, EXERCISE, TUTORIAL, SEMINAR, PRACTICUM, CUSTOM_STUDY, FOCUS, EXAM, WORK, LIFE

### Sprint 3.5 – Mobile Ergonomics ✅
- Mobile Quick Add FAB (global floating action button)
- Mobile Agenda View (replaces grid on small screens)
- Submissions support (is_submission flag on tasks)
- iOS Safari auto-zoom fix

### Sprint 3.6 – UX Polish ✅
- Mobile Drag & Drop (mobile-drag-drop polyfill)
- Visual Study Plan Board (Drag & Drop semester columns)
- Digital ID Card (glassmorphism design)
- Settings page (tabs: Personal, Security, Appearance)
- Dashboard greeting with real user name

### Sprint 3.7 – Rework (Phases 1–5 Complete) ✅
- **Phase 1:** Registration fields (matrikelnummer, birth_date, hochschule) as required
- **Phase 2:** Settings with real data, password change API (`PUT /me/password`), language switcher
- **Phase 3:** Mobile Kanban Rework — `@dnd-kit/core` + `@dnd-kit/sortable`, DragOverlay, KanbanCard/KanbanColumn
- **Phase 4:** Studienplan Builder — `@dnd-kit`, dynamic `+ Neues Semester`, StudyPlanCard/StudyPlanColumn, optimistic mutations
- **Phase 5:** Smart FAB — MobileQuickAdd hidden on /settings, /profile, /setup via `usePathname()`
- **i18n Full Coverage:** all pages/modals/widgets via next-intl (de.json + en.json)
- **Bugfixes:** Token lifetime 30min→7days, hook-order violations, semester field isolation, 401 auto-redirect

### Sprint 3.7.7 – BIN PO Data Fix (Complete) ✅
Review: `docs/sprints/sprint-3.7.7-review.md`

- **Migration 0011:** Alle 27 PFLICHT kuerzel (BIN-100..BIN-210) korrigiert. 9 WAHLPFLICHT-Namen auf echte PO-Namen. BIN-209 "Ergänzende Fächer" eingefügt + für bestehende User provisioniert. Fake-Platzhalter gelöscht. `custom_ist_benotet` Column auf student_modules.
- **Backend:** `custom_ist_benotet` in Model, Schema, Router. WAHLPFLICHT-Limit (max 2) mit HTTP 409 durchgesetzt.
- **Frontend:** `custom_ist_benotet` in types + useAddModule. `ModuleModal` Bug-Fix (custom Module zeigten immer "unbenotet"). `AddModuleModal` mit WAHLPFLICHT-Warning, BIN-209 Hinweis, Benotet-Checkbox. `ModuleList` berechnet wahlpflichtCount.

---

## Next Steps

### Sprint 4 — BIN Studiengang Vollintegration (NÄCHSTER SPRINT)

**Ziel:** BIN vollständig und intelligent in StudyNexus integrieren — alle PO-Regeln automatisch abgebildet.

**Phase 1 — Prüfungsarten & Modul-Metadaten (Migration 0012):**
- [ ] `pruefungsart VARCHAR NULLABLE` + `sws SMALLINT NULLABLE` auf modules
- [ ] BIN-Seed: PX (Standard), EA (BIN-114/206/208), R (BIN-204), BAA+Ko (BIN-210)
- [ ] Backend Schema + Frontend types + ModuleModal Prüfungsart-Badge

**Phase 2 — Vorprüfungs-Milestone Dashboard:**
- [ ] `GET /me/stats` erweitern: sem1_complete, vorpruefung_bestanden, sem4/5/6_zugaenglich, ba_zulassung_eligible, ects_fuer_ba
- [ ] Dashboard: MilestoneWidget (neu) mit Vorprüfungs-Status und BA-Fortschritt

**Phase 3 — BIN-209 Sub-Modul-Katalog:**
- [ ] AddModuleModal: Dropdown mit 7 offiziellen Namen (BIN-209-01..07: Erg. Fach A-D + BWL-Fach A-C)
- [ ] Validierung: mind. 1 BWL-Fach bei BIN-209

**Phase 4 — Technische Schulden:**
- [ ] Semester-Tag im FAB dynamisch (aus `GET /me/program` start_semester)
- [ ] `/api/me/profile` Route im Next.js Proxy anlegen (GET + PUT)

**Phase 5 — module_prerequisites Tabelle (ADR-010):**
- [ ] Migration 0013: module_prerequisites Tabelle
- [ ] BIN-Seed: alle Zulassungsregeln nach §6 PO BIN 2019

**Phase 6 — Notenvalidierung:**
- [ ] Backend: nur offizielle HsH-Noten (1.0/1.3/1.7/2.0/2.3/2.7/3.0/3.3/3.7/4.0/5.0)
- [ ] Frontend: Dropdown mit 11 Optionen statt Freitextfeld

### Sprint 5 — Admin Panel
- [ ] is_admin Flag + Admin Auth Guard
- [ ] CRUD für University/Faculty/Program/ExamRegulation/Module über Admin-UI
- [ ] CRUD für module_prerequisites
- [ ] Ersetzt manuelle Alembic-Migrationen für neue Studiengänge

### Sprint 6 — PWA, Branding & Launch
- [ ] Service Worker + Offline-Cache
- [ ] GitHub Actions CI/CD
- [ ] Cloud Deployment (Railway oder Render)
- [ ] Security Audit (OWASP Top 10)
- [ ] Landing Page

### Sprint 7 — Multi-Program-Architektur
- [ ] MDI Studiengang (Medieninformatik) hinzufügen
- [ ] MIN/MMI Master (optional)

### Sprint 8 — Community & Kollaboration (fern geplant)
- [ ] Modul-Wiki (Beschreibungen, Prüfungsarten, Bewertungen)
- [ ] Anonyme Modulevaluationen (DSGVO-konform)
- [ ] Study Spaces (digitale Lerngruppen mit geteiltem Kanban)
- [ ] PDF-Upload und -Sharing

---

## BIN Studiengang — PO-Regeln & Architektur (Referenz)

### GPA-Gewichtungen (modules.gewichtung)
| Modul | Gewichtung | Grund |
|---|---|---|
| BIN-114 Programmierprojekt | 0.0 | EA (Experimentelle Arbeit), fließt nicht in GPA |
| BIN-116 Englisch | 0.0 | Unbewertet für GPA, trotzdem Pflicht für Vorprüfung |
| BIN-204 Seminar | 0.0 | Referat (R), unbenotet |
| BIN-206 Praxisprojekt 1 | 0.0 | EA, unbenotet |
| BIN-208 Praxisprojekt 2 | 0.0 | EA, unbenotet |
| BIN-209 Ergänzende Fächer | 1.5 | PFLICHT, sub-Module sollten in BIN-209-Note fließen (Bug — Sprint 4 Phase 5) |
| BIN-210 Bachelorarbeit + Kolloquium | 4.0 | Höchste Gewichtung im Studium |

### §6 PO BIN 2019 — Zulassungsvoraussetzungen (exakt)

**Semester-Definitionen (BIN, semester_empfehlung-basiert):**
- Sem 1 (6 Module): BIN-100, BIN-101, BIN-102, BIN-103, BIN-104, BIN-116
- Sem 2 (5 Module): BIN-105, BIN-106, BIN-107, BIN-108, BIN-109
- Sem 3 (6 Module): BIN-110, BIN-111, BIN-112, BIN-113, BIN-114, BIN-115
- Vorprüfung = alle 17 Module Sem 1–3 (BIN-100..BIN-116) bestanden

**Zulassungsregeln:**
- Sem 4: alle Sem-1-Prüfungen bestanden — **BIN-116 Englisch muss dabei sein!**
- Sem 5: alle Sem-1 + Sem-2-Prüfungen bestanden
- Sem 6 + BIN-206: Bachelor-Vorprüfung bestanden (alle Sem 1–3)
- BIN-210 Bachelorarbeit: Vorprüfung + mind. 134 ECTS bestanden
- BIN-209 Ergänzende Fächer: **KEINE Voraussetzung** — jederzeit zugänglich!

### Prüfungsarten BIN (ATPO-FIV 2025 §7 + PO Anlage B1/B2)
| Code | Bezeichnung | BIN-Module |
|---|---|---|
| PX | Klausur oder mündliche Prüfung (90 Min.) | Alle Standard-PFLICHT + WP |
| EA | Experimentelle Arbeit | BIN-114, BIN-206, BIN-208 |
| R | Referat | BIN-204 |
| BAA+Ko | Bachelorarbeit mit Kolloquium | BIN-210 |

### Multi-Program-Architektur (bereits fertig, kein Code-Change nötig)
Das DB-Schema `University → Faculty → Program → ExamRegulation → Module → StudentModule` ist vollständig multi-program-fähig. **Neue Studiengänge benötigen NUR eine neue Alembic-Migration mit Seed-Daten** — keine Code-Änderungen.

**Studiengänge Fakultät IV (laut ATPO-FIV 2025):**
- MDI — Medieninformatik und Interaktives Entertainment (Bachelor) → Sprint 7 zuerst
- MIN — Informatik (Master)
- MMI — Medieninformatik (Master)

**Wichtige Invariante:** `StudentModule` hat **keine FK auf `UserProgram`** (bewusst). Bei Programmwechsel bleiben bestehende StudentModules erhalten — Bestandsschutz für bereits eingetragene Noten. Nur wenn explizit gewünscht → `user_program_id` FK nachrüsten.

**WAHLPFLICHT-Limit (2 Module):** Aktuell hardcoded für BIN im Backend. Muss program-aware werden vor Sprint 7 (jedes Programm hat sein eigenes Limit laut PO).

---

## Known Limitations

- Custom ERGAENZEND modules (BIN-209 Ergänzende Fächer) are entered manually. The 7 official sub-module names from PO Anlage B2 (BIN-209-01..07) are not yet offered as a dropdown — Sprint 4 Phase 3.
- WAHLPFLICHT limit is hardcoded to 2 in the backend — correct for BIN, but must become program-aware before adding other programs (Sprint 7).
- `pruefungsart` (PX/EA/R/BAA+Ko) is not yet stored per module — Sprint 4 Phase 1.
- BIN-209 GPA contribution: sub-modules (custom ERGAENZEND) are currently excluded from GPA. Correct behavior per PO: they should flow into BIN-209 module note (gewichtung=1.5). Sprint 4+.
- Note validation: backend accepts arbitrary decimals. Only 11 official HsH grades should be allowed (1.0/1.3/…/5.0 per ATPO-FIV 2025 §10) — Sprint 4 Phase 6.
- 404/500 prerender warnings during `next build` (Next.js + next-intl standalone mode issue — does not affect runtime).
- `module_prerequisites` table (ADR-010) was never built — `has_prerequisites` is only a boolean flag. Full prerequisite logic comes in Sprint 4 Phase 5.

---

## Strategic Decisions

| Decision | Sprint | Notes |
|---|---|---|
| HsH-only platform | Sprint 3A | Registration requires @stud.hs-hannover.de email |
| Email Provider | Sprint 3A | Resend (resend.com) via Python SDK (ADR-011) |
| Email verification | Sprint 3A | 6-digit code, expires in 15 min |
| Matrikelnummer | Sprint 3A | OPTIONAL (not required) - student can add it in profile settings |
| Vorprüfungs-logic | Sprint 3A | Replaced by module_prerequisites table (ADR-010) |
| Bachelor/Master compatibility | Sprint 3 / Sprint 5 | DB model supports both via `abschluss` field on Program |
| Admin panel | Sprint 5 | Yusef-only; used to manage POs and module data |
| CSRF Protection | Sprint 3B | Custom header `x-studynexus-client` + Origin check (ADR-012) |
| i18n Full Integration | Sprint 3.7 | next-intl with DE/EN, originally planned for Sprint 6, pulled forward (ADR-013) |
| Token Lifetime | Sprint 3.7 | 7 days in dev, was 30 min causing constant re-logins (ADR-014) |
| @dnd-kit für alle DnD | Sprint 3.7 | Ersetzt HTML5 DnD + mobile-drag-drop Polyfill (ADR-015) |
| plan_semester getrennt von semester | Sprint 3.7 | StudyPlanBoard schreibt nur plan_semester, Notenflow nur semester (ADR-016) |
| BIN-209 als PFLICHT Container | Sprint 3.7.7 | Ergänzende Fächer als custom ERGAENZEND à 2 ECTS — Option A aus po-architecture-analysis.md |
| custom_ist_benotet auf StudentModule | Sprint 3.7.7 | Custom-Module ohne Katalogeintrag brauchen eigenes ist_benotet (ADR-017) |
| WAHLPFLICHT-Limit hardcoded = 2 | Sprint 3.7.7 | BIN PO erlaubt genau 2 WP-Module (12 ECTS) — Backend 409 + Frontend Warning |

---

## Key Domain Language

| Term | Meaning |
|---|---|
| Modul | University course with ECTS credits |
| PO | Pruefungsordnung - exam regulations |
| ECTS | European Credit Transfer System |
| GPA | Grade Point Average, calculated dynamically |
| Skill-Tree | Visual interactive module dependency graph (planned) |
| Study Space | Digital collaborative study group (planned) |
| Mission Hub | Central deadline and event management |
| Sprint | 2-week Scrum development cycle |
| Matrikelnummer | Student ID number (HsH-issued) |
| Semester-Tag | Unique identifier for a semester period (e.g. WiSe2425) |
| Ghosting | Temporarily hiding schedule events without deleting them |

---

### Open Points — Sprint 4 (Stand 2026-05-08)

Vollständige Task-Listen mit Details: `docs/sprints/sprint-plan.md` → Sprint 4 Phasen 1–6.

**Phase 1 — Migration 0012** ✅ abgeschlossen:
- [x] `pruefungsart VARCHAR(20) NULLABLE` + `sws SMALLINT NULLABLE` auf `modules`
- [x] BIN-Seed: PX (Standard), EA (BIN-114/206/208), R (BIN-204), BAA+Ko (BIN-210)
- [x] Backend `ModuleResponse` + `module.py` erweitert; i18n-Keys in de.json + en.json
- [x] ModuleModal: farbige Prüfungsart-Badge (PX=blau, EA=amber, R=lila, BAA+Ko=emerald) + SWS-Chip
- [x] ModuleList: Prüfungsart-Chip in jeder Modulzeile

**Phase 2 — Vorprüfungs-Milestone Dashboard:**
- [ ] `GET /me/stats` erweitern: `sem1_complete`, `sem2_complete`, `vorpruefung_bestanden`, `sem4/5/6_zugaenglich`, `ba_zulassung_eligible`, `ects_fuer_ba`
- [ ] Dashboard: neues `MilestoneWidget` (Vorprüfungs-Status + BA-ECTS-Balken + Sem-Freischaltung)
- [ ] Modullisten für Berechnung: Sem 1 = BIN-100..104 + BIN-116; Sem 2 = BIN-105..109; Sem 3 = BIN-110..115

**Phase 3 — BIN-209 Sub-Modul-Katalog:**
- [ ] AddModuleModal: Dropdown mit 7 offiziellen Namen (BIN-209-01 Erg. Fach A–D + BIN-209-05..07 BWL-Fach A–C)
- [ ] Validierung: mind. 1 BWL-Fach (BIN-209-05..07) bei BIN-209-Belegung

**Phase 4 — Tech Debt:**
- [ ] FAB `MobileQuickAdd.tsx`: semester_tag dynamisch aus `GET /me/program` (statt hardcoded "WiSe2425")
- [ ] `frontend/src/app/api/me/profile/route.ts` anlegen (GET + PUT, analog zu anderen Proxy-Routes)

**Phase 5 — module_prerequisites (ADR-010) + BIN-209 GPA-Fix:**
- [ ] Migration 0013: `module_prerequisites` Tabelle + BIN-Seed (alle §6-Regeln)
- [ ] BIN-209 GPA-Fix: sub-Module (ERGAENZEND) sollen avg → BIN-209-Note → × 1.5 in GPA fließen

**Phase 6 — Notenvalidierung:**
- [ ] Backend Pydantic-Validator: nur 1.0/1.3/1.7/2.0/2.3/2.7/3.0/3.3/3.7/4.0/5.0 (ATPO-FIV §10)
- [ ] Frontend: Dropdown mit 11 Optionen statt Freitextfeld


## Important Rules for AI Code Generation

1. Always read this file first before writing any code
2. Shell is fish - never use heredoc EOF syntax
3. Use next.config.js not next.config.ts
4. Password hashing: use bcrypt directly, never passlib
5. Auth: httpOnly cookie via Next.js API proxy, never localStorage
6. Follow existing folder structure strictly
7. Every new component needs a corresponding test file
8. All API endpoints must be documented in docs/api/
9. Commit messages: type(scope): description
10. Never commit .env files
11. Update ANTIGRAVITY.md at the end of every session
12. AI Code prompts always in English
13. .dockerignore handles cache exclusions (`.pytest_cache`, `__pycache__`, etc.) during Docker builds.
14. Migrations: always use `postgresql.ENUM` (sqlalchemy.dialects.postgresql), never `sa.Enum`
15. `Program.abschluss` supports "Bachelor" and "Master". Never hardcode semester prerequisites.
16. TanStack Query Architecture: Install `@tanstack/react-query`, create hooks in `frontend/src/hooks/queries/`. Components only call hooks; no data fetching logic inside components.
17. TanStack Query Mandate: ALL data fetching and mutations MUST use TanStack Query custom hooks. Manual `useEffect` fetching is strictly forbidden.
18. i18n Mandate: ALL user-facing strings MUST use `useTranslations()` from next-intl. No hardcoded strings in components. Keys organized under `dashboard.*` namespace in `messages/de.json` and `messages/en.json`.
19. Date formatting: Always use locale-aware formatting (`useLocale()` from next-intl + `date-fns` locale or `toLocaleDateString`).
