# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Sprint 5 Phase 10 — Audit-Log + System + Import Frontend (2026-05-10)
#### Added
- **`backend/app/schemas/admin/audit_log.py`**: `AuditLogItem` (id/admin_id/admin_name/action/entity_type/entity_id/entity_label/old_value/new_value/reason/ip_address/created_at), `AuditLogListResponse` (paginated)
- **`backend/app/routers/admin/audit_log.py`**: `GET /admin/audit-log` (paginiert, filter: entity_type/action/date_from/date_to/admin_id), `GET /admin/audit-log/{id}` — admin_name via User-Join in Python, beschleunigt durch Set-Lookup
- **`backend/app/routers/admin/__init__.py`**: audit_log Router registriert
- **`types/admin.ts`**: `AuditAction` Union, `AdminAuditLog`, `AdminAuditLogListResponse`, `AdminServiceStatus`, `AdminSystemInfo`, `AdminSystemHealth`
- **`hooks/admin/useAdminAuditLog.ts`**: `useAdminAuditLogs(params)` (page/entity_type/action/date_from/date_to, staleTime 10s, placeholderData) + `useAdminAuditLogEntry(id)`
- **`hooks/admin/useAdminSystem.ts`**: `useAdminSystemInfo()` + `useAdminSystemHealth()` (refetchInterval 60s — Auto-Refresh)
- **`app/[locale]/admin/audit-log/page.tsx`**: Timeline-View — `ActionBadge` mit 8 Farb-Varianten (CREATE=grün/UPDATE=blau/DELETE=rot/ARCHIVE=amber/RESTORE=emerald/RESET=lila/LOGIN=grau/IMPORT=cyan), vertikale Timeline-Linie, `DiffBlock` (old→new diff inline, Strikethrough+Grün), Filter-Bar (Dropdown: entity_type+action, Datumseingabe: date_from+date_to), Pagination, vollständig i18n
- **`app/[locale]/admin/system/page.tsx`**: `OverallBadge` (ok/degraded/down), `ServiceBadge` (ok/error), Health-Section (DB+Redis), DB-Info-Section (Version gekürzt, Größe MB, Nutzer, Module, Audit-Einträge), Stack-Section (statische Infos), Last-Checked Timestamp, Auto-Refresh 60s
- **`app/[locale]/admin/import/page.tsx`**: Exam-Reg-ID Eingabe, JSON-Textarea → Client-Validation → Vorschau (Module-Liste, max. 10 Einträge), POST `/modules/import/json` → Ergebnis (created/skipped/errors), Admin-Session-Guard, PDF-Placeholder Section (disabled Button)
- **i18n (DE+EN)**: `admin.auditLog` (~20 Keys inkl. alle 8 Action-Labels), `admin.system` (~25 Keys), `admin.import` (~25 Keys)

### Sprint 5 Phase 9 — PO-Verwaltung Frontend + Phase 11 Admin-Link (2026-05-10)
#### Added
- **`types/admin.ts`**: 8 neue Interfaces — `AdminFaculty`, `AdminUniversity`, `AdminUniversityDetail`, `AdminProgram`, `AdminProgramDetail`, `AdminExamReg`, `AdminExamRegDetail`, `AdminModule`, `AdminModuleDetail`, `AdminPrerequisite`
- **`hooks/admin/useAdminUniversities.ts`**: `useAdminUniversities()` (Liste) + `useAdminUniversity(id)` (Detail mit Fakultäten)
- **`hooks/admin/useAdminPrograms.ts`**: `useAdminPrograms(params?)` (Liste, filter: faculty_id, include_archived) + `useAdminProgram(id)` (Detail mit ExamRegs + student_count)
- **`hooks/admin/useAdminModules.ts`**: `useAdminModules(params?)` (Liste, filter: exam_regulation_id, include_archived) + `useAdminModule(id)` + `useAdminExamReg(id)` → `AdminExamRegDetail`
- **`app/[locale]/admin/universities/page.tsx`**: Liste aller Hochschulen, inline Create-Modal (Name/Kürzel/Stadt/Bundesland/Typ), Live-Suche, Row-Click → Detail
- **`app/[locale]/admin/universities/[id]/page.tsx`**: Detail-Seite — Hochschul-Info, Fakultäten-Tabelle (anlegen/löschen), Edit-Modal, Delete (nur wenn keine Fakultäten), Admin-Session-Guard
- **`app/[locale]/admin/programs/page.tsx`**: Liste mit Filter-Tabs (Alle/Aktiv/Archiviert), Live-Suche, StatusBadge, Create-Modal
- **`app/[locale]/admin/programs/[id]/page.tsx`**: Detail — Studiengang-Info, PO-Tabelle mit `ist_aktuell`-Indikator + Link, ExamReg anlegen Modal, Edit-Modal, Archive/Restore via ArchiveDialog
- **`app/[locale]/admin/exam-regulations/[id]/page.tsx`**: PO-Hub — Info-Section, Modulkatalog (7 Spalten, Filter-Tabs + Suche via useMemo), Modul anlegen inline, JSON-Bulk-Import (Array.isArray-Validation → POST `/modules/import/json` → Result-Anzeige), PO bearbeiten + archivieren
- **`app/[locale]/admin/modules/page.tsx`**: Globale Modul-Übersicht, Filter-Tabs + Live-Suche, ModulTypBadge (PFLICHT/WAHLPFLICHT/ERGAENZEND), StatusBadge, Row-Click → Detail
- **`app/[locale]/admin/modules/[id]/page.tsx`**: Modul-Detail — 11 InfoRows, Edit-Modal (pre-filled), Voraussetzungs-Tabelle (PrereqTypeBadge), Voraussetzung anlegen (TYPE-conditional fields: MODULE/ECTS_THRESHOLD/SEMESTER_COMPLETE), Voraussetzung löschen (DELETE + Admin-Token), Archivieren/Wiederherstellen
- **i18n (DE+EN)**: `admin.common` (yes/no/edit/restore/archive/delete/noSession/saved/saveError), `admin.universities`, `admin.programs`, `admin.examRegs`, `admin.modules`, `admin.prerequisites` (je ~20–40 Keys)
- **Phase 11**: `AppSidebar.tsx` + `MobileNav.tsx` — Admin-Link sichtbar nur wenn `is_admin: true` im JWT (bereits in Phase 7-8 Commit enthalten)

### Sprint 5 Phase 8 — User Management Frontend (2026-05-10)
#### Added
- **`types/admin.ts`**: TypeScript-Interfaces: `AdminUserListItem`, `AdminUserListResponse`, `AdminUserDetail` (extends List + university/birth_date/admin_notes/gpa), `AdminUserPatch`
- **`lib/adminFetch.ts`**: `adminGet<T>(path)` + `adminMutate<T>(path, method, {body?, adminToken?})` — setzt `Content-Type` und `x-admin-token` Header, 204-safe (gibt `undefined` zurück)
- **`hooks/admin/useAdminUsers.ts`**: TanStack Query Hook, paginated (page/page_size), filter-fähig (is_active/is_premium/is_verified), search, staleTime 30s, placeholderData für smooth pagination
- **`hooks/admin/useAdminUser.ts`**: TanStack Query Hook für Single-User-Detail, enabled-Guard wenn ID leer
- **`app/[locale]/admin/users/page.tsx`**: Nutzerliste — AdminDataTable mit 7 Spalten (User, Matrikel, Status-Badges, Programm, Fortschritt, Letzter Login, Registriert), 5 Filter-Tabs (Alle/Aktiv/Inaktiv/Premium/Unverifiziert), debounced Search, Row-Click → Detail-Seite, mobile-first (hideOnMobile Spalten)
- **`app/[locale]/admin/users/[id]/page.tsx`**: Nutzer-Detail — Persönliche Daten (InfoRow-Grid), Studienplan-Summary, Toggle-Switches für is_active/is_premium/is_verified (PATCH, kein Admin-Token nötig), Admin-Notes-Textarea (PATCH + save), Danger Zone: Passwort-Reset (POST + Admin-Token), Nutzer löschen (DELETE + Admin-Token, DeleteDialog), Admin-Flag-Badge
- **i18n**: `admin.users.*` + `admin.users.detail.*` in DE+EN (ca. 50 Keys)

### Sprint 5 Phase 7 — Mobile/i18n + Reusable Admin Components (2026-05-10)
#### Fixed
- **`hooks/useAdminSession.ts`**: Cross-Instance-Sync via `window.dispatchEvent("sn-admin-session-change")` — Banner und Sidebar erkennen jetzt sofort wenn Login-Seite `saveSession()` aufruft (vorher: anderes Hook-Instance, kein State-Update)
#### Added
- **`components/admin/AdminMobileHeader.tsx`**: Mobile Top-Bar (sticky, zinc-950) + Hamburger → Slide-Drawer von links (CSS-Transition), Backdrop-Tap schließt, Body-Scroll-Lock, i18n
- **i18n Admin vollständig**: Alle bisherigen deutschen Hardcoded-Strings in `admin.*` Namespace (de.json + en.json). Keys: `nav`, `sidebar`, `sessionBanner`, `login`, `dashboard`, `table`, `status`, `archiveDialog`, `deleteDialog`, `formModal`, `auditBadge`
- **`components/admin/AdminDataTable.tsx`**: Generische Tabelle `<T>`, Column-Sort (SortState + SortIcon), debounced Search (350ms), server-side Pagination, `hideOnMobile` per Spalte, 5-Zeilen Skeleton beim Laden, leerer State
- **`components/admin/AdminFormModal.tsx`**: Bottom-Sheet auf Mobile / zentriertes Modal auf Desktop, Escape + Backdrop schließt, Body-Scroll-Lock, `save`/`create` Varianten
- **`components/admin/ArchiveDialog.tsx`**: Pflicht-Begründung (Textarea), Admin-Session-Prüfung, amber Danger-Styling, i18n
- **`components/admin/DeleteDialog.tsx`**: Tippe-Bestätigungswort (`LÖSCHEN`/`DELETE`, i18n-fähig), Admin-Session-Prüfung, rotes Danger-Styling
- **`components/admin/StatusBadge.tsx`**: 6 Varianten (active/inactive/archived/verified/unverified/premium), dark-mode-aware Farben, i18n
- **`components/admin/AuditBadge.tsx`**: created/modified Varianten, locale-aware Datum + Uhrzeit, Clock-Icon
- **Mobile-Regeln**: ANTIGRAVITY.md Regel 18–20 — mobile-first, i18n-Admin-Namespace, Admin-Nav-Architektur

### Sprint 5 Phase 6 — Admin Dashboard + Analytics Frontend (2026-05-09)
#### Added
- **`components/admin/KPICard.tsx`**: Reusable KPI-Card mit label/value/sub/icon/trend (TrendingUp/Down), Loading-Skeleton via `animate-pulse`
- **`components/admin/GrowthChart.tsx`**: Recharts `ResponsiveContainer + LineChart` — CSS-Vars für Theming (`hsl(var(--primary))`), DE-Datumsformatierung, leerer State + Loading-Skeleton
- **`app/[locale]/admin/page.tsx`**: Dashboard komplett neu als Client-Component — fetcht `/api/admin/stats` + `/api/admin/stats/growth?period=30d`, rendert 4 primäre KPI-Cards (Nutzer gesamt/Aktiv/Premium/Bestandene Module heute), GrowthChart (30 Tage), 3 sekundäre KPI-Cards (Hochschulen/Studiengänge/Module), DB-Größen-Info-Bar, Quick-Nav-Karten
- **recharts**: In Frontend-Container installiert (`npm install recharts`)

### Sprint 5 Phase 5 — Frontend Fundament (2026-05-09)
#### Added
- **`middleware.ts`**: Edge-Runtime JWT-Decode via `atob()` + manuelles Base64url-Padding. `/admin/*` Guard: kein Token → /login, `is_admin=false` → /dashboard
- **`app/api/admin/[...path]/route.ts`**: Catch-all Proxy für alle HTTP-Methoden → Backend `/api/v1/admin/*`, leitet Bearer + X-Admin-Token weiter, 204-safe
- **`hooks/useAdminSession.ts`**: sessionStorage (Key: `sn_admin_session`), 15-min TTL, 1s-Countdown-Timer, 120s Warn-Schwelle — exports `{ token, isActive, isExpiringSoon, secondsLeft, saveSession, clearSession }`
- **`components/admin/AdminSidebar.tsx`**: Dark sidebar (zinc-950), rotes ADMIN-Badge, 9 Nav-Items (Dashboard/Nutzer/Hochschulen/Studiengänge/Module/Voraussetzungen/Bulk-Import/Audit-Log/System), Live-Session-Timer-Chip (grün/amber), Re-Auth-Link
- **`components/admin/AdminSessionBanner.tsx`**: Amber-Warning-Banner wenn <2 min verbleibend ("Verlängern"-Link), Zinc-Info-Bar wenn keine aktive Session
- **`app/[locale]/admin/layout.tsx`**: Server-Component, fetcht Admin-Name via `GET /admin/me`, rendert AdminSidebar + AdminSessionBanner + Kinder (kein Dashboard-Chrome)
- **`app/[locale]/admin/login/page.tsx`**: Dark-Design (zinc-950), Passwort-Form → `POST /api/admin/auth/session` → `saveSession(admin_token)` → redirect zu `/admin`

### Sprint 5 Phase 4 — Analytics Backend (2026-05-09)
#### Added
- **`schemas/admin/analytics.py`**: `AdminStatsResponse` (13 Felder), `GrowthResponse`, `DailyRegistration`, `ModuleStatItem`, `ModuleStatsResponse`, `UserStatsResponse`, `SystemHealthResponse`, `SystemInfoResponse`
- **`routers/admin/analytics.py`**: `GET /admin/stats` (13-Felder KPI-Übersicht), `GET /admin/stats/growth?period=7d|30d|90d|1y` (Tages-Zeitreihe), `GET /admin/stats/modules` (Top/Worst/BestAvgNote), `GET /admin/stats/users` (Segmentierung + by_program)
- **`routers/admin/system.py`**: `GET /admin/system` (DB-Version + `pg_database_size()` + Counts), `GET /admin/system/health` (DB-Ping + Redis.ping → "ok"/"degraded"/"down")
- **Backend Tests**: 12 neue Tests, 111/111 gesamt grün

### Sprint 5 Phase 3 — PO-Verwaltung Backend (2026-05-09)
#### Added
- **`routers/admin/universities.py`**: CRUD Hochschulen (GET list/detail, POST, PATCH, DELETE)
- **`routers/admin/faculties.py`**: CRUD Fakultäten (GET, POST, PATCH, DELETE)
- **`routers/admin/programs.py`**: CRUD Studiengänge + Archive/Restore (Admin-Token + Begründung)
- **`routers/admin/exam_regulations.py`**: CRUD PO-Versionen + Archive/Restore
- **`routers/admin/modules.py`**: CRUD Modulkatalog + Archive/Restore + `POST /import/json` (Bulk-Import bis 500 Module, Duplikat-Detection via `kuerzel`, skip + count, Audit-logged). Import-Route vor `/{module_id}` registriert.
- **`routers/admin/prerequisites.py`**: CRUD Modulvoraussetzungen (Hard Delete erlaubt — kein Bestandsschutz nach ADR-020)
- **ADR-020**: Soft Delete (`is_archived`) — Module/Studiengänge/POs die Studentdaten haben dürfen nie hard-deleted werden
- **Public Routes**: Alle 3 öffentlichen Endpoints in `universities.py` filtern `is_archived == False`
- **Backend Tests**: 22 neue Tests, 99/99 gesamt grün

### Sprint 5 Phase 2 — User-Management Backend (2026-05-09)
#### Added
- **`schemas/admin/user.py`**: `AdminUserListItem`, `AdminUserListResponse` (paginated), `AdminUserDetailResponse` (mit GPA/ECTS), `AdminUserPatch`, `DeleteUserRequest`
- **`routers/admin/users.py`**: GET paginated (25/page, Search + Filter), GET Detail (GPA+ECTS+Module-Count), PATCH mit Audit-Log, POST reset-password (Admin-Token required), DELETE cascade (Admin-Token + Begründung)
- **Backend Tests**: 25 neue Tests, 87/87 gesamt grün

### Sprint 5 Phase 1 — Backend Fundament (2026-05-09)
#### Added
- **Migration 0015**: `is_admin BOOLEAN`, `last_login_at TIMESTAMP WITH TIME ZONE`, `admin_notes TEXT` auf `users`. Admin-Flag wird manuell gesetzt (kein Email-Seed im Code).
- **Migration 0016**: `admin_audit_logs` Tabelle (id, admin_id, action, entity_type, entity_id, old_values, new_values, reason, created_at) + 3 Indizes
- **Migration 0017**: `is_archived BOOLEAN`, `archived_at`, `archived_by_id`, `archive_reason` auf `modules`, `programs`, `exam_regulations`
- **`app/core/admin_auth.py`**: `get_admin_user` (403), `get_verified_admin` (Redis 15-min Token-Prüfung), `create/revoke/verify_admin_session_token`
- **`app/core/audit.py`**: `AuditLogger` FastAPI-Dependency — `audit.log(action, entity_type, entity_id, old_values, new_values, reason)`, db.flush() in gleicher Transaktion
- **`app/core/security.py`**: `create_access_token` mit `is_admin: bool` Parameter → JWT-Claim `is_admin` für Next.js Middleware
- **`app/routers/admin/auth.py`**: `POST /admin/auth/session` (Passwort → 15-min Redis-Token), `DELETE /admin/auth/session`, `GET /admin/me`
- **`app/routers/auth.py`**: Login setzt `last_login_at` + übergibt `is_admin` an JWT
- **ADR-019**: Admin-Session via Redis (15 min TTL, UUID-Token, `X-Admin-Token` Header)
- **ADR-021**: `is_admin` im JWT-Payload — Next.js Middleware liest via `atob()` ohne DB-Query
- **Backend Tests**: 15 neue Tests, 15/15 grün

### Sprint 4 Phase 1 — Prüfungsart & Modul-Metadaten (2026-05-08)
#### Added
- **Migration 0012**: `pruefungsart VARCHAR(20) NULLABLE` + `sws SMALLINT NULLABLE` auf `modules`
- **Migration 0012**: BIN-Seed — alle 37 BIN-Module mit Prüfungsart (PX/EA/R/BAA+Ko) + SWS aus ATPO-FIV 2025 + Modulhandbuch BIN 19WS
- **Backend**: `ModuleResponse` Schema + `module.py` Model um `pruefungsart` + `sws` erweitert
- **Frontend**: `types/study.ts` — `pruefungsart: string | null`, `sws: number | null` auf `ModuleResponse`
- **Frontend `ModuleModal`**: Farbige Prüfungsart-Badge + SWS-Chip (PX=blau, EA=amber, R=lila, BAA+Ko=emerald)
- **Frontend `ModuleList`**: Prüfungsart-Chip pro Modulzeile (unter dem Kürzel)
- **i18n**: `dashboard.modules.pruefungsart.{PX,EA,R,BAA+Ko,label,sws}` in de.json + en.json
- **ADR-018**: Als abgeschlossen dokumentiert

### Sprint 4 Phase 7 — PO-Übersicht-Seite (2026-05-09)
#### Added
- **Route `/dashboard/po-uebersicht`**: Neue Seite mit allen wichtigen PO-Regeln auf einen Blick
- **Sidebar + MobileNav**: neues Nav-Item "Studienordnung" (ScrollText-Icon) nach "Degree Plan"
- **`POUebersicht.tsx`**: 6 Sektionen — Zulassungsregeln §6 (mit Live-Status-Badges), Notenscala §10, Prüfungsarten, Wiederholungsregeln §11, Sondermodule (BIN-209 + WP-Limit), BA-Zulassung mit ECTS-Fortschrittsbalken
- **Program-Detection**: rendert BIN-Content wenn `vorpruefung_bestanden !== null` (program-aware, kein Hardcode); zeigt Placeholder für andere Studiengänge
- **`MobileQuickAdd`**: `/po-uebersicht` zu `hiddenPaths` hinzugefügt (FAB wird dort ausgeblendet)
- **i18n**: `dashboard.nav.poUebersicht` + kompletter `dashboard.poUebersicht`-Block (6 Sektionen × alle Keys) in de.json + en.json
- **Backend Tests**: alle 9 pre-existing Test-Failures behoben — `_make_module()` + `_make_sm()` in allen Test-Dateien um Sprint-4-Felder erweitert (`pruefungsart`, `sws`, `plan_semester`, `custom_ist_benotet`, `parent_module_id`); Mock-Setup für neue DB-Queries in `test_get_my_modules_grouped`, `test_add_wahlpflicht_module_success`, `test_add_custom_ergaenzend_success` aktualisiert

### Sprint 4 Phase 6 — Notenvalidierung & BIN-209 Gewichtungs-Fix (2026-05-09)
#### Added
- **Migration 0014**: `modules.gewichtung` für BIN-209 korrigiert: 1.0 → 1.5 (PO BIN 2019 Anlage B2, war Datenfehler aus Migration 0011)
- **Backend `UpdateModuleRequest`**: `field_validator("note")` — nur 11 offizielle HsH-Noten zulässig (1.0/1.3/1.7/2.0/2.3/2.7/3.0/3.3/3.7/4.0/5.0), HTTP 422 bei Verstoß
- **Frontend `ModuleModal`**: Noteneingabe von `<Input type="number">` auf `<select>`-Dropdown mit 11 Optionen umgestellt (keine Freitexteingabe mehr)
- **i18n**: `dashboard.modal.noteSelect` (Dropdown-Placeholder) in de.json + en.json

### Sprint 4 Phase 5 — module_prerequisites + BIN-209 GPA-Fix (2026-05-09)
#### Added
- **Migration 0013**: `module_prerequisites` Tabelle (id, module_id, required_module_id, minimum_ects, required_semesters, prerequisite_type, description)
- **Migration 0013**: `parent_module_id UUID NULLABLE FK → modules` auf `student_modules`
- **Migration 0013**: BIN PO §6 Seed — alle Voraussetzungsregeln für BIN-200..210 + WP (BIN-211..219)
- **Migration 0013**: Backfill `parent_module_id` für bestehende custom ERGAENZEND StudentModules → BIN-209
- **Backend Model**: `ModulePrerequisite` + `PrerequisiteType` Enum (`MODULE`, `ECTS_THRESHOLD`, `SEMESTER_COMPLETE`)
- **Backend `StudentModule`**: `parent_module_id` Spalte
- **Backend `StatsResponse`**: `parent_module_id` + `prerequisites_met` Felder
- **Backend `add_module()`**: Auto-setzt `parent_module_id = BIN-209` für neue custom ERGAENZEND Sub-Module
- **Backend `GET /me/modules`**: Berechnet `prerequisites_met: bool` pro Modul via `_eval_prerequisites()` + `_get_semester_flags()`
- **Backend `gpa_service.py`**: BIN-209 GPA-Fix — ERGAENZEND Sub-Module werden per `parent_module_id` gruppiert, `avg(note)` wird als BIN-209-Note verwendet (`× 6 ECTS × gewichtung`)
- **Frontend `types/study.ts`**: `parent_module_id: string | null`, `prerequisites_met: boolean | null` auf `StudentModuleResponse`
- **Frontend `ModuleModal`**: Lock-Icon + amber Hinweis wenn `prerequisites_met === false`
- **Frontend `ModuleList`**: Lädt `useUserStats`, übergibt `wpPrerequisitesMet = stats?.sem2_complete` an AddModuleModal
- **Frontend `AddModuleModal`**: `wpPrerequisitesMet` Prop — amber Banner + Save-Button deaktiviert wenn WP-Voraussetzungen fehlen
- **i18n**: `modal.prerequisitesHint`, `addModule.wpPrerequisitesLocked` in de.json + en.json

### Sprint 4 Phase 4 — Dynamisches FAB + Proxy-Route Fix (2026-05-08)
#### Added
- **Frontend `src/app/api/me/profile/route.ts`**: Neue Next.js Proxy-Route — `GET` → `/me` (UserResponse), `PUT` → `/me/profile` (Profil aktualisieren)
- **Frontend `MobileQuickAdd`**: `useQuery(["userProgram"])` — lädt `start_semester` aus `GET /api/study/program` dynamisch
- `semesterTag` für EventModal wird aus `UserProgramResponse.start_semester` gesetzt (Fallback: `""` wenn kein Programm)

### Sprint 4 Phase 3 — BIN-209 Sub-Modul-Katalog (2026-05-08)
#### Added
- **Frontend `AddModuleModal`**: Suggestion-Dropdown im Custom-Modus mit 7 offiziellen BIN-209-Namen (laut PO Anlage B2): Ergänzendes Fach A–D + Ergänzendes BWL-Fach A–C
- **Frontend `AddModuleModal`**: Auswahl aus Dropdown füllt automatisch Modulname + ECTS=2
- **Frontend `AddModuleModal`**: Amber-Hinweis wenn non-BWL-Fach gewählt — erinnert an PO-Pflicht (mind. 1 BWL-Fach)
- **i18n**: `addModule.ergaenzendSuggestions.{label,selectHint,bin20901..07,bwlHint}` in de.json + en.json
- **i18n**: `addModule.ergaenzendHint` aktualisiert (Hinweis auf Katalog-Dropdown ergänzt)

### Sprint 4 Phase 2 — Vorprüfungs-Milestone Dashboard (2026-05-08)
#### Added
- **Backend `GET /me/stats`**: 8 neue Felder — `sem1_complete`, `sem2_complete`, `vorpruefung_bestanden`, `sem4/5/6_zugaenglich`, `ba_zulassung_eligible`, `ects_fuer_ba`
- **Backend**: `_compute_milestone_stats()` Helper — program-aware via `semester_empfehlung` (kein BIN-Hardcode)
- **Backend**: `StatsResponse` Pydantic-Schema um 8 optionale Felder erweitert (`None` für nicht-BIN Programme)
- **Frontend `MilestoneWidget`**: Neue Dashboard-Sidebar-Komponente (`components/dashboard/`)
  - Rendert nur für BIN-Studierende (wenn `vorpruefung_bestanden !== null`)
  - Vorprüfungs-Status: Icon + grüner/grauer Badge
  - Semester 4/5/6 Freischaltung: Lock/Unlock-Icons
  - BA-Fortschrittsbalken (X/134 ECTS), wird grün bei Zulassung
- **Frontend `types/study.ts`**: `StatsResponse` um 8 neue `boolean | null` Felder
- **Dashboard `page.tsx`**: `MilestoneWidget` in Sidebar eingebunden (über ExamCountdownWidget)
- **i18n**: `dashboard.milestone.*` (14 Keys) in de.json + en.json
- **`docs/api/stats.md`**: alle neuen Felder dokumentiert

### Planned
- **Sprint 5**: Admin Panel (PO-Verwaltung ohne Alembic-Migrationen)
- **Sprint 6**: PWA, Branding & Launch
- **Sprint 7**: Multi-Programm (MDI, Master-Programme)

## [v0.3.7.7] - 2026-05-07 (Sprint 3.7.7 - BIN PO Datenkorrektur)
### Fixed
- **Migration 0011**: Alle 27 PFLICHT-Kürzel auf offizielles Schema BIN-100..BIN-210 korrigiert
- **Migration 0011**: BIN-207 (Computergrafik 2) und BIN-209 (Ergänzende Fächer) fehlten — eingefügt
- **Migration 0011**: Alle 9 WAHLPFLICHT-Namen auf offizielle PO-Namen korrigiert (statt erfundener Namen)
- **Migration 0011**: `ist_benotet` korrigiert — BIN-114, BIN-204, BIN-206, BIN-208 sind unbenotet
- **Migration 0011**: `has_prerequisites` — 1. Abschnitt (BIN-100..116) auf false gesetzt (keine PO-Voraussetzungen)
- **Migration 0011**: Fake-Platzhaltermodule gelöscht (BIN-501, BIN-601 etc.)
- **ModuleModal**: Custom-Module zeigten immer "unbenotet" — behoben mit `custom_ist_benotet` Logik
### Added
- **Migration 0011**: `custom_ist_benotet BOOLEAN NULLABLE` auf student_modules
- **Backend**: `custom_ist_benotet` in Model, Schemas (Add/Update/Response), Router
- **Backend**: WAHLPFLICHT-Limit = 2, erzwingt HTTP 409 bei Überschreitung
- **Frontend AddModuleModal**: "Benotet?"-Checkbox für custom ERGAENZEND-Module
- **Frontend AddModuleModal**: WAHLPFLICHT-Warning (amber) wenn Limit (2) erreicht
- **Frontend AddModuleModal**: BIN-209 Ergänzende Fächer Hinweistext
- **Frontend ModuleList**: berechnet `wahlpflichtCount`, übergibt an AddModuleModal
- **i18n**: `addModule.isGraded`, `addModule.wahlpflichtFull`, `addModule.ergaenzendHint` in de.json + en.json

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
