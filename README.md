# StudyNexus 🎓

> Gamified cloud-based SaaS platform for integrated study and collaboration management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-In%20Development-blue)]()

## What is StudyNexus?

StudyNexus is an integrated, cloud-based B2C SaaS application that combines personal study management, social collaboration tools, and gamified learning processes in one central platform — independent of outdated university IT infrastructure.

## Core Features (Planned)

- ✅ **Mission Control Dashboard** — GPA tracker, ECTS progress, weekly schedule
- ⏳ **Visual Study Plan** — Interactive module graph (Skill-Tree) synced with your exam regulations
- ✅ **Universal Mission Hub** — Deadlines, exams, and routines in one place
- ✅ **Mobile-First Experience** — Optimized Agenda view and Quick Add floating action button
- 🤝 **Study Spaces** — Digital study groups with shared Kanban boards
- 📚 **Module Wiki** — Community knowledge base with anonymous module reviews
- 🤖 **AI Planning** — Smart recommendations and auto-scheduling
- 🏆 **Gamification** — XP, Badges, Streaks

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend  | FastAPI (Python), SQLAlchemy, Alembic           |
| Database | PostgreSQL, Redis                               |
| Auth     | JWT (python-jose), bcrypt 4.1.3, httpOnly proxy |
| AI       | OpenAI API / Claude API via LangChain           |
| DevOps   | Docker, GitHub Actions                          |

## Authentication & Security

StudyNexus incorporates strict security mechanisms:
- **HsH-Only:** Registration strictly verifies the domain for `@stud.hs-hannover.de` prefixing.
- **Email Verification:** Accounts require a 6-digit confirmation code generated and sent via Resend API prior to login.
- **Stateless Session Control:** Next.js proxies manage `httpOnly` secure cookies.

## Project Structure

\`\`\`
studynexus/
├── frontend/ # Next.js App
├── backend/ # FastAPI App
├── docs/ # Documentation
│ ├── architecture/
│ ├── requirements/
│ └── sprints/
├── CLAUDE.md # AI project memory
└── docker-compose.yml
\`\`\`

## Documentation

- [Architecture Decisions](docs/architecture/)
- [Requirements & Use Cases](docs/requirements/)
- [Sprint Plans](docs/sprints/)

## Development Setup

> Coming soon — Docker Compose setup guide

## License

MIT © 2026 Yusef
