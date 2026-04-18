# CLAUDE.md - StudyNexus Project Memory

> This file is the single source of truth for AI-assisted development.
> Update this file at the end of every session.

---

## Project Overview

**Name:** StudyNexus
**Type:** B2C SaaS - Gamified Study and Collaboration Platform
**Status:** 🟢 Sprint 1 Complete - Starting Sprint 2
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

---

## Current Sprint

**Sprint:** 2 - Studienplan und Notenmanagement
**Goal:** Module, Noten, GPA, ECTS verwalten
**Status:** 🔴 Not Started

---

## Sprint 1 - Completed

All 6 issues closed. 16 story points delivered.
See: docs/sprints/sprint-1-review.md

## Next Steps - Sprint 2

- [ ] Create Sprint 2 GitHub Issues
- [ ] University and degree program selection
- [ ] Module management CRUD
- [ ] Grade entry and GPA calculation
- [ ] ECTS tracking
- [ ] Alembic migrations for new models

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
