# CLAUDE.md – StudyNexus Project Memory

> This file is the single source of truth for AI-assisted development.
> Update this file at the end of every session.

---

## Project Overview

**Name:** StudyNexus
**Type:** B2C SaaS – Gamified Study & Collaboration Platform
**Status:** 🟡 Setup Phase
**Repository:** https://github.com/yusef03/studynexus
**Last Updated:** 2025-04-18

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

- **Monorepo** structure: frontend/ and backend/ in one repo
- **API-first**: FastAPI backend exposes REST API, Next.js consumes it
- **Mobile-First PWA**: responsive, offline-capable
- **i18n from day 1**: German + English (next-intl)
- **DSGVO compliant**: data encrypted, strict permission model
- **Freemium-ready**: architecture supports free/premium tiers

---

## Project Structure

studynexus/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── PULL_REQUEST_TEMPLATE.md
├── frontend/
├── backend/
├── docs/
│   ├── architecture/
│   ├── requirements/
│   └── sprints/
├── docker-compose.yml
├── CLAUDE.md
└── README.md

---

## Current Sprint

**Sprint:** 0 – Project Setup
**Goal:** Repository, documentation structure, requirements analysis
**Status:** 🟡 In Progress

---

## Completed Steps

- [x] GitHub repository created
- [x] Local clone and folder structure
- [x] .gitignore configured
- [x] README.md created
- [x] CLAUDE.md created

## Next Steps

- [ ] GitHub Issue Templates
- [ ] PULL_REQUEST_TEMPLATE.md
- [ ] Requirements Analysis (Use Cases, Domain Model, NFAs)
- [ ] Sprint Plan defined
- [ ] docker-compose.yml base setup
- [ ] Sprint 1 begin

---

## Key Concepts & Domain Language

| Term | Meaning |
|---|---|
| Module | A university course/subject with ECTS credits |
| PO | Pruefungsordnung – exam regulations document |
| ECTS | European Credit Transfer System – credit points |
| GPA | Grade Point Average – calculated from all module grades |
| Skill-Tree | Visual interactive module dependency graph |
| Study Space | Digital collaborative study group |
| Mission Hub | Central deadline and event management interface |
| Sprint | 2-week development cycle (Scrum) |

---

## Important Rules for Claude Code

1. Always check this file first before writing any code
2. Follow the existing folder structure strictly
3. Every new component needs a corresponding test file
4. All API endpoints must be documented in docs/api/
5. Commit messages follow: type(scope): description
   - feat(auth): add login endpoint
   - fix(dashboard): correct GPA calculation
   - docs(readme): update setup guide
6. Never commit .env files
7. Update CLAUDE.md at the end of every session
