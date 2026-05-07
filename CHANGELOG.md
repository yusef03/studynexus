# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Planned
- **Sprint 4**: Community & Collaboration (Study Spaces, Module Wikis, PDF sharing)

## [v0.3.8] - 2026-05-07 (Sprint 3.7 - Phases 3, 4 & 5)
### Changed
- **Phase 3 – Mobile Kanban Rework**: Replaced `mobile-drag-drop` HTML5 polyfill with `@dnd-kit/core` + `@dnd-kit/sortable`
- Kanban board now fully supports touch devices via `PointerSensor` with 8px activation distance
- Extracted `KanbanCard` and `KanbanColumn` into standalone `React.memo` components
- `DragOverlay` shows a floating preview card while dragging
- Fixed React hook-order violation (`useCallback` before conditional returns)
- **Phase 4 – Studienplan Builder**: Rewrote `StudyPlanBoard` with `@dnd-kit` for native touch DnD
- Dynamic semesters: `+ Neues Semester` button allows creating Semester 7, 8, etc.
- Extracted `StudyPlanCard` and `StudyPlanColumn` sub-components
- Optimistic query updates via TanStack Query mutation
- **Phase 5 – Smart FAB**: `MobileQuickAdd` now hides on `/settings`, `/profile`, `/setup` via `usePathname()`
### Fixed
- Missing `FOCUS` in `EventType` union (crashed MobileAgendaView)
- `StudentModule` → `StudentModuleResponse` import error in StudyPlanBoard
- `UserStats` → `StatsResponse` import error in useUserStats
- Null-safety crash in EventModal when module name was null
- `semester` number/string type mismatch in StudyPlanBoard

## [v0.3.7] - 2026-04-29 (Sprint 3.7 - Settings, Auth & i18n)
### Added
- **Registration Overhaul**: `matrikelnummer`, `birth_date`, and `hochschule` are now collected during registration.
- **Password Change API**: Secure `PUT /me/password` endpoint requiring old password verification.
- **Settings - Real Data**: Personal data fields (Name, Matrikelnummer, Hochschule, Geburtsdatum) populated from database, set to read-only.
- **Settings - Security**: Actual email displayed, functional password change form with old/new password flow.
- **Full i18n Coverage**: Every single UI string across all pages, modals, and widgets is now translated via `next-intl`. Zero hardcoded strings remain.
- **Locale-aware Dates**: `date-fns` and `toLocaleDateString` now dynamically switch between `de-DE` and `en-US` based on the active locale.
- **401 Auto-Redirect**: Expired tokens now redirect to login automatically instead of showing cryptic errors.

### Changed
- **Token Lifetime**: JWT access tokens extended from 30 minutes to 7 days (development). Cookie `maxAge` updated accordingly.

### Fixed
- **Semester Column Bug**: Removed free-text semester input from ModuleModal that caused modules to be displaced into arbitrary new columns. Semester assignment now exclusively via Drag & Drop in the Study Plan.
- **"Not authenticated" on Save**: Token expiry caused silent 401 errors when saving grades. Fixed by extending token lifetime and adding explicit 401 handling.

## [v0.3.6] - 2026-04-28 (Sprint 3.6 - UX Polish & Visual Features)
### Added
- **Visual Study Plan Board**: Horizontal Kanban-style board with semester columns. Modules can be dragged between semesters with ECTS auto-calculation per column.
- **Digital ID Card**: Premium glassmorphism-styled student ID card at `/dashboard/profile` showing name, matrikelnummer, university, and UUID-based barcode.
- **Settings Page**: Three-tab layout (Personal Data, Account & Security, Appearance) at `/dashboard/settings`.
- **Mobile Drag & Drop**: Tasks and modules can now be moved via touch on iOS/Android using `mobile-drag-drop` polyfill.
- **Dashboard Greeting**: Personalized "Welcome, [Name] 👋" using real user data from the database.
- **Global Quick Add (Desktop)**: The floating `+` button now appears on desktop as well, not just mobile.

## [v0.3.5] - 2026-04-27 (Sprint 3.5 - Mobile Ergonomics)
### Added
- **Mobile Quick Add**: Global Floating Action Button (FAB) for mobile devices, allowing seamless creation of Tasks, Submissions, and Events from anywhere.
- **Mobile Agenda View**: Replaced the desktop CSS-Grid schedule with an optimized, chronological vertical agenda for mobile devices.
- **Exam Countdown Widget**: A dynamic dashboard widget that tracks upcoming exams, pulsating red when `< 14 days`.
- **Submissions Support**: Tasks can now be explicitly marked as `is_submission` (📄).
- **Focus Time**: New event type `FOCUS` (🎧) integrated into the calendar with a distinct amber styling.

### Fixed
- **iOS Safari Auto-Zoom**: Resolved accessibility issue where iOS Safari auto-zoomed on input fields by enforcing `text-base md:text-sm`.
- **CSRF Origin Mismatch**: Fixed an issue where the Next.js API blocked mobile logins on local networks by dynamically checking the `Host` header against the `Origin`.
- **Task Types**: Corrected a missing `task.ts` typing file that caused build failures.

## [v0.3.0] - 2026-04-26 (Sprint 3B - Mission Control)
### Added
- **Interactive Schedule Board**: 15-minute grid engine built entirely in CSS to map university schedules, side jobs (`WORK`), and private life (`LIFE`).
- **Kanban Board**: Drag and drop task management with columns for To Do, In Progress, Exam Ready, and Done.
- **Smart Timeline**: Chronological timeline that intelligently sorts Kanban tasks and prioritizes `EXAM_READY` items.
- **Daily Focus Radar**: Widget that filters today's remaining events and automatically jumps to "Tomorrow" after 8 PM.
- **Soft Collision Detection**: Returns HTTP 409 when events overlap, warning the user but allowing them to save anyway.
- **Semester Binding**: Events are permanently bound to a `semester_tag` to prevent historic schedules from collapsing.

## [v0.2.0] - 2026-04-12 (Sprint 2 - Study Plan & Grades)
### Added
- PostgreSQL schema expansion: `University`, `Faculty`, `Program`, `Module`.
- GPA & ECTS calculation engine.
- Seeding for HsH (Hochschule Hannover) modules.

## [v0.1.0] - 2026-04-05 (Sprint 1 - Infrastructure)
### Added
- Docker Compose development environment.
- FastAPI Backend & Next.js Frontend boilerplate.
- JWT Authentication & Resend Email Verification.
