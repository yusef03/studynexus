# CLAUDE.md – StudyNexus Project Memory

> This file is the single source of truth for AI-assisted development.
> Update this file at the end of every session.

---

## Project Overview

**Name:** StudyNexus
**Type:** B2C SaaS – Gamified Study and Collaboration Platform
**Status:** 🟡 Sprint 1 – Infrastructure running, Auth next
**Repository:** https://github.com/yusef03/studynexus
**Last Updated:** 2026-04-18

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | FastAPI (Python), SQLAlchemy, Alembic, Pydantic |
| Database | PostgreSQL (primary), Redis (cache/sessions) |
| Auth | Auth.js v5 (NextAuth) |
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
- Freemium-ready: architecture supports free/premium tiers
- Shell: fish shell – always use fish-compatible commands (no heredoc EOF)
- Config: next.config.js (not .ts) – Next.js 14.2.3 does not support .ts config

---

## Project Structure

studynexus/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── user_story.md
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── workflows/
│   └── PULL_REQUEST_TEMPLATE.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── globals.css
│   │   │   └── layout.tsx
│   │   ├── components/ui/
│   │   │   └── button.tsx
│   │   ├── i18n/request.ts
│   │   ├── lib/utils.ts
│   │   └── middleware.ts
│   ├── messages/
│   │   ├── de.json
│   │   └── en.json
│   ├── public/manifest.json
│   ├── next.config.js
│   ├── package.json
│   └── package-lock.json
├── backend/
│   ├── app/
│   │   ├── core/security.py
│   │   ├── models/user.py
│   │   ├── routers/health.py
│   │   ├── schemas/user.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── docs/
│   ├── architecture/
│   ├── requirements/
│   │   ├── use-cases.md
│   │   ├── domain-model.md
│   │   └── nfas.md
│   ├── sprints/
│   │   └── sprint-plan.md
│   └── api/
│       └── health.md
├── docker-compose.yml
├── .env.example
├── CLAUDE.md
└── README.md

---

## Running the Stack

cp .env.example .env
docker compose up --build

Frontend  → http://localhost:3000/de
API docs  → http://localhost:8000/api/docs

---

## Current Sprint

**Sprint:** 1 – Infrastructure and Authentication
**Goal:** Working auth system with JWT
**Status:** 🟡 In Progress

---

## Completed Steps

- [x] GitHub repository created (public)
- [x] Local clone and folder structure
- [x] .gitignore configured
- [x] README.md created with badges
- [x] CLAUDE.md created
- [x] Issue Templates: User Story, Bug Report, Feature Request
- [x] Pull Request Template
- [x] Use Cases documented (UC01-UC11)
- [x] Domain Model documented (6 classes)
- [x] NFAs documented (7 measurable requirements)
- [x] Sprint Plan documented (Sprint 0-6)
- [x] GitHub Projects Scrum Board (5 columns)
- [x] 6 User Stories for Sprint 1 created as Issues
- [x] GitHub CLI installed and configured
- [x] Docker Compose setup (Next.js + FastAPI + PostgreSQL + Redis)
- [x] Frontend running at localhost:3000/de
- [x] Backend API running at localhost:8000/api/docs
- [x] i18n working (de/en)
- [x] shadcn/ui Button component
- [x] Health check endpoints (GET /api/v1/ping, GET /api/v1/health)
- [x] package-lock.json extracted and committed

## Next Steps

- [ ] Issue #2: POST /auth/register endpoint (FastAPI)
- [ ] Issue #3: POST /auth/login + logout endpoint (FastAPI)
- [ ] Issue #4: JWT refresh token system
- [ ] Issue #5: Login and Register UI pages (Next.js)
- [ ] Issue #6: Protected routes middleware (Next.js)
- [ ] Switch Dockerfile npm install back to npm ci
- [ ] Run first Alembic migration

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
4. Follow existing folder structure strictly
5. Every new component needs a corresponding test file
6. All API endpoints must be documented in docs/api/
7. Commit messages: type(scope): description
   - feat(auth): add login endpoint
   - fix(dashboard): correct GPA calculation
   - docs(readme): update setup guide
8. Never commit .env files
9. Update CLAUDE.md at the end of every session
10. One step at a time - explain before implementing
11. Claude Code prompts always in English
