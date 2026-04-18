# CLAUDE.md – StudyNexus Project Memory

> This file is the single source of truth for AI-assisted development.
> Update this file at the end of every session.

---

## Project Overview

**Name:** StudyNexus
**Type:** B2C SaaS – Gamified Study and Collaboration Platform
**Status:** 🟡 Sprint 1 – Auth backend done, UI next
**Repository:** https://github.com/yusef03/studynexus
**Last Updated:** 2026-04-18

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | FastAPI (Python), SQLAlchemy, Alembic, Pydantic |
| Database | PostgreSQL (primary), Redis (cache/sessions) |
| Auth | JWT (python-jose), bcrypt 4.1.3 (direct, no passlib) |
| AI | OpenAI API / Claude API via LangChain |
| DevOps | Docker Compose (local), GitHub Actions (CI/CD) |
| Testing | pytest (backend), Jest (frontend) |

---

## Architecture Decisions

- Monorepo structure: frontend/ and backend/ in one repo
- API-first: FastAPI backend exposes REST API, Next.js consumes it
- Mobile-First PWA: responsive, offline-capable
- i18n from day 1: German and English (next-intl), default locale: de
- DSGVO compliant: AES-256 at rest, TLS 1.3 in transit, strict permission model
- Freemium-ready: is_premium field on User model
- Shell: fish shell - always use fish-compatible commands (no heredoc EOF)
- Config: next.config.js (not .ts) - Next.js 14.2.3 does not support .ts config
- Password hashing: bcrypt 4.1.3 direct (passlib removed - incompatible with bcrypt 5.x)

---

## Project Structure

studynexus/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── PULL_REQUEST_TEMPLATE.md
├── frontend/
│   ├── src/
│   │   ├── app/[locale]/
│   │   ├── components/ui/button.tsx
│   │   ├── i18n/request.ts
│   │   ├── lib/utils.ts
│   │   └── middleware.ts
│   ├── messages/de.json + en.json
│   ├── public/manifest.json
│   ├── next.config.js
│   └── package.json + package-lock.json
├── backend/
│   ├── app/
│   │   ├── core/security.py (bcrypt direct)
│   │   ├── core/dependencies.py (get_current_user)
│   │   ├── models/user.py
│   │   ├── routers/health.py + auth.py
│   │   ├── schemas/user.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── alembic/versions/0001_create_users_table.py
│   ├── tests/test_health.py + test_auth.py
│   └── requirements.txt
├── docs/
│   ├── requirements/
│   ├── sprints/sprint-plan.md
│   └── api/health.md + auth.md
├── docker-compose.yml
├── .env.example
└── CLAUDE.md

---

## Running the Stack

cp .env.example .env
docker compose up --build

Frontend  → http://localhost:3000/de
API docs  → http://localhost:8000/api/docs

Run migration: docker compose exec backend alembic upgrade head
Run tests:     docker compose exec backend pytest tests/ -v

---

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/v1/ping | Health ping | No |
| GET | /api/v1/health | Health check | No |
| POST | /api/v1/auth/register | Register user | No |
| POST | /api/v1/auth/login | Login, get JWT | No |
| POST | /api/v1/auth/logout | Logout | Yes |

---

## Current Sprint

**Sprint:** 1 – Infrastructure and Authentication
**Goal:** Working auth system with JWT
**Status:** 🟡 In Progress – Backend done, Frontend next

---

## Completed Steps

- [x] GitHub repository created (public)
- [x] Local clone and folder structure
- [x] .gitignore, README.md, CLAUDE.md
- [x] Issue Templates + PR Template
- [x] Use Cases, Domain Model, NFAs documented
- [x] Sprint Plan (Sprint 0-6) documented
- [x] GitHub Projects Scrum Board (5 columns)
- [x] 6 User Stories for Sprint 1 as Issues
- [x] GitHub CLI installed and configured
- [x] Docker Compose (Next.js + FastAPI + PostgreSQL + Redis)
- [x] Frontend running at localhost:3000/de
- [x] Backend API running at localhost:8000/api/docs
- [x] i18n working (de/en), shadcn/ui Button component
- [x] Issue #1: Docker Compose Setup DONE
- [x] Issue #2: POST /auth/register DONE
- [x] Issue #3: POST /auth/login + logout DONE
- [x] Alembic migration 0001 (users table) executed
- [x] 10/10 backend tests passing
- [x] JWT Token working (tested in Swagger)
- [x] Real user created in PostgreSQL

## Next Steps

- [ ] Issue #4: JWT refresh token system
- [ ] Issue #5: Login and Register UI pages (Next.js)
- [ ] Issue #6: Protected routes middleware (Next.js)
- [ ] Move Issues #2 and #3 to Done on Scrum Board

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
3. Use next.config.js not next.config.ts (Next.js 14.2.3 limitation)
4. Password hashing: use bcrypt directly, never passlib
5. Follow existing folder structure strictly
6. Every new component needs a corresponding test file
7. All API endpoints must be documented in docs/api/
8. Commit messages: type(scope): description
9. Never commit .env files
10. Update CLAUDE.md at the end of every session
11. Claude Code prompts always in English
