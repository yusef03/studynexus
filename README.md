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

- ✅ **Mission Control Dashboard** — GPA tracker, ECTS progress, Smart Timeline, Exam Countdown
- ✅ **Interactive Schedule Board** — 15-min CSS Grid engine with collision detection, ghosting mode, and semester binding
- ✅ **Kanban Board** — Touch-native task management (@dnd-kit) with columns: To Do, In Progress, Exam Ready, Done
- ✅ **Visual Study Plan** — Dynamic semester buckets with touch DnD and "+ Add Semester" support
- ✅ **Digital ID Card** — Premium glassmorphism student ID with real university data
- ✅ **Settings & Profile** — Password change, personal data, language switcher
- ✅ **Mobile-First Experience** — Agenda view, Quick Add FAB, responsive navigation
- ✅ **Bilingual (DE/EN)** — Full i18n with next-intl, zero hardcoded strings
- 🤝 **Study Spaces** — Digital study groups with shared Kanban boards *(planned)*
- 📚 **Module Wiki** — Community knowledge base with anonymous module reviews *(planned)*
- 🤖 **AI Planning** — Smart recommendations and auto-scheduling *(planned)*
- 🏆 **Gamification** — XP, Badges, Streaks *(planned)*

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

## Authentication & Security

StudyNexus incorporates strict security mechanisms:
- **HsH-Only:** Registration strictly verifies the domain for `@stud.hs-hannover.de`.
- **Email Verification:** Accounts require a 6-digit confirmation code generated and sent via Resend API.
- **Stateless Session Control:** Next.js proxies manage `httpOnly` secure cookies (7-day lifetime).
- **CSRF Protection:** Custom header validation (`x-studynexus-client`) + Origin/Host matching on all mutating requests.

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
```

## License

MIT © 2026 Yusef
