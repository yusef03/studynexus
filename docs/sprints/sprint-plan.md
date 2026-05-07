# Sprint-Plan – StudyNexus

## Übersicht

| Sprint    | Thema                                      | Status        | Dauer    |
| --------- | ------------------------------------------ | ------------- | -------- |
| Sprint 0  | Setup und Anforderungen                    | ✅ Fertig     | 1 Woche  |
| Sprint 1  | Infrastruktur und Auth                     | ✅ Fertig     | 2 Wochen |
| Sprint 2  | Studienplan und Noten                      | ✅ Fertig     | 2 Wochen |
| Sprint 3A | Auth hardening + Dashboard fixes           | ✅ Fertig     | 2 Wochen |
| Sprint 3B | Mission Control                            | ✅ Fertig     | 2 Wochen |
| Sprint 3.5| Mobile Ergonomics                          | ✅ Fertig     | 1 Woche  |
| Sprint 3.6| UX Polish & Visual Features                | ✅ Fertig     | 1 Woche  |
| Sprint 3.7| Dashboard Rework, Auth & i18n              | ✅ Fertig     | 3 Wochen |
| Sprint 3.7.7 | BIN PO Data Fix + custom_ist_benotet   | ✅ Fertig     | 1 Tag    |
| Sprint 4  | Community und Kollaboration                | Geplant       | 2 Wochen |
| Sprint 5  | Gamification, KI und Admin-Panel           | Geplant       | 2 Wochen |
| Sprint 6  | PWA, Branding und Launch                   | Geplant       | 2 Wochen |

---

## Sprint 1 – Infrastruktur und Authentifizierung ✅

**Ziel:** Lauffähige Entwicklungsumgebung mit funktionierender User-Auth

**User Stories:**

- Als Entwickler möchte ich Docker Compose mit allen Services starten können
- Als Besucher möchte ich mich registrieren können (Email + Passwort)
- Als Nutzer möchte ich mich einloggen und ausloggen können
- Als Nutzer möchte ich eingeloggt bleiben (JWT Refresh Token)

**Erledigte Tasks:**

- [x] docker-compose.yml (Next.js, FastAPI, PostgreSQL, Redis)
- [x] FastAPI Projektstruktur (Router, Models, Schemas)
- [x] SQLAlchemy User-Model + Alembic Migration 0001
- [x] POST /auth/register Endpoint
- [x] POST /auth/login Endpoint (JWT, httpOnly Cookie)
- [x] POST /auth/logout Endpoint
- [x] Login/Register UI Seiten (Next.js, shadcn/ui)
- [x] Protected Routes im Frontend
- [x] Passwort-Sichtbarkeits-Toggle (Login + Register)

---

## Sprint 2 – Studienplan und Notenmanagement ✅

**Ziel:** Nutzer kann seinen Studienplan verwalten und Noten eintragen

**User Stories:**

- Als Studierender möchte ich meine Hochschule und meinen Studiengang auswählen
- Als Studierender möchte ich Module anlegen und deren Status setzen
- Als Studierender möchte ich Noten eintragen und meinen GPA sehen
- Als Studierender möchte ich meine ECTS-Punkte automatisch berechnet bekommen

**Erledigte Tasks:**

- [x] 7 neue DB-Modelle: University, Faculty, Program, ExamRegulation, Module, UserProgram, StudentModule
- [x] Alembic Migration 0002: alle 7 Tabellen + HSH-Seed (32 Module, 6 Semester, 180 ECTS)
- [x] Alembic Migration 0003: kuerzel (BIN-101…BIN-603), gewichtung-Korrekturen, ECTS-Fixes, 9 Wahlpflichtmodule, has_prerequisites
- [x] 5 öffentliche Endpunkte (Hochschul-/Studiengangskatalog)
- [x] 8 geschützte Endpunkte (Studienplan + Notenmanagement)
- [x] GPA-Service: sum(note×ects×gewichtung) / sum(ects×gewichtung)
- [x] Stats-Endpunkt (GPA, ECTS, Fortschritt, Modulzählungen)
- [x] 66 Backend-Tests, alle grün
- [x] Docs: docs/api/study-plan.md + docs/api/stats.md

**Frontend (in Sprint 3A erledigt):**

- [x] Frontend: Hochschul-/Studiengangsauswahl UI (Setup Wizard)
- [x] Frontend: Modulliste gruppiert nach Semester
- [x] Frontend: Noteneingabe-Formular mit Validierung
- [x] Frontend: Stats-Dashboard mit GPA und Fortschrittsbalken

---

## Sprint 3A – Auth hardening + Dashboard fixes ✅

**Ziel:** Auth hardening + Dashboard fixes

**User Stories:**

- Als Studierender möchte ich nach der Registrierung meine E-Mail-Adresse bestätigen
- Als Studierender möchte ich mich nur mit meiner HsH-Adresse registrieren können
- Als Studierender kann ich optional meine Matrikelnummer hinterlegen

**Technische Tasks:**

- [x] E-Mail-Domainvalidierung (@stud.hs-hannover.de) on register
- [x] E-Mail-Verifikation (6-digit code via Resend)
- [x] Matrikelnummer: OPTIONAL field on user profile (not required)
- [x] Fix all dashboard bugs from testing session
- [x] Introduce TanStack Query (React Query) for data fetching
- [x] CSRF protection research + basic implementation
- [x] Neues Branding: StudyNexus-Vector-Logo und HsH-Partner-Badge integriert

---

## Sprint 3B – Mission Control

**Ziel:** Mission Control Features (Stundenplan, Kanban, Timeline, Mobile-First)

**User Stories:**

- Als Studierender möchte ich einen Wochenstundenplan sehen
- Als Studierender möchte ich Termine eintragen, verschieben und löschen
- Als Studierender möchte ich meine Aufgaben in einem Kanban-Board verwalten

**Technische Tasks:**

- [x] Stundenplan (weekly schedule view + Kollisions-Detection)
- [x] Deadlines/Termine model + API + UI
- [x] Kanban Board (To Do / In Progress / Exam Ready / Done)
- [x] Smart Timeline component + Daily Focus
- [x] Abgaben-Support (is_submission) und Fokuszeiten (FOCUS)
- [x] Exam Countdown Widget für anstehende Klausuren
- [x] Mobile-First Ergonomie (Mobile Nav, Quick Add FAB, Mobile Agenda View)

---

## Sprint 3.5 – Mobile Ergonomics ✅

**Ziel:** Mobile-First Optimierung für das tägliche Studienmanagement auf dem Smartphone.

**Erledigte Tasks:**

- [x] Mobile Quick Add FAB (global Floating Action Button)
- [x] Mobile Agenda View (Listenansicht statt CSS-Grid auf Smartphones)
- [x] Exam Countdown Widget (Dashboard)
- [x] Submissions Support (`is_submission` Flag auf Tasks)
- [x] Focus Time Event-Typ (`FOCUS` / 🎧)
- [x] iOS Safari Auto-Zoom Fix
- [x] CSRF Origin Mismatch Fix

---

## Sprint 3.6 – UX Polish & Visual Features ✅

**Ziel:** Aus dem MVP eine professionelle, responsive Applikation formen.

**Erledigte Tasks:**

- [x] Mobile Drag & Drop (mobile-drag-drop Polyfill → in 3.7 durch @dnd-kit ersetzt)
- [x] Visual Study Plan Board (Semester-Spalten mit DnD)
- [x] Digitaler Studentenausweis (ID Card, Glassmorphism)
- [x] Einstellungsbereich (3 Tabs: Persönlich, Konto, Erscheinungsbild)
- [x] Dashboard-Begrüßung mit echtem Nutzernamen
- [x] Global Quick Add auch auf Desktop

---

## Sprint 3.7 – Dashboard Rework, Auth & i18n ✅

**Ziel:** Professionalisierung: echte Daten, funktionierende Settings, vollständige Zweisprachigkeit, native Touch-DnD, intelligente UI.

**Erledigte Tasks (Phase 1+2):**

- [x] Registrierung: matrikelnummer, birth_date, hochschule als Pflichtfelder
- [x] Server-Fetch Fix: Auth-Cookie korrekt an Server Components
- [x] ID-Card mit echten Daten
- [x] Settings: Persönliche Daten (read-only aus DB)
- [x] Settings: Passwort ändern (`PUT /me/password`)
- [x] Settings: Sprachwechsel (DE ↔ EN)
- [x] Vollständige i18n-Integration (alle Seiten, Modals, Widgets)
- [x] Token-Lifetime 30min → 7 Tage
- [x] Semester-Bug Fix (ModuleModal)
- [x] Locale-aware Datumsformatierung

**Erledigte Tasks (Phase 3–5):**

- [x] Mobile Kanban Rework (@dnd-kit/core + @dnd-kit/sortable)
- [x] Studienplan Builder (dynamische Semester-Container mit + Neues Semester)
- [x] Kontext-sensitiver Quick Add Button (ausgeblendet auf /settings, /profile, /setup)

---

## Sprint 3.7.7 – BIN PO Data Fix ✅

**Ziel:** BIN PO 2019 korrekt und vollständig in der Datenbank abbilden.

**Grundlage:** Vollständiges Lesen von Modulhandbuch BIN 19WS (76 Seiten), PO BIN 2019, ATPO-FIV 2025. Analyse-Dokument: `docs/sprints/po-architecture-analysis.md`. Status-Dokument: `docs/sprints/studiengang-implementation-status.md`.

**Erledigte Tasks:**

- [x] Migration 0011: alle 27 PFLICHT-Kürzel auf BIN-100..BIN-210 korrigiert
- [x] Migration 0011: BIN-207 und BIN-209 ("Ergänzende Fächer") korrekt eingefügt
- [x] Migration 0011: Alle 9 WAHLPFLICHT-Namen auf PO-korrekte Namen korrigiert + semester_empfehlung=5
- [x] Migration 0011: has_prerequisites: FALSE für 1. Abschnitt (BIN-100..116), TRUE für 2. Abschnitt
- [x] Migration 0011: Fake-Platzhaltermodule gelöscht
- [x] Migration 0011: `custom_ist_benotet` Column auf student_modules
- [x] Backend: `custom_ist_benotet` in Model, Schema, Router (add/update/build)
- [x] Frontend: `custom_ist_benotet` in types/study.ts
- [x] Frontend: "Benotet?"-Checkbox in AddModuleModal (custom ERGAENZEND-Modus)
- [x] i18n: `addModule.isGraded` in de.json + en.json

**Alle Tasks erledigt. Offene Punkte → nächste Session:**

- [x] Fix: custom_ist_benotet in ModuleModal korrekt auslesen (sm.module !== null check)
- [x] Fix: WAHLPFLICHT-Limit max. 2 (Backend 409 + Frontend amber Warning + canSave=false)
- [x] Fix: BIN-209 ergaenzendHint in AddModuleModal custom-Modus
- [ ] Fix: /api/me/profile Route im Next.js Proxy anlegen (P2, nächste Session)
- [ ] Feature: Vorprüfungs-Milestone im Dashboard (P1, nächste Session)

---

## Sprint 4 – Community und Kollaboration

**Ziel:** Soziale Features – Wiki, Evaluationen, Study Spaces

**User Stories:**

- Als Studierender möchte ich ein Modul anonym evaluieren
- Als Studierender möchte ich Lernmaterialien hochladen und teilen
- Als Studierender möchte ich eine Lerngruppe gründen
- Als Studierender möchte ich in meiner Lerngruppe ein geteiltes Kanban nutzen

**Technische Tasks:**

- [ ] Modul-Wiki Modell und API
- [ ] Anonyme Evaluation Endpoint (DSGVO-konform)
- [ ] PDF-Upload mit Verschlüsselung
- [ ] Study Space Modell und API
- [ ] Geteiltes Kanban-Board pro Study Space
- [ ] Berechtigungskonzept (privat / hochschulöffentlich)

---

## Sprint 5 – Gamification, KI und Admin-Panel

**Ziel:** XP-System, Badges, KI-Planung und Admin-Verwaltung für POs

**Technische Tasks:**

- [ ] XP- und Badge-System (Backend)
- [ ] Streak-Tracking
- [ ] Skill-Tree Visualisierung (interaktiver Modul-Graph)
- [ ] LangChain Integration (OpenAI / Claude API)
- [ ] PDF-Analyse Endpoint + Karteikarten-Generator
- [ ] Admin-Panel (Yusef-only)
- [ ] is_admin Flag + Admin-Auth-Guard

---

## Sprint 6 – PWA, Branding und Launch

**Ziel:** Produktionsreife App – offline-fähig, deployed, launch-ready.

> **Hinweis:** i18n (next-intl DE/EN) und Branding wurden in Sprint 3.7 bzw. 3A vorgezogen und sind bereits erledigt.

**Technische Tasks:**

- [ ] Service Worker und Offline-Cache
- [x] ~~next-intl Integration (DE / EN)~~ → vorgezogen in Sprint 3.7 ✅
- [ ] Lighthouse PWA Score >= 90 erreichen
- [ ] GitHub Actions CI/CD Pipeline
- [ ] Security Audit (OWASP Top 10)
- [ ] Cloud Deployment (Railway oder Render)
- [ ] Produktions-Docker-Compose
- [x] ~~Branding: StudyNexus-Logo + HsH-Farbschema~~ → vorgezogen in Sprint 3A ✅
- [ ] Launch-Landing-Page
