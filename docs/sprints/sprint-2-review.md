# Sprint 2 Review – StudyNexus

**Sprint:** 2 – Studienplan und Notenmanagement
**Zeitraum:** 19. April 2026
**Status:** 🟢 Abgeschlossen

---

## Sprint Ziel

Vollständig lauffähiges Studienplan- und Notenmanagement. Studierende können ihre Hochschule und Studiengang auswählen, Module verwalten (erstellen, bearbeiten) und automatisiert berechnete Statistiken (GPA, ECTS) einsehen.

---

## Erledigte User Stories

| Issue | User Story | Story Points | Status |
|---|---|---|---|
| #7 | Hochschule und Studiengang auswählen | 5 | ✅ Done |
| #8 | Module aus Katalog hinzufügen | 5 | ✅ Done |
| #9 | Noten und Status von Modulen setzen | 3 | ✅ Done |
| #10 | GPA und ECTS automatisch berechnen | 3 | ✅ Done |
| #11 | Wahlpflichtmodule flexibel zuordnen | 2 | ✅ Done |

**Gesamt:** 18 Story Points

---

## Was wurde gebaut

### Backend (FastAPI)
- 7 neue DB-Modelle: `University`, `Faculty`, `Program`, `ExamRegulation`, `Module`, `UserProgram`, `StudentModule`
- Alembic Migrationes 0002 & 0003 (Tabellen-Setup, HSH-Seed Data, ENUM Fixes)
- Hochschul-/Studiengangskatalog Endpunkte (5 Public Endpoints)
- Notenmanagement Endpunkte (8 Protected Endpoints für CRUD Moduloperationen)
- Dynamischer GPA-Service mit komplexer Gewichtung: `sum(note×ects×gewichtung) / sum(ects×gewichtung)`
- ECTS und Fortschritts-Rechner Endpunkte
- Datensätze für HsH Fakultät IV (32 Pflichtmodule, Wahlpflicht-Katalog BIN-211…BIN-219)
- 66/66 Backend-Tests bestanden

### Frontend (Next.js)
- Server-Side Check: Automatische Weiterleitung nach `/dashboard/setup` ohne Profil
- Setup-Prozess: Multi-Step Formular (Fakultät → Programm → Prüfungsordnung → Semester)
- `StatsCard` Komponente mit animiertem Progress-Bar, ECTS-Zähler und lokalisiertem GPA-Display (Deutsches Format `3,0` statt `3.0`)
- `ModuleList` Komponente, automatisch nach Semestern gruppiert mit entsprechenden Badge-States
- `AddModuleModal` & `ModuleModal`: UI-Interfaces zum Editieren, Entfernen und Registrieren von Modulen (inklusive flexibler Custom-Ergänzungsmodule)
- Umfassende i18n Unterstützung `(de/en)` für das komplette Dashboard
- 57/57 Frontend-Tests bestanden

---

## Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Nutzung von `postgresql.ENUM` statt `sa.Enum` | Verhindert Laufzeitfehler bei Datenbank-Replikation und "CREATE TYPE"-Kollisionen bei Alembic. |
| Datenerfassung durch Admin-Seeding | Crowdsourcing der Prüfungsordnungen erzeugt zu viel fehlerhafte Daten; POs werden zentral eingepflegt. |
| Dynamischer GPA per On-The-Fly Request | Keine Cached-Staleness in der Datenbank; Noten werden immer live passend zum Snapshot berechnet. |
| Fetch `cache: "no-store"` bei Proxy-Routen | Verhinderte Server-seitig "eingefrorene" alte Datensätze (Next.js 14 Caching Limitierung behoben). |

---

## Probleme und Lösungen

| Problem | Lösung |
|---|---|
| Endlos-Render-Schleife nach Setup-Weiterleitung | `useRouter` Push im `useEffect` refactored, `router.replace` mit strikteren Root-Dependencies verwendet. |
| GPA Formatierung zeigte `3.00` | Locale Parse Regex auf Deutsches Notensystem `toFixed(1).replace('.', ',')` angepasst. |
| Prop-Drilling für Neu-Laden der Modullisten | Temporär durch Callbacks (`refreshKey`/`onModuleSaved`) gelöst (wurde in Sprint 3A durch React Query modernisiert). |

---

## Metriken

| Metrik | Wert |
|---|---|
| Backend Tests | 66/66 ✅ |
| Frontend Tests | 57/57 ✅ |
| API Endpunkte | 13 Neue Endpunkte |
| Alembic Migrations | +2 (0002, 0003) |
| Story Points | 18 |

---

## Sprint 3A Vorschau

**Thema:** Auth hardening + Dashboard fixes
**Ziel:** Sicherheit signifikant härten (HsH Account Pflicht, Verify-Email) und Dashboard State Management professionell stabilisieren.
