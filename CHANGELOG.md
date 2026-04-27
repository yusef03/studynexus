# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- **Community & Collaboration (Sprint 4)**: Pending implementation of Study Spaces, Module Wikis, and PDF sharing.

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
