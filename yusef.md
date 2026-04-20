Read ANTIGRAVITY.md carefully. Then make the following changes across 
documentation, architecture, and code. Work slowly and carefully.
Do NOT start new features - only fix, update, and plan.

## 1. Fix .dockerignore (CRITICAL)
Create/update backend/.dockerignore and frontend/.dockerignore:

backend/.dockerignore:
.pytest_cache
__pycache__
.venv
*.pyc
.env
.env.*

frontend/.dockerignore:
node_modules
.next
.env
.env.*
*.log

This removes the need for "sudo rm -rf backend/.pytest_cache" before builds.
Update ANTIGRAVITY.md Rule #13 to reflect this - the workaround is no longer needed.

## 2. Fix README.md
Remove all mentions of Auth.js. 
We use custom JWT with python-jose, bcrypt 4.1.3, and Next.js API 
proxy with httpOnly cookies. Update the Auth section in README to 
reflect reality.

## 3. Update NFA (Non-Functional Requirements)
Update docs/requirements/nfas.md:
- NFA-04 (PWA/Offline): Change to "Read-Only offline in V1. 
  Offline writes (grades, kanban) require conflict resolution 
  and are deferred to V2."
- Add NFA-XX: CSRF protection - "Next.js proxy provides partial 
  protection. Full CSRF tokens to be implemented in Sprint 3B."

## 4. Update Sprint Plan - Realistic restructuring
Update docs/sprints/sprint-plan.md:

Sprint 3 splits into 3A and 3B:

Sprint 3A (2 weeks) - Auth hardening + Dashboard fixes:
- Email domain validation (@stud.hs-hannover.de) on register
- Email verification (6-digit code via Resend)
- Matrikelnummer: OPTIONAL field on user profile (not required)
- Fix all dashboard bugs from testing session
- Introduce TanStack Query (React Query) for data fetching
- CSRF protection research + basic implementation

Sprint 3B (2 weeks) - Mission Control:
- Stundenplan (weekly schedule view)
- Deadlines/Termine model + API + UI
- Kanban Board (To Do / In Progress / Exam Ready / Done)
- Smart Timeline component

Sprint 4 - Community (was Sprint 4, unchanged)
Sprint 5 - Gamification + Admin Panel (unchanged)
Sprint 6 - PWA + Branding + Launch (unchanged)

Remove from Sprint 3: Kanban, Timeline, Stundenplan 
(moved to Sprint 3B)

## 5. Plan module_prerequisites table (documentation only, no migration yet)
Add to docs/architecture/decisions.md:

ADR-010: Module Prerequisites via Database Table (not hardcoded)
- Never hardcode semester prerequisite logic (if semester == 4...)
- Create module_prerequisites table in Sprint 3A migration:
  - id (UUID)
  - module_id (FK → modules) - the module you want to take
  - required_module_id (FK → modules, nullable) - specific module required
  - minimum_ects_required (Integer, nullable) - ECTS threshold required
  - description (String) - human readable rule
- This supports all PO rules: specific module deps AND ECTS thresholds
- Replaces has_prerequisites boolean (which is too simple)

## 6. Plan TanStack Query architecture (documentation only)
Add to ANTIGRAVITY.md:

TanStack Query Architecture:
- Install: @tanstack/react-query
- Create folder: frontend/src/hooks/queries/
- Files: useUserStats.ts, useStudyPlan.ts, useModules.ts
- Components only call hooks: const { data, isLoading } = useUserStats()
- No data fetching logic inside components
- Implement in Sprint 3A

## 7. Plan Email provider
Add to ANTIGRAVITY.md and docs/architecture/decisions.md:

ADR-011: Email Provider = Resend
- Provider: Resend (resend.com)
- Python SDK: resend (pip install resend)
- Free tier: 3000 emails/month
- Use case: Email verification codes (6-digit, expires in 15 min)
- Implement in Sprint 3A

## 8. Update Matrikelnummer decision
Update ANTIGRAVITY.md Strategic Decisions table:
- Matrikelnummer: OPTIONAL (not required) - student can add it 
  in profile settings. Reduces DSGVO liability while still 
  allowing students to see it in their profile.

## After all documentation updates:
- Commit: docs(architecture): restructure sprint plan, add ADRs 010-011, fix dockerignore and README
- Update ANTIGRAVITY.md last_updated date
- Do NOT run any migrations or change any application code