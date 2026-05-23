# Sprint 3.7 Review – StudyNexus

**Sprint:** 3.7 – Dashboard Rework, Mobile UX & System-Logik
**Zeitraum:** 28. April – 07. Mai 2026
**Status:** 🟢 Alle 5 Phasen abgeschlossen

---

## Sprint Ziel

Professionalisierung der gesamten Plattform: echte Daten statt Platzhalter, funktionierende Einstellungen, saubere Registrierung, vollständige Zweisprachigkeit (Deutsch/Englisch), native Touch-DnD und intelligente UI-Steuerung.

---

## Erledigte Phasen

### Phase 1: Fundament & Registrierung ✅

| Feature | Beschreibung |
|---|---|
| Registrierung erweitert | `matrikelnummer`, `birth_date`, `hochschule` als Pflichtfelder im Backend und Frontend |
| Server-Fetch Fix | Auth-Cookie wird korrekt an Server Components weitergegeben – Dashboard-Greeting zeigt echten Namen |
| Token Lifetime | Von 30 Minuten auf 7 Tage erhöht (Backend `.env` + Frontend Cookie `maxAge`) |

### Phase 2: Settings & ID-Card ✅

| Feature | Beschreibung |
|---|---|
| ID-Card | Rendert echte Daten (Name, Matrikelnummer, Hochschule, Geburtsdatum) im Glassmorphism-Design |
| Settings - Persönliche Daten | Felder aus DB geladen, `disabled` (read-only), da bei Registrierung festgelegt |
| Settings - Passwort ändern | Neuer Backend-Endpoint `PUT /me/password` mit Altes-Passwort-Verifikation |
| Settings - Sprachwechsel | Funktionaler DE ↔ EN Toggle über next-intl Locale-Routing |

### Phase 3: Mobile Kanban Rework ✅

| Feature | Beschreibung |
|---|---|
| `@dnd-kit` Integration | HTML5-Polyfill `mobile-drag-drop` entfernt, ersetzt durch `@dnd-kit/core` + `@dnd-kit/sortable` |
| Touch-Sensor | `PointerSensor` mit `activationConstraint: { distance: 8 }` für ruckelfreies Scrollen |
| Komponentenarchitektur | Monolithisches Board → `KanbanBoard`, `KanbanColumn`, `KanbanCard` (alle `React.memo`) |
| DragOverlay | Schwebendes Preview-Bild beim Ziehen, Spalten-Highlight beim Überziehen |
| i18n Status/Priority | Hardcoded Dropdown-Labels im TaskModal durch `t()` Keys ersetzt |
| Hook-Order Fix | `useCallback` vor allen bedingten Returns verschoben (React Hook-Regel) |

### Phase 4: Studienplan Builder (Bucket-System) ✅

| Feature | Beschreibung |
|---|---|
| `@dnd-kit` Integration | HTML5 DnD durch native Touch-Sensoren ersetzt (identisch wie Phase 3) |
| Dynamische Semester | `+ Neues Semester` Button erstellt dynamisch Semester 7, 8, etc. |
| Komponentenarchitektur | Ausgelagerte `StudyPlanColumn` + `StudyPlanCard` mit `React.memo` |
| Daten-Persistenz | Semester-Zuordnung via optimistischem Mutation-Update + Backend-Sync |
| Bestehende Daten | Existierende Semester > 6 aus der DB werden automatisch als Spalten angezeigt |

### Phase 5: Kontext-Sensitiver Quick Add ✅

| Feature | Beschreibung |
|---|---|
| Intelligenter FAB | `usePathname()` prüft die aktuelle Route |
| Ausblenden | FAB wird auf `/settings`, `/profile` und `/setup` ausgeblendet |
| Hook-Order | Alle `useState`/`useTranslations`/`usePathname` Hooks vor dem `if (shouldHide)` Return |

### Zusatz: Vollständige i18n-Integration ✅

Jeder einzelne UI-String wurde aus den Komponenten in die JSON-Übersetzungsdateien ausgelagert:

| Bereich | Dateien |
|---|---|
| Dashboard Widgets | SmartTimeline, ExamCountdown, DailyFocus |
| Navigation | Sidebar, MobileNav |
| Kanban | KanbanBoard, TaskModal |
| Stundenplan | ScheduleBoard, EventModal, MobileAgendaView |
| Studienplan | StudyPlanBoard |
| Module | ModuleList, ModuleModal, AddModuleModal |
| Datumsformatierung | date-fns locale, toLocaleDateString |

---

## Bugfixes

| Bug | Root Cause | Fix |
|---|---|---|
| "Not authenticated" beim Noten speichern | JWT-Token nach 30 Min abgelaufen | Token-Lifetime → 7 Tage, 401 Auto-Redirect |
| Modul in falsche Spalte verschoben | Freies Semester-Textfeld im ModuleModal | Feld entfernt, `semester` aus UpdatePayload gelöscht |
| Hardcoded "de-DE" in Datumsanzeige | `toLocaleDateString("de-DE")` überall fest | Dynamisch via `useLocale()` |
| "HOHE PRIO" Badge auf Englisch | Hardcoded deutscher String | Via Translation-Key `labels.highPrio` |
| "Uhr" Suffix im Exam Countdown | Hardcoded "Uhr" | Entfernt (unnötig) |
| "Rendered more hooks" Crash | `useCallback` nach bedingtem `return null` | Hooks vor alle Early Returns verschoben |
| Missing `FOCUS` EventType | Frontend-Typ nicht synchron mit Backend | `FOCUS` zu `EventType` Union hinzugefügt |
| `StudentModule` Import-Fehler | Falscher Type-Name in StudyPlanBoard | Auf `StudentModuleResponse` korrigiert |
| `UserStats` Import-Fehler | Veraltetes Interface in useUserStats | Auf `StatsResponse` korrigiert |
| `EventModal` Null-Crash | `modName` konnte `null` sein | Null-Guard `modName &&` hinzugefügt |
| `semester` Type-Mismatch | `number` vs `string` in StudyPlanBoard | `.toString()` Konvertierung |

---

## Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Token 7 Tage statt 30 Min | Studierende arbeiten in langen Sessions; ständige Re-Logins sind UX-Killer |
| Semester-Feld entfernt aus ModuleModal | Verhindert das Erzeugen willkürlicher Semester-Spalten; Zuweisung nur via StudyPlan DnD |
| i18n vorgezogen aus Sprint 6 | War blockierend für professionelle Präsentation; next-intl war bereits integriert |
| date-fns Locale dynamisch | `useLocale()` + `de` / `enUS` statt hardcoded `de` |
| @dnd-kit statt HTML5 DnD | Einheitliche Touch+Maus+Pen Unterstützung, keine Polyfills nötig |
| FAB kontextsensitiv | Verhindert UI-Clutter auf Formularen (Settings, Profile) |
