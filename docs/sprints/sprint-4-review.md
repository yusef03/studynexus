# Sprint 4 Review – BIN Studiengang Vollintegration

**Zeitraum:** 08.–09. Mai 2026  
**Status:** ✅ Abgeschlossen  
**Ziel:** Den BIN-Studiengang vollständig, intelligent und lückenlos in StudyNexus integrieren — alle PO-Regeln automatisch abgebildet, kein manuelles Nachschlagen in PDFs mehr nötig.

---

## Quell-PDFs (vollständig gelesen)

| Dokument | Seitenanzahl | Relevanz |
|---|---|---|
| PO BIN 2019 (Prüfungsordnung Angewandte Informatik) | 9 Seiten | §5 Abschnitte, §6 Zulassungsregeln, Anlage B1/B2 Modullisten |
| ATPO-FIV 2025 (Allg. Prüfungsordnung Fak. IV) | 20 Seiten | §7 Prüfungsarten, §10 Notenscala, §11 Wiederholungsregeln |
| Modulhandbuch BIN 19WS | 76 Seiten | SWS, Prüfungsarten, Modulbeschreibungen |

---

## Implementierte Phasen

### Phase 1 — Prüfungsart & Modul-Metadaten

**Migration 0012:** `pruefungsart VARCHAR(20)` + `sws SMALLINT` auf `modules`  
**Seed:** Alle 37 BIN-Module mit korrekten Prüfungsarten aus ATPO-FIV §7:
- PX: 26 Standard-PFLICHT-Module (Sem 1–5) + alle 9 WAHLPFLICHT
- EA: BIN-114 (Programmierprojekt), BIN-206 (Praxisprojekt 1), BIN-208 (Praxisprojekt 2)
- R: BIN-204 (Seminar)
- BAA+Ko: BIN-210 (Bachelorarbeit + Kolloquium)

**Backend:** `ModuleResponse` um `pruefungsart`, `sws` erweitert  
**Frontend:** Farbige Badges in ModuleModal (PX=blau, EA=amber, R=lila, BAA+Ko=emerald) + Chips in ModuleList

---

### Phase 2 — Vorprüfungs-Milestone Dashboard

**Basis:** PO BIN 2019 §6 Zulassungsregeln

**Backend `GET /me/stats`** — 8 neue Felder:
| Feld | Bedeutung |
|---|---|
| `sem1_complete` | Alle 6 Sem-1-Module bestanden (BIN-100..BIN-104, BIN-116) |
| `sem2_complete` | Alle 5 Sem-2-Module bestanden (BIN-105..BIN-109) |
| `vorpruefung_bestanden` | Alle 17 Sem-1–3-Module bestanden |
| `sem4_zugaenglich` | Sem 1 complete |
| `sem5_zugaenglich` | Sem 1+2 complete |
| `sem6_zugaenglich` | Vorprüfung bestanden |
| `ba_zulassung_eligible` | Vorprüfung + ≥134 ECTS |
| `ects_fuer_ba` | Bestandene ECTS (für BA-Fortschrittsbalken) |

**Frontend:** `MilestoneWidget` — neue Dashboard-Sidebar-Komponente mit Live-Status

---

### Phase 3 — BIN-209 Sub-Modul-Katalog

**Basis:** PO BIN 2019 Anlage B2 — 7 offizielle Teilmodul-Bezeichnungen

**Frontend `AddModuleModal`:**
- Suggestion-Dropdown im Custom-Modus (BIN-209-01..07)
- Auto-fill Name + ECTS=2 bei Auswahl
- Amber-Hinweis wenn non-BWL-Fach gewählt (PO: mind. 1 BWL-Fach)

---

### Phase 4 — Dynamisches FAB + Proxy-Route

**Proxy-Route `GET/PUT /api/me/profile`** — behebt fehlende Route (404 im FAB)  
**MobileQuickAdd:** `semesterTag` dynamisch aus `UserProgramResponse.start_semester` statt hardcoded `"WiSe2425"`

---

### Phase 5 — module_prerequisites (ADR-010)

**Migration 0013:** `module_prerequisites` Tabelle + `parent_module_id` auf `student_modules`

**BIN §6 Seed — alle Voraussetzungsregeln:**
| Module | Typ | Voraussetzung |
|---|---|---|
| BIN-200..204 | SEMESTER_COMPLETE | Sem 1 |
| BIN-205, BIN-207 | SEMESTER_COMPLETE | Sem 1+2 |
| BIN-206, BIN-208 | SEMESTER_COMPLETE | Sem 1+2+3 (Vorprüfung) |
| BIN-210 | SEMESTER_COMPLETE + ECTS_THRESHOLD | Vorprüfung + 134 ECTS |
| BIN-211..219 (WP) | SEMESTER_COMPLETE | Sem 1+2 |
| BIN-209 Sub-Module | — | keine |

**BIN-209 GPA-Fix:** Sub-Module per `parent_module_id` gruppiert → `avg(note)` × 6 ECTS × 1.5 gewichtung  
**Frontend:** Lock-Icon in ModuleModal + WP-Voraussetzungen-Banner in AddModuleModal

---

### Phase 6 — Notenvalidierung

**Migration 0014 (Datenfehler-Fix):** BIN-209 `gewichtung` 1.0 → 1.5 (Anlage B2 PO BIN)

**Backend:** `field_validator("note")` auf `UpdateModuleRequest` — nur 11 offizielle HsH-Noten zulässig:
```
1,0 / 1,3 / 1,7 / 2,0 / 2,3 / 2,7 / 3,0 / 3,3 / 3,7 / 4,0 / 5,0
```
HTTP 422 bei ungültiger Note.

**Frontend `ModuleModal`:** Noteneingabe → `<select>`-Dropdown mit 11 Optionen (keine Freitexteingabe mehr)

---

### Phase 7 — PO-Übersicht-Seite

**Route:** `/dashboard/po-uebersicht` ("Studienordnung" im Sidebar)

**6 Sektionen auf einen Blick:**

| Sektion | Quelle | Highlights |
|---|---|---|
| Zulassungsregeln §6 | PO BIN 2019 §6 | Tabelle mit Live-Status-Badges |
| Notenscala §10 | ATPO-FIV §10 | 11 Noten farbkodiert nach Bedeutung |
| Prüfungsarten | ATPO-FIV §7 | PX/EA/R/BAA+Ko mit Farbcodes |
| Wiederholungsregeln §11 | ATPO-FIV §11 | 4 Kernregeln als Aufzählung |
| Sondermodule | PO BIN Anlage B2 | BIN-209 Detailregeln + WP-Limit |
| BA-Zulassung | PO BIN §6 + §5 | Live-ECTS-Fortschrittsbalken |

**Architektur:** program-aware (erkennt BIN via `vorpruefung_bestanden !== null`), kein Hardcode — Sprint 7 fügt weitere Studiengänge hinzu.

---

## Vollständigkeits-Check gegen PO-Dokumente

### PO BIN 2019 — Was ist eingebaut?

| PO-Regel | Implementiert | Wo |
|---|---|---|
| §5 Abschnitt 1: 16 PFLICHT-Module BIN-100..116, 90 ECTS | ✅ | Migration 0011, Module-Seed |
| §5 Abschnitt 2: 11 PFLICHT + 2 WP, 90 ECTS | ✅ | Migration 0011, Module-Seed |
| §6 Sem-4-Zulassung: Sem 1 complete | ✅ | `_get_semester_flags`, `prerequisites_met`, POUebersicht |
| §6 Sem-5-Zulassung: Sem 1+2 complete | ✅ | wie oben |
| §6 Sem-6-Zulassung: Vorprüfung (Sem 1–3) | ✅ | wie oben |
| §6 BIN-206/208: Vorprüfung erforderlich | ✅ | module_prerequisites Seed |
| §6 BIN-209: keine Voraussetzung | ✅ | kein Eintrag in prerequisites |
| §6 BIN-210: Vorprüfung + 134 ECTS | ✅ | module_prerequisites Seed |
| §6 WP-Limit: max. 2 WP-Module | ✅ | Backend HTTP 409 + Frontend-Warning |
| BIN-209: 3 Sub-Module à 2 ECTS | ✅ | AddModuleModal + GPA-Fix |
| BIN-209: mind. 1 BWL-Fach | ✅ (Hinweis) | amber Banner in AddModuleModal |
| BIN-209 Gewichtung: 1,5 | ✅ | Migration 0014 + gpa_service.py |
| Prüfungsarten per Modul (PX/EA/R/BAA+Ko) | ✅ | pruefungsart-Spalte + Badges |
| SWS per Modul | ✅ | sws-Spalte |
| BA-Zulassung: Vorprüfung + 134 ECTS | ✅ | `ba_zulassung_eligible` + POUebersicht |

### ATPO-FIV 2025 — Was ist eingebaut?

| ATPO-Regel | Implementiert | Wo |
|---|---|---|
| §10: 11 offizielle Noten | ✅ | Pydantic-Validator + Select-Dropdown |
| §10: Bestehensgrenze ≤ 4,0 | ✅ | Router-Validierung (PASSED + note > 4.0 rejected) |
| §10: Note 5,0 = nicht ausreichend (→ FAILED) | ✅ | Router-Validierung |
| §11: max. 2 Wiederholungen (3 Versuche) | ✅ | max_versuche-Prüfung im Router |
| §7: Prüfungsarten-Kürzel | ✅ | pruefungsart-Spalte + POUebersicht |

### Was ist NICHT eingebaut (bewusst zurückgestellt)?

| Regel | Sprint |
|---|---|
| §11: 13-Monate-Wiederholungsfrist (Fristenverfolgung) | Sprint 5+ |
| §11: Notenverbesserungs-Tracking | Sprint 5+ (Ideen-Backlog) |
| §11: 3 mündliche Ergänzungsprüfungen (Zähler) | Sprint 5+ |
| MDI / Master-Programme | Sprint 7 |

---

## Test-Ergebnisse

```
Backend: 58/58 Tests grün ✅
Frontend: TypeScript — keine Fehler in Produktions-Code ✅
          (Test-Dateien haben pre-existing @types/jest-Fehler — unverändert)
```

---

## Migrationen Sprint 4

| Nr | Datum | Inhalt |
|---|---|---|
| 0012 | 2026-05-08 | pruefungsart + sws auf modules, BIN-Seed |
| 0013 | 2026-05-08 | module_prerequisites, parent_module_id, BIN §6 Seed |
| 0014 | 2026-05-09 | BIN-209 gewichtung 1.0 → 1.5 (Datenfehler-Fix) |
