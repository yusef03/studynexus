# CLAUDE.md - StudyNexus Project Memory

> This file is the single source of truth for AI-assisted development.
> Update this file at the end of every session.

---

## Project Overview

**Name:** StudyNexus
**Type:** B2C SaaS - Gamified Study and Collaboration Platform
**Status:** 🟡 Sprint 2 – Study Plan backend done, frontend next
**Repository:** https://github.com/yusef03/studynexus
**Last Updated:** 2026-04-18

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

---

## Running the Stack

cp .env.example .env
docker compose up --build

Frontend  -> http://localhost:3000/de
API docs  -> http://localhost:8000/api/docs

Run migration: docker compose exec backend alembic upgrade head
Run tests:     docker compose exec backend pytest tests/ -v

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

**Sprint:** 2 – Study Plan and Grade Management
**Goal:** Module, Noten, GPA, ECTS verwalten
**Status:** 🟡 Backend done, frontend next

---

## Sprint 2 – Backend Completed

- [x] 7 new DB models: University, Faculty, Program, ExamRegulation, Module, UserProgram, StudentModule
- [x] Alembic migration 0002 with all 7 tables + HSH seed data (32 modules, 6 semesters, 180 ECTS)
- [x] 5 public endpoints for browsing university/program catalog
- [x] 8 protected endpoints for study plan and grade management
- [x] GPA service with weighted formula: sum(note×ects×gewichtung)/sum(ects×gewichtung)
- [x] Stats endpoint (GPA, ECTS, Fortschritt, module counts)
- [x] 66 total backend tests passing, 5 test files
- [x] Docs: docs/api/study-plan.md + docs/api/stats.md
- [x] Alembic migration 0003: has_prerequisites column, kuerzel (BIN-101…BIN-603), gewichtung corrections (Bachelorarbeit=4, Praxisprojekte=0, BWL/Englisch=0.5), ECTS fixes (Praxisprojekt 2→7, Bachelorarbeit→15), 9 Wahlpflichtmodule (BIN-211…BIN-219)

## Next Steps – Sprint 2

- [ ] Frontend: university/program selection UI
- [ ] Frontend: module list view grouped by semester
- [ ] Frontend: grade entry form with validation
- [ ] Frontend: stats/dashboard with GPA and progress bar
- [ ] Run Alembic migrations: `docker compose exec backend alembic upgrade head`

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
