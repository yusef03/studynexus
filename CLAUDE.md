# CLAUDE.md - StudyNexus Project Memory

> This file is the single source of truth for AI-assisted development.
> Update this file at the end of every session.

---

## Project Overview

**Name:** StudyNexus
**Type:** B2C SaaS - Gamified Study and Collaboration Platform for HsH students
**Status:** 🟡 Sprint 2 – Complete (backend + auth UI), Sprint 3 next
**Repository:** https://github.com/yusef03/studynexus
**Last Updated:** 2026-04-19

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
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

---

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/v1/ping | Health ping | No |
| GET | /api/v1/health | Health check | No |
| POST | /api/v1/auth/register | Register user | No |
| POST | /api/v1/auth/login | Login, JWT cookie | No |
| POST | /api/v1/auth/logout | Logout, clear cookie | Yes |
| GET | /api/v1/universities | List universities | No |
| GET | /api/v1/universities/{id}/faculties | List faculties | No |
| GET | /api/v1/faculties/{id}/programs | List programs | No |
| GET | /api/v1/programs/{id}/exam-regulations | List exam regs | No |
| GET | /api/v1/exam-regulations/{id}/modules | Modules by semester | No |
| POST | /api/v1/me/program | Select degree program | Yes |
| GET | /api/v1/me/program | Get my program (auto-creates PFLICHT modules) | Yes |
| PUT | /api/v1/me/program | Change program | Yes |
| GET | /api/v1/me/modules | All my modules grouped by semester | Yes |
| POST | /api/v1/me/modules | Add WAHLPFLICHT or custom ERGAENZEND module | Yes |
| PUT | /api/v1/me/modules/{id} | Update status/note/dates | Yes |
| DELETE | /api/v1/me/modules/{id} | Remove module (not if PASSED) | Yes |
| GET | /api/v1/me/stats | GPA, ECTS, progress stats | Yes |

---

## Current Sprint

**Sprint:** 3 – Mission Control Dashboard + Email Verification
**Goal:** Dashboard, Stundenplan, Email-Verifikation, Matrikelnummer
**Status:** 🔵 Planned

---

## Sprint 2 – Completed ✅

- [x] Password visibility toggle (LoginForm + RegisterForm)
- [x] 7 new DB models: University, Faculty, Program, ExamRegulation, Module, UserProgram, StudentModule
- [x] Alembic migration 0002: all 7 tables + HSH seed data (32 modules, 6 semesters, 180 ECTS), enum fix with postgresql.ENUM
- [x] 5 public endpoints for browsing university/program catalog
- [x] 8 protected endpoints for study plan and grade management
- [x] GPA service with weighted formula: sum(note×ects×gewichtung)/sum(ects×gewichtung)
- [x] Stats endpoint (GPA, ECTS, Fortschritt, module counts)
- [x] 66 total backend tests passing, 5 test files
- [x] Docs: docs/api/study-plan.md + docs/api/stats.md
- [x] Alembic migration 0003: has_prerequisites column, kuerzel (BIN-101…BIN-603), gewichtung corrections (Bachelorarbeit=4, Praxisprojekte=0, BWL/Englisch=0.5), ECTS fixes (Praxisprojekt 2→7, Bachelorarbeit→15), 9 Wahlpflichtmodule (BIN-211…BIN-219)

---

## Next Steps – Sprint 3

- [ ] Email verification: 6-digit code sent on register, must verify before login
- [ ] Matrikelnummer: required field on User model (Sprint 3 migration)
- [ ] Email domain validation: reject non-@stud.hs-hannover.de addresses on register
- [ ] Frontend: university/program selection UI
- [ ] Frontend: module list view grouped by semester
- [ ] Frontend: grade entry form with validation
- [ ] Frontend: stats/dashboard with GPA and progress bar
- [ ] Mission Control Dashboard (Stundenplan, Timeline, Kanban)

---

## Strategic Decisions

| Decision | Sprint | Notes |
|---|---|---|
| HsH-only platform | Sprint 3 | Registration requires @stud.hs-hannover.de email |
| Email verification | Sprint 3 | 6-digit code, must verify before first login |
| Matrikelnummer | Sprint 3 | Required field on User model |
| Admin panel | Sprint 5 | Yusef-only; used to manage POs and module data |
| PO management | Sprint 5 | Exam regulations entered manually by admin, not crowdsourced |
| Branding | Sprint 6 | StudyNexus name + HsH logo, launch-ready styling |

---

## Key Domain Language

| Term | Meaning |
|---|---|
| Modul | University course with ECTS credits |
| PO | Pruefungsordnung - exam regulations |
| ECTS | European Credit Transfer System |
| GPA | Grade Point Average, calculated dynamically |
| Skill-Tree | Visual interactive module dependency graph |
| Study Space | Digital collaborative study group |
| Mission Hub | Central deadline and event management |
| Sprint | 2-week Scrum development cycle |
| Matrikelnummer | Student ID number (HsH-issued) |

---

## Important Rules for Claude Code

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
11. Update CLAUDE.md at the end of every session
12. Claude Code prompts always in English
13. Before Docker builds: `sudo rm -rf backend/.pytest_cache` to avoid stale cache errors
14. Migrations: always use `postgresql.ENUM` (sqlalchemy.dialects.postgresql), never `sa.Enum`
