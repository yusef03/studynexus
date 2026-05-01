# Sprint 3.7 Review – StudyNexus

**Sprint:** 3.7 – Dashboard Rework, Auth & i18n
**Zeitraum:** 28.–29. April 2026
**Status:** 🟢 Phase 1+2 Abgeschlossen, Phase 3–5 offen

---

## Sprint Ziel

Professionalisierung der gesamten Plattform: echte Daten statt Platzhalter, funktionierende Einstellungen, saubere Registrierung und vollständige Zweisprachigkeit (Deutsch/Englisch).

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

---

## Offene Phasen

### Phase 3: Mobile Kanban Rework
- HTML5 Drag-and-Drop Polyfill auf dem Handy ist unbrauchbar
- Lösung: Tap-to-Move oder @dnd-kit mit Touch-Sensoren

### Phase 4: Studienplan Builder (Bucket-System)
- Dynamische Semester-Container mit `+ Neues Semester` Button
- Module starten in "Ungeplant", werden per DnD in Semester verteilt

### Phase 5: Kontext-Sensitiver Quick Add
- `+` Button nur auf sinnvollen Seiten anzeigen (nicht in Settings/Profile)

---

## Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Token 7 Tage statt 30 Min | Studierende arbeiten in langen Sessions; ständige Re-Logins sind UX-Killer |
| Semester-Feld entfernt aus ModuleModal | Verhindert das Erzeugen willkürlicher Semester-Spalten; Zuweisung nur via StudyPlan DnD |
| i18n vorgezogen aus Sprint 6 | War blockierend für professionelle Präsentation; next-intl war bereits integriert |
| date-fns Locale dynamisch | `useLocale()` + `de` / `enUS` statt hardcoded `de` |
