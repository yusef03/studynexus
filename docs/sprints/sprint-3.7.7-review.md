# Sprint 3.7.7 Review – BIN PO Datenkorrektur

**Sprint:** 3.7.7 – BIN PO Datenkorrektur (Studiengang-Vollanalyse)
**Zeitraum:** 07. Mai 2026 (1 Tag)
**Status:** ✅ Abgeschlossen

---

## Sprint Ziel

Vollständige und PO-konforme Abbildung des BIN-Studiengangs "Angewandte Informatik" in der StudyNexus-Datenbank. Alle Modul-Kürzel, -Namen, ECTS, Benotungsregeln und Voraussetzungsflags entsprechen exakt dem offiziellen Modulhandbuch BIN 19WS (Stand: 29. April 2024) und der PO BIN 2019.

---

## Analysierte Dokumente

| Dokument | Inhalt | Seiten |
|---|---|---|
| `2024-04-29-modules-BIN-19WS-DE.pdf` | Modulhandbuch BIN 19WS — vollständige Modulbeschreibungen, Prüfungsarten, SWS, Lernziele | 76 |
| `19-08-31-11_F_IV_PO_BIN_2019.pdf` | PO BIN 2019 (Besonderer Teil) — §§ 1-10, Anlage B1+B2 mit allen Kürzel, ECTS, Gewichtungen | 9 |
| `04_FIV_ATPO_2025_mit_Anhang_VB.pdf` | ATPO-FIV 2025 (Allgemeiner Teil) — §§ 1-26, Prüfungsarten, Notenystem, Wiederholungsregeln | 20 |

---

## Was war falsch (vor Migration 0011)

### Problem: Seed-Daten aus Migration 0002/0003 waren strukturell fehlerhaft

| Bereich | Alt (falsch) | Neu (korrekt) |
|---|---|---|
| Kürzel-Schema | BIN-101..BIN-603 (Semester-Präfix) | BIN-100..BIN-219 (fortlaufend laut PO) |
| BIN-207 Computergrafik 2 | Fehlte komplett | ✅ Eingefügt |
| BIN-209 Ergänzende Fächer | Fehlte komplett | ✅ Eingefügt als PFLICHT, 6 ECTS, Sem 4 |
| WAHLPFLICHT-Namen | Erfunden (z.B. "Erweiterte Webentwicklung") | ✅ Offizielle PO-Namen |
| ist_benotet | Alle = true | ✅ BIN-114, 204, 206, 208 = false |
| has_prerequisites | Alle PFLICHT = true | ✅ Nur BIN-200+ = true (1. Abschnitt hat keine PO-Voraussetzungen) |
| Fake-Platzhalter | BIN-501, BIN-601 etc. — nie in der PO | ✅ Gelöscht |
| Custom-Module benotet | Nicht konfigurierbar | ✅ `custom_ist_benotet` Checkbox |

---

## Was wurde implementiert

### Datenbank: Migration 0011

**Datei:** `backend/alembic/versions/2026_05_07_0011_fix_bin_modules_and_add_custom_ist_benotet.py`

```
custom_ist_benotet BOOLEAN NULLABLE → student_modules (neu)

modules Tabelle nach Migration:
  28 PFLICHT:   BIN-100..BIN-116 (Sem 1-3), BIN-200..BIN-210 (Sem 4-6)
   9 WAHLPFLICHT: BIN-211..BIN-219 (Sem 5-6, Student wählt genau 2 = 12 ECTS)
   0 ERGAENZEND: Leer (vom Studierenden als Custom-Module angelegt)
```

Aktionen der Migration:
1. `custom_ist_benotet BOOLEAN NULLABLE` auf `student_modules` hinzugefügt
2. Fake-Module gelöscht (inkl. zugehörige StudentModule-Einträge): "Ergänzendes Fach BWL", "Ergänzendes Fach 1/2", "Wahlpflichtfach Informatik 1/2"
3. Alle 27 PFLICHT-Module: kuerzel, ects, ist_benotet, has_prerequisites, gewichtung, semester_empfehlung korrigiert
4. Alle 9 WAHLPFLICHT-Module: echte PO-Namen, semester_empfehlung=5, has_prerequisites=true
5. BIN-207 "Computergrafik 2" eingefügt (6 ECTS, Sem 5, benotet=true, has_prereq=true)
6. BIN-209 "Ergänzende Fächer" eingefügt (6 ECTS, Sem 4, benotet=true, has_prereq=false, gewichtung=1.5)
7. BIN-209 automatisch für alle bestehenden User mit BIN-Programm provisioniert

### Backend

| Datei | Änderung |
|---|---|
| `backend/app/models/student_module.py` | `custom_ist_benotet = Column(Boolean, nullable=True)` |
| `backend/app/schemas/study_plan.py` | `custom_ist_benotet: Optional[bool]` in 3 Schemas (Add/Update/Response) |
| `backend/app/routers/study_plan.py` | `add_module()`: speichert `custom_ist_benotet`; `update_module()`: via `model_fields_set`; `_build_sm_response()`: serialisiert |
| `backend/app/routers/study_plan.py` | WAHLPFLICHT-Limit: `add_module()` prüft count ≥ 2 → HTTP 409 |

### Frontend

| Datei | Änderung |
|---|---|
| `frontend/src/types/study.ts` | `custom_ist_benotet: boolean \| null` auf `StudentModuleResponse` |
| `frontend/src/hooks/queries/useAddModule.ts` | `custom_ist_benotet?: boolean` in `AddPayload` |
| `frontend/src/components/study/ModuleModal.tsx` | Bug-Fix: `sm.module !== null ? sm.module.ist_benotet : (sm.custom_ist_benotet ?? true)` |
| `frontend/src/components/study/AddModuleModal.tsx` | Benotet-Checkbox (custom-Modus), WAHLPFLICHT-Warning (amber), BIN-209-Hinweis, wahlpflichtCount Prop |
| `frontend/src/components/study/ModuleList.tsx` | Berechnet `wahlpflichtCount`, übergibt an AddModuleModal |

### i18n

| Key | de.json | en.json |
|---|---|---|
| `dashboard.addModule.isGraded` | "Benotet" | "Graded" |
| `dashboard.addModule.wahlpflichtFull` | "Limit erreicht – laut PO sind genau 2 WP-Module (12 ECTS) vorgesehen" | "Limit reached – the exam regulations allow exactly 2 elective modules (12 ECTS)" |
| `dashboard.addModule.ergaenzendHint` | "BIN-209 Ergänzende Fächer: Füge hier 3 eigene Module (je 2 ECTS) hinzu – mind. 1 aus dem BWL-Bereich" | "BIN-209 Supplementary Courses: Add 3 modules here (2 ECTS each) – at least 1 from the Business area" |

---

## Korrekter Systemstand nach Sprint 3.7.7

### BIN-Modulliste (vollständig korrekt laut PO)

**1. Studienabschnitt – PFLICHT (Sem 1–3, 90 ECTS)**

| Kürzel | Name | Sem | ECTS | benotet | Gew. |
|---|---|---|---|---|---|
| BIN-100 | Mathematik 1 | 1 | 6 | ✅ | 1.0 |
| BIN-101 | Startprojekt | 1 | 4 | ✅ | 0.0 |
| BIN-102 | Programmieren 1 | 1 | 6 | ✅ | 1.0 |
| BIN-103 | Grundlagen der Informatik | 1 | 6 | ✅ | 1.0 |
| BIN-104 | Theoretische Informatik | 1 | 6 | ✅ | 1.0 |
| BIN-116 | Englisch | 1 | 2 | ✅ | 1.0 |
| BIN-105 | Mathematik 2 (Lin. Algebra) | 2 | 6 | ✅ | 1.0 |
| BIN-106 | Datenbanksysteme 1 | 2 | 6 | ✅ | 1.0 |
| BIN-107 | Statistik | 2 | 6 | ✅ | 1.0 |
| BIN-108 | Programmieren 2 | 2 | 6 | ✅ | 1.0 |
| BIN-109 | Algorithmen und Datenstrukturen | 2 | 6 | ✅ | 1.0 |
| BIN-110 | Programmieren 3 (C/C++) | 3 | 6 | ✅ | 1.0 |
| BIN-111 | Mathematik 3 (Analysis) | 3 | 6 | ✅ | 1.0 |
| BIN-112 | Betriebssysteme und Netze 1 | 3 | 6 | ✅ | 1.0 |
| BIN-113 | Datenbanksysteme 2 | 3 | 6 | ✅ | 1.0 |
| BIN-114 | Programmierprojekt | 3 | 4 | ❌ unbenotet | 0.0 |
| BIN-115 | Betriebswirtschaft | 3 | 2 | ✅ | 0.5 |

**2. Studienabschnitt – PFLICHT (Sem 4–6, 78 ECTS)**

| Kürzel | Name | Sem | ECTS | benotet | Gew. |
|---|---|---|---|---|---|
| BIN-200 | Computergrafik 1 | 4 | 6 | ✅ | 1.0 |
| BIN-201 | Software Engineering 1 | 4 | 6 | ✅ | 1.0 |
| BIN-202 | Betriebssysteme und Netze 2 | 4 | 6 | ✅ | 1.0 |
| BIN-203 | Webtechnologien | 4 | 6 | ✅ | 1.0 |
| BIN-204 | Seminar | 4 | 4 | ❌ unbenotet | 0.0 |
| BIN-205 | Software Engineering 2 | 5 | 6 | ✅ | 1.0 |
| BIN-206 | Praxisprojekt 1 | 5 | 10 | ❌ unbenotet | 0.0 |
| BIN-207 | Computergrafik 2 (Bildverarb.) | 5 | 6 | ✅ | 1.0 |
| BIN-208 | Praxisprojekt 2 | 6 | 7 | ❌ unbenotet | 0.0 |
| BIN-209 | Ergänzende Fächer | 4–6 | 6 | ✅ | 1.5 |
| BIN-210 | Bachelorarbeit mit Kolloquium | 6 | 15 | ✅ | 4.0 |

**WAHLPFLICHT (Sem 5–6, Student wählt genau 2 = 12 ECTS)**

| Kürzel | Name | ECTS | Gew. |
|---|---|---|---|
| BIN-211 | Computergrafik 3 (Animation) | 6 | 1.0 |
| BIN-212 | Software Engineering 3 | 6 | 1.0 |
| BIN-213 | Betriebssysteme und Netze 3 | 6 | 1.0 |
| BIN-214 | Datenbanksysteme 3 | 6 | 1.0 |
| BIN-215 | Parallele Programmierung | 6 | 1.0 |
| BIN-216 | Aktuelle Aspekte der Informatik 1 | 6 | 1.0 |
| BIN-217 | Aktuelle Aspekte der Informatik 2 | 6 | 1.0 |
| BIN-218 | Wissenschaftliches Arbeiten in der Informatik | 6 | 1.0 |
| BIN-219 | Kryptographie und Algorithmen | 6 | 1.0 |

**ECTS-Check:** 90 (Abschnitt 1) + 78 (Abschnitt 2) + 12 (WP) = 180 ECTS ✅

---

## Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| BIN-209 als PFLICHT-Container (Option A) | Einfachste MVP-Lösung: BIN-209 im Katalog, Fächer als custom ERGAENZEND. Kein neues Datenbankfeld nötig. |
| custom_ist_benotet auf StudentModule | Katalog-Module lesen `module.ist_benotet`, Custom-Module lesen `sm.custom_ist_benotet`. NULL = Katalog-Modul (ADR-017). |
| WAHLPFLICHT-Limit hardcoded = 2 | BIN PO erlaubt exakt 2 WP-Module (12 ECTS). Backend 409 + Frontend Warning. |

---

## Offene Punkte nach Sprint 3.7.7

Diese Punkte wurden bewusst nicht in diesem Sprint gelöst — Sprint 4 adressiert sie:

| Punkt | Priorität | Sprint |
|---|---|---|
| `pruefungsart` pro Modul (PX, EA, R, BAA+Ko) | P1 | Sprint 4 Phase 1 |
| Vorprüfungs-Milestone Dashboard-Widget | P1 | Sprint 4 Phase 2 |
| Semester-Tag im FAB dynamisch | P1 | Sprint 4 Phase 4 |
| `/api/me/profile` Proxy-Route anlegen | P1 | Sprint 4 Phase 4 |
| BIN-209 Sub-Modul-Katalog (7 offizielle Namen) | P2 | Sprint 4 Phase 3 |
| `sws` pro Modul | P2 | Sprint 4 Phase 1 |
| `module_prerequisites` Tabelle (ADR-010) | P2 | Sprint 4 Phase 5 |
| BIN-209 GPA-Beitrag korrekt berechnen | P2 | Sprint 4 Phase 5+ |
| HsH-Notenvalidierung (nur 1.0/1.3/1.7/…/5.0) | P2 | Sprint 4 Phase 6 |

---

## Metriken

| Metrik | Wert |
|---|---|
| Analysierte PDF-Seiten | 105 (76 + 9 + 20) |
| Korrigierte Module | 27 PFLICHT + 9 WAHLPFLICHT |
| Neu eingefügte Module | 2 (BIN-207, BIN-209) |
| Gelöschte Fake-Module | 5 |
| Neue DB-Spalten | 1 (custom_ist_benotet) |
| Geänderte Dateien | 8 |
| Migrations | 1 (0011) |
| Sprint-Dauer | 1 Tag |
