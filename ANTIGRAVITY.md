# ANTIGRAVITY.md - StudyNexus Project Memory

> This file is the single source of truth for AI-assisted development.
> Update this file at the end of every session.

---

## Project Overview

**Name:** StudyNexus
**Type:** B2C SaaS - Gamified Study and Collaboration Platform for HsH students
**Status:** ✅ Sprint 3.7 Phase 2 Complete — Phase 3 (Mobile Kanban Rework) next
**Repository:** https://github.com/yusef03/studynexus
**Last Updated:** 2026-05-01

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

### Sprint 3.7 – Rework (Phase 1+2 Complete) ✅
- **Phase 1:** Registration fields (matrikelnummer, birth_date, hochschule) as required
- **Phase 2:** Settings with real data, password change API (`PUT /me/password`), language switcher
- **i18n Full Coverage:** Every UI string in all pages/modals/widgets translated via next-intl (de.json + en.json)
- **Bugfixes:** Token lifetime 30min→7days, semester-field removal from ModuleModal, 401 auto-redirect
- **Date formatting:** locale-aware via date-fns + toLocaleDateString

---

## Next Steps – Sprint 3.7 Phase 3

- [ ] Mobile Kanban Rework (replace HTML5 DnD with @dnd-kit or Tap-to-Move)
- [ ] Phase 4: Studienplan Builder (dynamic semester containers)
- [ ] Phase 5: Context-sensitive Quick Add button

---

## Known Limitations

- WAHLPFLICHT catalogue modules (BIN-211…BIN-219) have `semester_empfehlung = NULL` — they appear under "Ungeplant" when added.
- Catalogue ERGAENZEND modules are not shown in the picker — students must enter them as custom modules.
- Mobile Kanban Drag & Drop is unreliable (HTML5 polyfill) — rework planned in Phase 3.
- Studienplan Board has basic DnD but no dynamic "Add Semester" button yet — planned in Phase 4.

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
