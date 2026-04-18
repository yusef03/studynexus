# CLAUDE.md – StudyNexus Project Memory

> This file is the single source of truth for AI-assisted development.
> Update this file at the end of every session.

---

## Project Overview

**Name:** StudyNexus
**Type:** B2C SaaS – Gamified Study and Collaboration Platform
**Status:** 🟡 Sprint 1 – Docker/Infrastructure setup done, Auth next
**Repository:** https://github.com/yusef03/studynexus
**Last Updated:** 2026-04-18 (Session 2)

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
- i18n from day 1: German and English (next-intl)
- DSGVO compliant: AES-256 at rest, TLS 1.3 in transit, strict permission model
- Freemium-ready: architecture supports free/premium tiers
- Shell: fish shell – always use fish-compatible commands (no heredoc EOF)

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
├── backend/
├── docs/
│   ├── architecture/
│   ├── requirements/
│   │   ├── use-cases.md
│   │   ├── domain-model.md
│   │   └── nfas.md
│   ├── sprints/
│   └── api/
├── CLAUDE.md
└── README.md

---

## Actors and Domain

### Actors
- Anonymer Besucher: can only register
- Studierender: primary user, all features
- Globale PO-Datenbank: external technical actor
- KI-Subsystem: internal, not an actor

### Key Use Cases
- UC02 Studiengang auswaehlen (includes UC03 PO synchronisieren)
- UC09 PDF-Skripte hochladen (extended by UC10 Karteikarten generieren)

### Domain Classes
- Studierender, Pruefungsordnung, Modul, Termin, Study Space, Dokument

---

## NFAs Summary

| ID | Kategorie | Wichtigstes Kriterium |
|---|---|---|
| NFA-01 | Datenschutz | DSGVO-konform, Noten streng privat |
| NFA-02 | Sicherheit | AES-256, TLS 1.3, bcrypt |
| NFA-03 | Portierbarkeit | PWA Score >= 90, Mobile-First |
| NFA-04 | Zuverlaessigkeit | Offline-faehig, 99.5% Uptime |
| NFA-05 | Performance | LCP <= 2.5s, API < 500ms |
| NFA-06 | Wartbarkeit | 80% Test Coverage, ADR Docs |
| NFA-07 | i18n | DE + EN von Anfang an |

---

## Current Sprint

**Sprint:** 0 – Project Setup and Requirements
**Goal:** Repository, documentation, requirements analysis
**Status:** 🟢 Abgeschlossen

---

## Completed Steps

- [x] GitHub repository created (public)
- [x] Local clone and folder structure
- [x] .gitignore configured (fish-shell compatible)
- [x] README.md created with badges
- [x] CLAUDE.md created
- [x] Issue Templates: User Story, Bug Report, Feature Request
- [x] Pull Request Template
- [x] Use Cases documented (UC01-UC11) in docs/requirements/
- [x] Domain Model documented (6 classes) in docs/requirements/
- [x] NFAs documented (7 measurable requirements) in docs/requirements/
- [x] Use Case Diagram drawn (with include and extend)
- [x] Domain Model Diagram drawn (class diagram)
- [x] All committed and pushed to GitHub

## Completed Steps (Session 2 – Sprint 1 Issue #1)

- [x] docker-compose.yml (Next.js + FastAPI + PostgreSQL + Redis, health checks)
- [x] .env.example with all required variables
- [x] frontend/ – Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, next-intl (DE/EN), PWA manifest
- [x] backend/ – FastAPI, SQLAlchemy, Alembic, Pydantic v2, User model, security utils
- [x] backend/tests/ – pytest with mocked DB, conftest, test_health
- [x] docs/api/health.md

## Next Steps

- [ ] GitHub Projects Scrum Board einrichten
- [ ] Sprint 1: Auth endpoints (register, login, JWT) – backend/app/routers/auth.py
- [ ] Sprint 1: Auth.js v5 integration on the frontend
- [ ] Run first Alembic migration for users table

---

## Key Domain Language

| Term | Meaning |
|---|---|
| Modul | University course with ECTS credits |
| PO | Pruefungsordnung – exam regulations |
| ECTS | European Credit Transfer System |
| GPA | Grade Point Average, calculated dynamically |
| Skill-Tree | Visual interactive module dependency graph |
| Study Space | Digital collaborative study group |
| Mission Hub | Central deadline and event management |
| Sprint | 2-week Scrum development cycle |

---

## Important Rules for Claude Code

1. Always read this file first before writing any code
2. Shell is fish – never use heredoc EOF syntax
3. Follow existing folder structure strictly
4. Every new component needs a corresponding test file
5. All API endpoints must be documented in docs/api/
6. Commit messages: type(scope): description
   - feat(auth): add login endpoint
   - fix(dashboard): correct GPA calculation
   - docs(readme): update setup guide
7. Never commit .env files
8. Update CLAUDE.md at the end of every session
9. One step at a time – explain before implementing
