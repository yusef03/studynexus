# CLAUDE.md – StudyNexus Project Memory

> This file is the single source of truth for AI-assisted development.
> Update this file at the end of every session.

---

## Project Overview

**Name:** StudyNexus
**Type:** B2C SaaS – Gamified Study and Collaboration Platform
**Status:** 🟡 Sprint 1 – Auth complete, UX improvements next
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

- Monorepo structure: frontend/ and backend/ in one repo
- API-first: FastAPI backend exposes REST API, Next.js consumes it
- Mobile-First PWA: responsive, offline-capable
- i18n from day 1: German and English (next-intl), default locale: de
- DSGVO compliant: AES-256 at rest, TLS 1.3 in transit, strict permission model
- Freemium-ready: is_premium field on User model
- Shell: fish shell - always use fish-compatible commands (no heredoc EOF)
- Config: next.config.js (not .ts) - Next.js 14.2.3 does not support .ts config
- Password hashing: bcrypt 4.1.3 direct (passlib removed - incompatible with bcrypt 5.x)
- Auth cookies: httpOnly cookie via Next.js API proxy (browser never touches JWT directly)
- Two API URLs: NEXT_PUBLIC_API_URL for browser, BACKEND_API_URL for Docker-internal calls

---

## Project Structure

studynexus/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── PULL_REQUEST_TEMPLATE.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/auth/login/route.ts
│   │   │   ├── api/auth/register/route.ts
│   │   │   ├── api/auth/logout/route.ts
│   │   │   └── [locale]/
│   │   │       ├── login/page.tsx
│   │   │       ├── register/page.tsx
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx + tests
│   │   │   │   ├── RegisterForm.tsx + tests
│   │   │   │   └── LogoutButton.tsx + tests
│   │   │   └── ui/
│   │   │       ├── button.tsx + tests
│   │   │       ├── input.tsx + tests
│   │   │       └── label.tsx + tests
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
│   ├── requirements/use-cases.md + domain-model.md + nfas.md
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
| POST | /api/v1/auth/login | Login, get JWT cookie | No |
| POST | /api/v1/auth/logout | Logout, clear cookie | Yes |

---

## Current Sprint

**Sprint:** 1 – Infrastructure and Authentication
**Goal:** Working auth system with JWT
**Status:** 🟢 Nearly Done – all features working

---

## Completed Steps

- [x] GitHub repository, folder structure, .gitignore, README, CLAUDE.md
- [x] Issue Templates, PR Template
- [x] Use Cases, Domain Model, NFAs documented
- [x] Sprint Plan (Sprint 0-6) documented
- [x] GitHub Projects Scrum Board (5 columns)
- [x] 6 User Stories for Sprint 1 as Issues
- [x] GitHub CLI installed and configured
- [x] Docker Compose (Next.js + FastAPI + PostgreSQL + Redis)
- [x] Frontend running at localhost:3000/de
- [x] Backend API running at localhost:8000/api/docs
- [x] i18n working (de/en)
- [x] Issue #1: Docker Compose Setup DONE
- [x] Issue #2: POST /auth/register DONE
- [x] Issue #3: POST /auth/login + logout DONE
- [x] Alembic migration 0001 (users table) executed
- [x] 10/10 backend tests passing
- [x] JWT Token working (httpOnly cookie via Next.js proxy)
- [x] Issue #5: Login + Register pages with forms DONE
- [x] Issue #6: Protected routes middleware DONE
- [x] Dashboard placeholder page DONE
- [x] Input, Label, Button shadcn/ui components + tests
- [x] LoginForm, RegisterForm, LogoutButton + tests
- [x] Real user created and tested in PostgreSQL via TablePlus

## Next Steps

- [ ] Add password visibility toggle (eye icon) to LoginForm and RegisterForm
- [ ] Issue #4: JWT refresh token system
- [ ] Close Issues #4, #5, #6 on GitHub
- [ ] Move all done issues to Done column on Scrum Board
- [ ] Sprint 1 Review and Sprint 2 Planning

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
5. Auth: httpOnly cookie via Next.js API proxy, never localStorage
6. Follow existing folder structure strictly
7. Every new component needs a corresponding test file
8. All API endpoints must be documented in docs/api/
9. Commit messages: type(scope): description
10. Never commit .env files
11. Update CLAUDE.md at the end of every session
12. Claude Code prompts always in English
