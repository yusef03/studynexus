# Sprint-Plan – StudyNexus

> **Single Source of Truth** für alle Sprints. Abgeschlossene Sprints sind finalisiert.
> Sprint-Reviews mit vollständigen Details befinden sich als separate Dateien im selben Verzeichnis.
> Zuletzt aktualisiert: 2026-05-08

---

## Gesamt-Übersicht

| Sprint | Thema | Status | Dauer | Review |
|---|---|---|---|---|
| Sprint 0 | Setup & Anforderungen | ✅ Fertig | 1 Woche | — |
| Sprint 1 | Infrastruktur & Authentifizierung | ✅ Fertig | 2 Wochen | [sprint-1-review.md](sprint-1-review.md) |
| Sprint 2 | Studienplan & Notenmanagement | ✅ Fertig | 2 Wochen | [sprint-2-review.md](sprint-2-review.md) |
| Sprint 3A | Auth Hardening & Dashboard Fixes | ✅ Fertig | 2 Wochen | [sprint-3a-review.md](sprint-3a-review.md) |
| Sprint 3B | Mission Control | ✅ Fertig | 2 Wochen | [sprint-3b-review.md](sprint-3b-review.md) |
| Sprint 3.5 | Mobile Ergonomics | ✅ Fertig | 1 Woche | [sprint-3.5-review.md](sprint-3.5-review.md) |
| Sprint 3.6 | UX Polish & Visual Features | ✅ Fertig | 1 Woche | [sprint-3.6-review.md](sprint-3.6-review.md) |
| Sprint 3.7 | Dashboard Rework, i18n & DnD | ✅ Fertig | 3 Wochen | [sprint-3.7-review.md](sprint-3.7-review.md) |
| Sprint 3.7.7 | BIN PO Datenkorrektur | ✅ Fertig | 1 Tag | [sprint-3.7.7-review.md](sprint-3.7.7-review.md) |
| **Sprint 4** | **BIN Studiengang Vollintegration** | **Als Nächstes** | **3 Wochen** | — |
| Sprint 5 | Admin Panel | Geplant | 2 Wochen | — |
| Sprint 6 | PWA, Branding & Launch | Geplant | 2 Wochen | — |
| Sprint 7 | Multi-Program-Architektur | Geplant | 3 Wochen | — |
| Sprint 8 | Community & Kollaboration | Fern geplant | 3 Wochen | — |

---

## Abgeschlossene Sprints

### Sprint 0 – Setup & Anforderungen ✅

**Zeitraum:** vor Sprint 1 (Anfang April 2026)
**Ziel:** Projektstruktur, Anforderungen, Domain-Modell und Technologieentscheidungen definieren.

**Erledigte Tasks:**
- [x] Projekt-Vision und Scope definiert
- [x] Tech Stack ausgewählt (Next.js 14, FastAPI, PostgreSQL, Redis)
- [x] Monorepo-Struktur aufgesetzt
- [x] Architekturentscheidungen dokumentiert (ADR-001 bis ADR-006)
- [x] Domain-Modell erstellt (University → Faculty → Program → Module → StudentModule)
- [x] Use Cases dokumentiert
- [x] Non-Functional Requirements (NFAs) dokumentiert
- [x] GitHub Repository mit Issue-Templates, PR-Templates, Scrum-Board
- [x] `docker-compose.yml` Grundgerüst

---

### Sprint 1 – Infrastruktur & Authentifizierung ✅

**Zeitraum:** 18. April 2026
**Ziel:** Lauffähige Entwicklungsumgebung mit vollständigem Authentifizierungssystem.

**User Stories:**
- Als Entwickler möchte ich Docker Compose mit allen Services starten können
- Als Besucher möchte ich mich registrieren können (Email + Passwort)
- Als Nutzer möchte ich mich einloggen und ausloggen können
- Als Nutzer möchte ich eingeloggt bleiben (JWT via httpOnly Cookie)

**Erledigte Tasks:**
- [x] Docker Compose mit 4 Services (Next.js, FastAPI, PostgreSQL, Redis)
- [x] FastAPI Projektstruktur (Router, Models, Schemas, Core)
- [x] SQLAlchemy User-Model + Alembic Migration 0001
- [x] `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- [x] JWT via httpOnly Cookie, Next.js API Proxy
- [x] Login/Register UI (shadcn/ui), Passwort-Toggle
- [x] Protected Routes (Middleware)
- [x] i18n DE + EN Grundgerüst (next-intl)
- [x] 10/10 Backend Tests, 14/14 Frontend Tests

**Technische Entscheidungen:** ADR-002 (bcrypt direkt), ADR-003 (httpOnly Cookie), ADR-004 (zwei API URLs), ADR-005 (next.config.js)

---

### Sprint 2 – Studienplan & Notenmanagement ✅

**Zeitraum:** ~ 12. April 2026
**Ziel:** Studierende können Hochschule, Studiengang und Module verwalten sowie Noten eintragen.

**User Stories:**
- Als Studierender möchte ich meine Hochschule und meinen Studiengang auswählen
- Als Studierender möchte ich Module anlegen und deren Status setzen
- Als Studierender möchte ich Noten eintragen und meinen GPA sehen
- Als Studierender möchte ich meine ECTS-Punkte automatisch berechnet bekommen

**Erledigte Tasks:**
- [x] 7 neue DB-Modelle: University, Faculty, Program, ExamRegulation, Module, UserProgram, StudentModule
- [x] Alembic Migration 0002: alle 7 Tabellen + HSH-Seed (erste Version der BIN-Daten, 6 Semester)
- [x] Alembic Migration 0003: kuerzel-Fixes, gewichtung-Korrekturen, ECTS-Fixes, 9 WP-Module
- [x] 5 öffentliche Endpunkte (Hochschul-/Studiengangskatalog)
- [x] 8 geschützte Endpunkte (Studienplan + Notenmanagement)
- [x] GPA-Service: `sum(note × ects × gewichtung) / sum(ects × gewichtung)`
- [x] Stats-Endpunkt: GPA, ECTS, Fortschritt, Modulzählungen
- [x] 66 Backend-Tests, alle grün
- [x] API-Docs: `docs/api/study-plan.md` + `docs/api/stats.md`
- [x] Frontend: Setup Wizard, ModuleList, ModuleModal, AddModuleModal, StatsCard

**Hinweis:** Die BIN-Modul-Seed-Daten aus dieser Phase waren strukturell fehlerhaft (falsche Kürzel, erfundene Namen). Wurde vollständig korrigiert in Sprint 3.7.7 / Migration 0011.

---

### Sprint 3A – Auth Hardening & Dashboard Fixes ✅

**Zeitraum:** 19.–26. April 2026
**Ziel:** HsH-Domainvalidierung, E-Mail-Verifikation, TanStack Query Migration, StudyNexus Branding.

**User Stories:**
- Als Studierender möchte ich mich nur mit meiner HsH-Adresse registrieren können
- Als Studierender möchte ich nach der Registrierung meine E-Mail-Adresse bestätigen
- Als Studierender kann ich optional meine Matrikelnummer hinterlegen

**Erledigte Tasks:**
- [x] E-Mail-Domainvalidierung (`@stud.hs-hannover.de`) im Backend (Pydantic-Validator) + Frontend
- [x] E-Mail-Verifikation: 6-stelliger Code via Resend API, läuft 15 Minuten
- [x] Alembic Migration 0004: `is_verified`, `verification_code`, `verification_code_expires` auf users
- [x] TanStack Query (React Query) vollständig integriert — ersetzt manuelles `useEffect`-Fetching
- [x] CSRF-Schutz: Custom Header `x-studynexus-client: true` + Origin/Host-Check (ADR-012)
- [x] StudyNexus-Branding: Vector-Logo, HsH-Partner-Badge
- [x] Matrikelnummer als optionales Profilfeld
- [x] Dashboard-Bugs aus Testsession gefixt

**Technische Entscheidungen:** ADR-007 (HsH-only), ADR-008 (Domainvalidierung), ADR-009 (Admin PO-Verwaltung), ADR-010 (module_prerequisites), ADR-011 (Resend), ADR-012 (CSRF)

---

### Sprint 3B – Mission Control ✅

**Zeitraum:** 26. April 2026
**Ziel:** Vollständiges Stundenplan- und Aufgaben-Management-System.

**User Stories:**
- Als Studierender möchte ich einen Wochenstundenplan sehen und Termine eintragen
- Als Studierender möchte ich meine Aufgaben in einem Kanban-Board verwalten
- Als Studierender möchte ich Abgaben und Klausuren tracken

**Erledigte Tasks:**
- [x] Alembic Migration 0005: `tasks` + `events` Tabellen
- [x] Alembic Migration 0007: `semester_tag`, `event_date`, `lecturer` auf events
- [x] Alembic Migration 0008: `focus` type + `is_submission` auf tasks
- [x] Vollständige Task/Event CRUD API (8 Endpunkte)
- [x] Interaktives Schedule Board (15-Minuten CSS-Grid, Kollisionserkennung HTTP 409)
- [x] Kanban Board (4 Spalten: To Do / In Progress / Exam Ready / Done)
- [x] Smart Timeline + Daily Focus-Widget
- [x] Exam Countdown-Widget (pulsiert rot bei < 14 Tagen)
- [x] Event-Typen: LECTURE, EXERCISE, TUTORIAL, SEMINAR, PRACTICUM, CUSTOM_STUDY, FOCUS, EXAM, WORK, LIFE
- [x] Semester-Binding für Events (Event bleibt in seinem Semester-Tag)
- [x] Ghosting-Modus (Events temporär ausblenden ohne Löschen)

---

### Sprint 3.5 – Mobile Ergonomics ✅

**Zeitraum:** 27. April 2026
**Ziel:** Mobile-First Optimierung für das tägliche Studienmanagement auf dem Smartphone.

**Erledigte Tasks:**
- [x] Mobile Quick Add FAB (globaler Floating Action Button)
- [x] Mobile Agenda View (Listenansicht statt CSS-Grid auf Smartphones)
- [x] Submissions Support (`is_submission` Flag auf Tasks, 📄-Icon)
- [x] Focus Time Event-Typ (`FOCUS` / 🎧) mit Amber-Styling
- [x] iOS Safari Auto-Zoom Fix (`text-base md:text-sm`)
- [x] CSRF Origin Mismatch Fix (dynamische Host-Prüfung)

---

### Sprint 3.6 – UX Polish & Visual Features ✅

**Zeitraum:** 28. April 2026
**Ziel:** Aus dem MVP eine professionelle, responsive Applikation formen.

**Erledigte Tasks:**
- [x] Visual Study Plan Board (Semester-Spalten als Kanban-Buckets mit DnD)
- [x] Alembic Migration 0010: `plan_semester` auf student_modules (getrennt von `semester`)
- [x] Digitaler Studentenausweis (ID Card, Glassmorphism-Design)
- [x] Einstellungsbereich (3 Tabs: Persönlich, Konto & Sicherheit, Erscheinungsbild)
- [x] Dashboard-Begrüßung mit echtem Nutzernamen
- [x] Global Quick Add auch auf Desktop

**Technische Entscheidungen:** ADR-016 (plan_semester getrennt von semester)

---

### Sprint 3.7 – Dashboard Rework, i18n & DnD ✅

**Zeitraum:** 28. April – 07. Mai 2026
**Ziel:** Professionalisierung: echte Daten, funktionierende Settings, vollständige Zweisprachigkeit, native Touch-DnD, intelligente UI.

**Erledigte Tasks (Phase 1–2: Fundament & Settings):**
- [x] Alembic Migration 0006: `matrikelnummer` auf users
- [x] Alembic Migration 0009: `birth_date`, `hochschule` auf users
- [x] Registrierung: matrikelnummer, birth_date, hochschule als Pflichtfelder
- [x] Server-Fetch Fix für Auth-Cookie in Server Components
- [x] ID-Card mit echten Daten (Name, Matrikelnummer, Hochschule, Geburtsdatum)
- [x] Settings: Persönliche Daten (read-only aus DB)
- [x] Settings: Passwort ändern — `PUT /me/password` mit Altes-Passwort-Verifikation
- [x] Settings: Sprachwechsel (DE ↔ EN via next-intl Locale-Routing)
- [x] Token-Lifetime: 30 Min → 7 Tage (ADR-014)
- [x] 401 Auto-Redirect bei abgelaufenen Tokens

**Erledigte Tasks (Phase 3–5: DnD & Intelligenz):**
- [x] Mobile Kanban Rework: `@dnd-kit/core` + `@dnd-kit/sortable` statt HTML5 Polyfill
- [x] KanbanCard + KanbanColumn als `React.memo`-Komponenten + DragOverlay
- [x] Studienplan Builder: `@dnd-kit`, dynamische `+ Neues Semester`-Funktion
- [x] StudyPlanCard + StudyPlanColumn als `React.memo`-Komponenten
- [x] Kontext-sensitiver Quick Add FAB (ausgeblendet auf /settings, /profile, /setup)
- [x] Vollständige i18n: alle Seiten, Modals, Widgets (next-intl, Zero hardcoded strings)
- [x] Locale-aware Datumsformatierung (date-fns + `useLocale()`)
- [x] Bugfixes: Hook-Order, Semester-Bug, EventType-Union, Import-Fehler, Null-Safety

**Technische Entscheidungen:** ADR-013 (i18n next-intl), ADR-014 (Token 7 Tage), ADR-015 (@dnd-kit), ADR-016 (plan_semester)

---

### Sprint 3.7.7 – BIN PO Datenkorrektur ✅

**Zeitraum:** 07. Mai 2026 (1 Tag)
**Ziel:** Vollständige und korrekte Abbildung der BIN PO 2019 in der Datenbank.

**Grundlage:** Vollständige Analyse von Modulhandbuch BIN 19WS (76 S.), PO BIN 2019, ATPO-FIV 2025.
Quell-PDFs: `docs/pos_test/` (ATPO-FIV 2025, PO BIN 2019, Modulhandbuch BIN 19WS).
Detailliertes Review: [sprint-3.7.7-review.md](sprint-3.7.7-review.md)

**Erledigte Tasks:**
- [x] Alembic Migration 0011: Alle 27 PFLICHT-Kürzel auf BIN-100..BIN-210 korrigiert
- [x] Migration 0011: BIN-207 (Computergrafik 2) eingefügt — war komplett fehlend
- [x] Migration 0011: BIN-209 "Ergänzende Fächer" korrekt eingefügt (PFLICHT, 6 ECTS, Sem 4)
- [x] Migration 0011: Alle 9 WAHLPFLICHT-Namen auf PO-korrekte Namen korrigiert
- [x] Migration 0011: `has_prerequisites` korrigiert (false für Sem 1-3, true für Sem 4+)
- [x] Migration 0011: Fake-Platzhaltermodule gelöscht
- [x] Migration 0011: `custom_ist_benotet BOOLEAN NULLABLE` auf student_modules
- [x] Migration 0011: BIN-209 automatisch für alle bestehenden User provisioniert
- [x] Backend: `custom_ist_benotet` in Model, Schema (Add/Update/Response), Router
- [x] Backend: WAHLPFLICHT-Limit = 2 mit HTTP 409 durchgesetzt
- [x] Frontend: `custom_ist_benotet` in types/study.ts + useAddModule
- [x] Frontend: AddModuleModal — Benotet-Checkbox, WAHLPFLICHT-Warning, BIN-209 Hinweis
- [x] Frontend: ModuleModal Bug-Fix (custom Module zeigten immer "unbenotet")
- [x] Frontend: ModuleList berechnet wahlpflichtCount
- [x] i18n: `addModule.isGraded`, `addModule.wahlpflichtFull`, `addModule.ergaenzendHint`

**Technische Entscheidungen:** ADR-017 (custom_ist_benotet)

---

## Aktive & Geplante Sprints

---

### Sprint 4 – BIN Studiengang Vollintegration

**Status:** Als Nächstes
**Zeitraum:** ca. 3 Wochen ab jetzt
**Ziel:** Den BIN-Studiengang "Angewandte Informatik" vollständig, intelligent und lückenlos in StudyNexus integrieren — alle PO-Regeln automatisch abgebildet, kein manuelles Nachschauen in PDFs mehr.

**Hintergrund & Motivation:**
Die Moduldaten sind seit Sprint 3.7.7 korrekt (Migration 0011). Aber das System ist noch "dumm" — es kennt zwar die Module, aber nicht die PO-Regeln. Konkret fehlen:
- Prüfungsarten pro Modul (PX, EA, R, BAA+Ko etc.) laut ATPO-FIV 2025
- Vorprüfungs-Meilensteine im Dashboard (BIN PO §6 Zulassungsregeln)
- Granulare Semester-Progression (welche Semester sind laut PO freigeschaltet?)
- BIN-209 Sub-Modul-Katalog (7 benannte Optionen laut PO, statt freier Texteingabe)
- Technische Schulden: FAB mit hardcoded Semester-Tag, fehlende Proxy-Route

**Analyse (aus PDF-Lektüre, 2026-05-08):**
Lücken gegenüber PO BIN 2019 + ATPO-FIV 2025 + Modulhandbuch:

| Lücke | Auswirkung | Priorität |
|---|---|---|
| `pruefungsart` nicht in DB | Student sieht nicht, ob Klausur oder mdl. Prüfung | P1 |
| Vorprüfungs-Milestone fehlt | BIN §6 Regeln nicht sichtbar | P1 |
| FAB Semester-Tag hardcoded "WiSe2425" | Falsch für alle neuen User | P1 |
| `/api/me/profile` Proxy fehlt | FAB-Fehler beim Laden des Profils | P1 |
| BIN-209 Sub-Modul-Katalog fehlt | Student muss Namen selbst eintippen | P2 |
| `sws` (SWS) nicht in DB | Vollständigkeit fehlt | P2 |
| `module_prerequisites` Tabelle nie gebaut | ADR-010 offen seit Sprint 3A | P2 |
| BIN-209 GPA-Beitrag fehlt | Sub-Module fließen nicht in GPA ein | P2 |
| Noten-Validierung fehlt | Ungültige Noten möglich (z.B. 1.5) | P2 |

**User Stories:**

- Als BIN-Student möchte ich auf dem Dashboard sehen, ob ich die Vorprüfung bestanden habe
- Als BIN-Student möchte ich wissen, ob ich zu Prüfungen des 4./5./6. Semesters zugelassen bin
- Als BIN-Student möchte ich bei jedem Modul sehen, welche Prüfungsart erwartet wird
- Als BIN-Student möchte ich beim Hinzufügen von BIN-209-Fächern die offiziellen Namen sehen
- Als Nutzer möchte ich, dass der Quick-Add-Button das korrekte Semester automatisch wählt

---

#### Phase 1 — Prüfungsart & Modul-Metadaten (Backend + DB)

**Technische Tasks:**
- [ ] Alembic Migration 0012: `pruefungsart VARCHAR(20) NULLABLE` auf `modules`
- [ ] Migration 0012: `sws SMALLINT NULLABLE` auf `modules`
- [ ] Migration 0012: BIN-Seed-Update — alle pruefungsart-Werte aus Anlage B1/B2 der PO BIN 2019:
  - Alle PX-Module (Standard, Klausur oder mündliche Prüfung)
  - BIN-114: EA (Experimentelle Arbeit), Gew=0
  - BIN-204: R (Referat), Gew=0
  - BIN-206: EA (Experimentelle Arbeit), Gew=0
  - BIN-208: EA (Experimentelle Arbeit), Gew=0
  - BIN-210: BAA+Ko (Bachelorarbeit mit Kolloquium), Gew=4
- [ ] Backend: `ModuleResponse` + `StudentModuleResponse` Schemas um `pruefungsart`, `sws` erweitern
- [ ] Backend: `GET /exam-regulations/{id}/modules` liefert `pruefungsart` + `sws`
- [ ] Backend: `GET /me/modules` liefert `pruefungsart` + `sws` pro Modul
- [ ] ADR-018 dokumentieren: pruefungsart auf Module

**Frontend:**
- [ ] `types/study.ts`: `pruefungsart?: string | null`, `sws?: number | null` auf `ModuleResponse`
- [ ] `ModuleModal`: Prüfungsart-Badge anzeigen (z.B. "Klausur/mdl." / "Experimentelle Arbeit")
- [ ] `ModuleList`: Prüfungsart-Icon oder Label pro Modul-Zeile
- [ ] i18n: `modules.pruefungsart.*` Keys in de.json + en.json

---

#### Phase 2 — Vorprüfungs-Milestone & Semester-Progression

**Basis:** BIN PO 2019 §6 — Zulassungsvoraussetzungen:
- Sem 4-Prüfungen: alle Sem-1-Prüfungen bestanden (inkl. BIN-116 Englisch!)
- Sem 5-Prüfungen: alle Sem-1 + Sem-2-Prüfungen bestanden
- BIN-206 (Praxisprojekt 1): Bachelor-Vorprüfung bestanden (Sonderregel!)
- Sem 6-Prüfungen: Bachelor-Vorprüfung bestanden (= alle Sem 1–3)
- Bachelor-Arbeit (BIN-210): Vorprüfung + mind. 134 ECTS bestanden
- BIN-209 (Ergänzende Fächer): KEINE Voraussetzung — jederzeit zugänglich!

**Genaue Modul-Listen BIN (semester_empfehlung-basiert, aus PO §6):**
- **Sem 1** (6 Module): BIN-100, BIN-101, BIN-102, BIN-103, BIN-104, BIN-116
- **Sem 2** (5 Module): BIN-105, BIN-106, BIN-107, BIN-108, BIN-109
- **Sem 3** (6 Module): BIN-110, BIN-111, BIN-112, BIN-113, BIN-114, BIN-115
- **Vorprüfung** = alle 17 Module Sem 1–3 bestanden (BIN-100..BIN-116)

**Backend:**
- [ ] `GET /me/stats` erweitern:
  - `sem1_complete: bool` — alle BIN-100, BIN-101, BIN-102, BIN-103, BIN-104, BIN-116 PASSED
  - `sem2_complete: bool` — alle BIN-105, BIN-106, BIN-107, BIN-108, BIN-109 PASSED
  - `vorpruefung_bestanden: bool` — alle 17 BIN-100..BIN-116 PASSED (Bachelor-Vorprüfung §6)
  - `sem4_zugaenglich: bool` — sem1_complete (BIN-116 muss dabei sein!)
  - `sem5_zugaenglich: bool` — sem1_complete AND sem2_complete
  - `sem6_zugaenglich: bool` — vorpruefung_bestanden
  - `ba_zulassung_eligible: bool` — vorpruefung_bestanden AND ects_bestanden >= 134
  - `ects_fuer_ba: int` — aktuelle bestandene ECTS (für BA-Fortschrittsanzeige)
- [ ] Backend-Logik: program-aware über `exam_regulation.program_id` — nicht hardcoded für BIN
- [ ] Schema: `StatsResponse` um obige Felder erweitern
- [ ] Docs: `docs/api/stats.md` aktualisieren

**Frontend:**
- [ ] `useUserStats` Hook: neue Felder typisieren
- [ ] Dashboard: `MilestoneWidget` (neue Komponente unter `components/dashboard/`)
  - Vorprüfungs-Status: Progressbar + Grün/Rot Badge
  - BA-Zulassung: ECTS-Balken (X/134 CP)
  - Semester-Freischaltung: visuelle Icons (Sem 4/5/6 locked/unlocked)
- [ ] i18n: `dashboard.milestone.*` Keys in de.json + en.json

---

#### Phase 3 — BIN-209 Sub-Modul-Katalog

**Basis:** PO BIN 2019 Anlage B2 — BIN-209 hat 7 offizielle Teilmodule (Student wählt 3):

| TM-Kürzel | Bezeichnung | Typ |
|---|---|---|
| BIN-209-01 | Ergänzendes Fach A | WP |
| BIN-209-02 | Ergänzendes Fach B | WP |
| BIN-209-03 | Ergänzendes Fach C | WP |
| BIN-209-04 | Ergänzendes Fach D | WP |
| BIN-209-05 | Ergänzendes BWL-Fach A | WP |
| BIN-209-06 | Ergänzendes BWL-Fach B | WP |
| BIN-209-07 | Ergänzendes BWL-Fach C | WP |

**Backend:**
- [ ] Neue `ergaenzend_suggestions` Tabelle ODER: hardcoded Liste im Router für BIN
- [ ] Endpoint: `GET /programs/{id}/ergaenzend-suggestions` → gibt die 7 Namen zurück
- [ ] Alternativ: die 7 Sub-Module als ERGAENZEND-Einträge in `modules` Tabelle (eigene Kürzel BIN-209-01..07, program-spezifisch)

**Frontend:**
- [ ] `AddModuleModal` — Custom-ERGAENZEND-Modus: Dropdown mit den 7 offiziellen Namen (+ "Eigener Name" Option)
- [ ] Muss mind. 1 BWL-Fach gewählt sein: UI-Hinweis wenn kein BWL-Fach dabei
- [ ] i18n: `addModule.ergaenzendSuggestions.*`

---

#### Phase 4 — Dynamisches FAB + Proxy-Route Fix

**Backend:** keine Änderungen

**Frontend:**
- [ ] `frontend/src/app/api/me/profile/route.ts` anlegen (GET + PUT, analog zu bestehenden Proxy-Routes)
- [ ] `MobileQuickAdd.tsx`: Semester-Tag dynamisch aus `GET /me/program` → `start_semester` laden statt hardcoded "WiSe2425"
- [ ] Fallback: wenn kein Programm vorhanden, leeres Dropdown

---

#### Phase 5 — module_prerequisites Grundgerüst (ADR-010)

**Basis:** ADR-010 (beschlossen Sprint 3A, nie implementiert)

**Backend:**
- [ ] Alembic Migration 0013: `module_prerequisites` Tabelle
  ```sql
  id UUID PRIMARY KEY
  module_id UUID FK → modules (das abhängige Modul)
  required_module_id UUID FK → modules NULLABLE (spezifisches Modul)
  minimum_ects INTEGER NULLABLE (ECTS-Schwelle, z.B. 134)
  prerequisite_type ENUM('MODULE', 'ECTS_THRESHOLD', 'SEMESTER_COMPLETE')
  description VARCHAR (menschenlesbar, z.B. "Alle Prüfungen Sem 1 bestanden")
  ```
- [ ] Seed: BIN-Voraussetzungsregeln eintragen:
  - BIN-200..BIN-204 → prerequisite_type=SEMESTER_COMPLETE, description="Alle Sem 1 Prüfungen"
  - BIN-205, BIN-207 → "Alle Sem 1+2 Prüfungen"
  - BIN-206 → prerequisite_type=MODULE, "Bachelor-Vorprüfung"
  - BIN-208 → "Alle Sem 1-3 Prüfungen"
  - BIN-210 → ECTS_THRESHOLD=134 + Vorprüfung
  - BIN-209-XX → keine Voraussetzungen
- [ ] `GET /me/modules` gibt `prerequisites_met: bool` pro Modul zurück (neu)
- [ ] Backend-Check in `add_module()`: WP-Module nur hinzufügbar wenn prerequisites_met
- [ ] **BIN-209 GPA-Fix:** Benotete ERGAENZEND-Sub-Module sollen in die BIN-209-Note einfließen.
  Logik: `avg(noten aller benoteten sub-module)` → BIN-209 Modulnote, dann × `gewichtung=1.5` in GPA.
  Aktuell: Custom-ERGAENZEND (`module_id=null`) wird **komplett aus GPA ausgeschlossen** — das ist falsch!
  Umsetzung erfordert Verknüpfung: custom ERGAENZEND → parent BIN-209 StudentModule.

**Frontend:**
- [ ] `ModuleModal`: Lock-Icon + Hinweistext wenn prerequisites nicht erfüllt
- [ ] `AddModuleModal`: WP-Module gesperrt wenn prerequisites nicht erfüllt

---

#### Phase 6 — Notenvalidierung & GPA-Verbesserung

**Hintergrund:** ATPO-FIV 2025 §10 definiert exakt 11 gültige Noten: 1,0 — 1,3 — 1,7 — 2,0 — 2,3 — 2,7 — 3,0 — 3,3 — 3,7 — 4,0 — 5,0

**Backend:**
- [ ] Pydantic-Validator in `UpdateModuleRequest.note`: nur offizielle HsH-Noten zulässig
- [ ] HTTP 422 mit klarer Fehlermeldung bei ungültiger Note

**Frontend:**
- [ ] Noteneingabe: Dropdown mit 11 Optionen statt Freitextfeld
- [ ] Notenoptionen: 1,0 / 1,3 / 1,7 / 2,0 / 2,3 / 2,7 / 3,0 / 3,3 / 3,7 / 4,0 / 5,0
- [ ] i18n: Noten-Labels

---

### Sprint 5 – Admin Panel

**Status:** Geplant (nach Sprint 4)
**Ziel:** Yusef-only Admin-Panel für PO-Verwaltung — ersetzt manuelle Alembic-Migrationen für neue Studiengänge und Module.

**Basis:** ADR-009 (Admin-only PO-Verwaltung)

**User Stories:**
- Als Admin möchte ich Studiengänge, Module und Prüfungsordnungen ohne Code-Änderung verwalten
- Als Admin möchte ich Modul-Voraussetzungen (module_prerequisites) über ein UI eintragen
- Als Admin möchte ich neue HsH-Studiengänge (z.B. MDI) über das Panel hinzufügen

**Technische Tasks:**
- [ ] `is_admin BOOLEAN DEFAULT FALSE` auf `users` (Migration 0014)
- [ ] Admin Auth Guard: FastAPI-Dependency `get_admin_user` (wirft 403 wenn not is_admin)
- [ ] Admin API-Endpunkte (unter `/api/v1/admin/`):
  - CRUD University, Faculty, Program, ExamRegulation
  - CRUD Module (mit pruefungsart, sws, gewichtung, semester_empfehlung)
  - CRUD module_prerequisites
  - User-Übersicht (read-only, kein Passwort-Zugriff)
- [ ] Next.js `/dashboard/admin/` Route (nur wenn is_admin=true)
- [ ] Admin Sidebar-Link (nur sichtbar für Admins)
- [ ] Admin-Tabellen: Studiengänge, Module, Voraussetzungen
- [ ] Admin-Formulare: Modul anlegen/bearbeiten mit allen Feldern
- [ ] Admin-Schutz: Next.js Middleware wirft 403 für Nicht-Admins auf /admin-Routes

---

### Sprint 6 – PWA, Branding & Launch

**Status:** Geplant (nach Sprint 5)
**Ziel:** Produktionsreife App — offline-fähig, deployed, launch-ready.

**Hinweis:** i18n (DE/EN) wurde bereits in Sprint 3.7 vorgezogen ✅. Branding in Sprint 3A ✅.

**User Stories:**
- Als Studierender möchte ich StudyNexus auch ohne Internetverbindung nutzen können
- Als Nutzer möchte ich StudyNexus auf meinem Homescreen installieren können
- Als Entwickler möchte ich eine vollständige CI/CD-Pipeline haben

**Technische Tasks:**
- [ ] Service Worker: Offline-Cache für Dashboard + StaticAssets
- [ ] PWA Manifest: Icons, Farben, `display: standalone`
- [ ] Lighthouse PWA Score ≥ 90 erreichen
- [ ] GitHub Actions CI/CD Pipeline:
  - Backend: pytest auf PRs
  - Frontend: `next build` + TypeScript-Check auf PRs
  - Deployment: automatisch auf main-Push
- [ ] Cloud Deployment (Railway oder Render):
  - PostgreSQL Managed DB
  - Redis Managed
  - Backend + Frontend als separate Services
  - Umgebungsvariablen in Secret Store
- [ ] Produktions-Docker-Compose (ohne dev-Volumes, mit Health Checks)
- [ ] Security Audit (OWASP Top 10):
  - Rate Limiting auf Auth-Endpunkten
  - SQL Injection Check
  - XSS Review
  - CORS Review
- [ ] Token-Lifetime in Produktion: 1–3 Tage + Refresh Token Mechanismus
- [ ] Landing Page (`/`) mit Feature-Showcase, HsH-Fokus, CTA "Jetzt registrieren"

---

### Sprint 7 – Multi-Program-Architektur

**Status:** Geplant (nach Sprint 6)
**Ziel:** Weitere HsH-Studiengänge aus Fakultät IV hinzufügen — MDI zuerst, dann Master-Programme.

**Hintergrund:**
Das DB-Schema ist bereits vollständig multi-program-fähig (`University → Faculty → Program → ExamRegulation → Module`). Neue Studiengänge benötigen **NUR neue Seed-Daten (Alembic-Migration) — keinerlei Code-Änderungen**. Das Admin-Panel aus Sprint 5 wird langfristig für die Datenpflege genutzt.

**Wichtige Architektur-Invariante:** `StudentModule` hat bewusst **keine FK auf `UserProgram`**. Wenn ein User das Programm wechselt (`PUT /me/program`), bleiben seine alten `StudentModules` erhalten (Bestandsschutz für bereits eingetragene Noten). Diese Entscheidung ist dauerhaft.

**Studiengänge laut ATPO-FIV 2025 Fakultät IV:**
- MDI – Medieninformatik und Interaktives Entertainment (Bachelor)
- BWL – Betriebswirtschaftslehre (Bachelor) — in Kooperation mit Fak. IV
- MIN – Informatik (Master)
- MMI – Medieninformatik (Master)

**Technische Tasks:**
- [ ] PO-Analyse MDI (PDF lesen → Analyse-Dokument → Migration)
- [ ] Migration: MDI-Programme und Module als Seed-Daten
- [ ] Backend: Zulassungslogik für MDI (analog BIN §6-Regeln)
- [ ] Stats-Endpunkt: program-aware Vorprüfungs-Berechnung (nicht hardcoded für BIN)
- [ ] Frontend: Setup Wizard — MDI-Option wählbar
- [ ] PO-Analyse BWL (optional)
- [ ] Migrations für Weiteres (optional, über Admin-Panel)

---

### Sprint 8 – Community & Kollaboration

**Status:** Fern geplant (nach Sprint 7)
**Ziel:** Soziale Features für kollaboratives Lernen an der HsH.

**User Stories:**
- Als Studierender möchte ich ein Modul anonym evaluieren
- Als Studierender möchte ich Lernmaterialien hochladen und teilen
- Als Studierender möchte ich eine Lerngruppe gründen
- Als Studierender möchte ich in meiner Lerngruppe ein geteiltes Kanban nutzen

**Technische Tasks:**
- [ ] Modul-Wiki: Modulbeschreibungen, Prüfungsarten, anonyme Bewertungen (DSGVO-konform)
- [ ] Study Spaces: Digitale Lerngruppen mit geteiltem Kanban
- [ ] Anonyme Modulevaluationen (pseudonymisiert, kein Rückschluss auf Person)
- [ ] PDF-Upload mit Verschlüsselung + Viren-Scan
- [ ] Berechtigungskonzept: privat / nur Lerngruppe / HsH-öffentlich

---

## Ideen-Backlog (noch nicht priorisiert)

| Idee | Beschreibung | Möglicher Sprint |
|---|---|---|
| GPA-Prognose-Rechner | "Was-wäre-wenn": Welchen End-GPA erreiche ich, wenn ich alle offenen Module mit Note X bestehe? | Sprint 4+ |
| Stundenplan-Import | ICS/Excel-Import für HsH-Stundenplan statt manueller Eingabe | Sprint 5+ |
| Semester-Planung Export | StudyPlanBoard als PDF oder ICS exportieren | Sprint 6+ |
| Push-Notifications | 7-Tage-Vorwarnung vor Klausuren via Service Worker | Sprint 6 |
| KI-Planung | Karteikarten-Generator aus Modulbeschreibungen (LangChain + Claude/OpenAI) | Sprint 8+ |
| Skill-Tree Visualisierung | Interaktiver Modul-Abhängigkeitsgraph (Voraussetzungen visualisiert) | Sprint 8+ |
| Notenverbesserungs-Tracking | §11 Abs. 4 ATPO: bestandene Prüfungen können einmal zur Notenverbesserung wiederholt werden | Sprint 5+ |
| Auto-Suggest Ergänzende Fächer | KI-basierter Vorschlag passender BIN-209-Sub-Module basierend auf WAHLPFLICHT-Auswahl | Sprint 8+ |
| Weitere Hochschulen | Erweiterung über HsH hinaus (erst nach stabilem Admin-Panel) | Sprint 9+ |
