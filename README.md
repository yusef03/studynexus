# StudyNexus 🎓

> Gamified cloud-based SaaS platform for integrated study and collaboration management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-In%20Development-blue)]()

## What is StudyNexus?

StudyNexus is an integrated, cloud-based B2C SaaS application that combines personal study management, social collaboration tools, and gamified learning processes in one central platform — independent of outdated university IT infrastructure.

### The Engineering Approach 🤖
StudyNexus is a modern full-stack project that I developed in the role of **Product Owner & AI Engineer**. While the entire system architecture, UX/UI concepts, and problem-solving strategies are my own, I heavily orchestrated state-of-the-art AI agents (e.g., Claude) for code generation and refactoring. This AI-driven workflow reduced development time by over 90%. 

My primary focus during this project was on:
- **System Architecture** (Docker, FastAPI, Next.js, PostgreSQL)
- **Prompt Engineering & AI Orchestration**
- **UX/UI Design & Product Strategy**
- **Deployment & Security** (CSRF, JWT, TanStack Query)

## Core Features

### Study Management
- ✅ **Mission Control Dashboard** — GPA tracker, ECTS progress, Smart Timeline, Exam Countdown
- ✅ **Visual Study Plan** — Dynamic semester buckets with touch DnD, Wahlpflicht catalog, Ergänzend sub-modules
- ✅ **BIN PO Integration** — Full Prüfungsordnung import for B.Sc. Informatik (Hannover): module catalog, ECTS validation, Vorprüfungs-Milestone, prerequisites, `custom_ist_benotet` flag
- ✅ **PO-Übersicht** — Live progress table across all PO modules with note validation and pruefungsart badges
- ✅ **Note & Grade Logic** — Strict validation per pruefungsart, weighted GPA calculation, min-pass enforcement

### Scheduling & Tasks
- ✅ **Interactive Schedule Board** — 15-min CSS Grid engine with collision detection, ghosting mode, semester binding
- ✅ **Kanban Board** — Touch-native task management (@dnd-kit) with columns: To Do, In Progress, Exam Ready, Done
- ✅ **Mobile Quick Add FAB** — Floating action button for rapid task/event creation on mobile

### User Experience
- ✅ **Digital ID Card** — Premium glassmorphism student ID with real university data and current semester display
- ✅ **Current Semester Tracking** — Auto-calculated from registration start semester, shown across sidebar and profile
- ✅ **Settings & Profile** — Password change, personal data, university program, language switcher
- ✅ **Mobile-First Experience** — Agenda view, responsive navigation, touch-optimized interactions
- ✅ **Bilingual (DE/EN)** — Full i18n with next-intl, zero hardcoded strings

### Planned
- 🛠 **Admin UX & Data Operations** — PDF import, batch ops, dry-runs *(Sprint 6)*
- 🚀 **PWA, Branding & Launch** — Offline capability, deployments *(Sprint 7)*
- 🎓 **Multi-Program-Architektur** — Expanding beyond BIN *(Sprint 8)*
- 🤝 **Community & AI Features** — Study Groups, AI recommendations *(Sprint 9)*

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| i18n     | next-intl (DE + EN), date-fns locale-aware      |
| Backend  | FastAPI (Python), SQLAlchemy, Alembic           |
| Database | PostgreSQL, Redis                               |
| Auth     | JWT (python-jose), bcrypt 4.1.3, httpOnly proxy |
| AI       | OpenAI API / Claude API via LangChain           |
| DevOps   | Docker, GitHub Actions                          |

## Sprint Status

| Sprint | Focus | Status |
|--------|-------|--------|
| 1 | Auth, setup, base infra | ✅ Complete |
| 2 | Dashboard, schedule, kanban | ✅ Complete |
| 3 | Study plan, DnD, Quick Add FAB | ✅ Complete |
| 3.7 | BIN PO full integration | ✅ Complete |
| 4 | PO-Übersicht, note validation, Vorprüfungs-Milestone | ✅ Complete |
| 5 | Admin Panel (university/PO/user management, analytics, hotfixes) | ✅ Complete (100% Coverage + CI/CD) |
| 6 | Admin UX & Data Operations (Imports, Batch Ops) | Backlog |
| 7 | PWA, Branding & Launch | Backlog |
| 8 | Multi-Program-Architektur | Backlog |
| 9 | Community & AI Features | Backlog |

## Authentication & Security

StudyNexus incorporates strict security mechanisms:
- **HsH-Only:** Registration strictly verifies the domain for `@stud.hs-hannover.de`.
- **Email Verification:** Accounts require a 6-digit confirmation code generated and sent via Resend API.
- **Stateless Session Control:** Next.js proxies manage `httpOnly` secure cookies (7-day lifetime).
- **CSRF Protection:** Custom header validation (`x-studynexus-client`) + Origin/Host matching on all mutating requests.
- **Admin-Session:** Short-lived Redis tokens (15 min) for destructive admin operations, separate from regular session.
- **Audit Log:** Every admin mutation logged with before/after state, reason, and IP.

## Project Structure

```
studynexus/
├── frontend/               # Next.js App (App Router)
│   ├── messages/            # i18n translations (de.json, en.json)
│   ├── src/
│   │   ├── app/             # Pages & API routes
│   │   ├── components/      # UI components (kanban, schedule, study, dashboard)
│   │   ├── hooks/queries/   # TanStack Query hooks
│   │   └── types/           # TypeScript interfaces
├── backend/                 # FastAPI App
│   ├── app/
│   │   ├── routers/         # API endpoints
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── core/            # Auth, security, config
│   └── alembic/             # Database migrations
├── docs/                    # Documentation
│   ├── api/                 # API endpoint documentation
│   ├── architecture/        # Architecture Decision Records (ADR)
│   ├── requirements/        # Domain model, use cases, NFAs
│   └── sprints/             # Sprint plans & reviews
├── ANTIGRAVITY.md           # AI project memory
├── CHANGELOG.md             # Version history
└── docker-compose.yml       # Development environment
```

## Documentation

- [Architecture Decisions](docs/architecture/)
- [Requirements & Use Cases](docs/requirements/)
- [Sprint Plans & Reviews](docs/sprints/)
- [API Documentation](docs/api/)

## Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/yusef03/studynexus.git
cd studynexus

# 2. Configure environment
cp .env.example .env

# 3. Start all services
docker compose up --build

# 4. Run database migrations
docker compose exec backend alembic upgrade head
```

**Access:**
- Frontend: http://localhost:3000/de
- API Docs: http://localhost:8000/api/docs

**Useful commands:**
```bash
# Run backend tests
docker compose exec backend pytest tests/ -v

# Access database
docker compose exec db psql -U studynexus -d studynexus

# Note: Automated CI/CD Pipelines (GitHub Actions) are configured!
# Any push to `main` will trigger `frontend-ci.yml` and `backend-ci.yml`.
# Both pipelines enforce a strict 100% test coverage rule.
```

## License

MIT © 2026 Yusef
