# PO Architecture Analysis — BIN 2019 & Ergänzende Fächer

**Stand:** 2026-05-07  
**Autor:** Yusef B. + Claude  
**Quelle:** Modulhandbuch BIN 19WS (29. April 2024), PO BIN 2019, ATPO-FIV 2025

> Dieses Dokument analysiert den aktuellen Zustand der Seed-Daten, beschreibt die korrekten BIN-Moduldaten aus der PO, und definiert die Architekturentscheidungen für Ergänzende Fächer und zukünftige Studiengänge.

> **Implementierungsstatus:** Phase 1–3 aus Abschnitt 6 wurden am 2026-05-07 abgeschlossen (Migration 0011).  
> Vollständiger Status aller umgesetzten und noch offenen Punkte: [`studiengang-implementation-status.md`](./studiengang-implementation-status.md)

---

## 1. Aktueller Zustand vs. korrekte PO-Daten

### Problem: Die Seed-Daten sind strukturell falsch

Die Migration `0003` (fix_module_data) hat eigene Kürzel eingeführt, die **nicht** dem offiziellen Modulhandbuch entsprechen:

| Aktuell in DB    | Offiziell laut PO | Problem |
|------------------|-------------------|---------|
| BIN-101          | BIN-102           | Falsche Nummer |
| BIN-103          | BIN-100           | Falsche Nummer |
| BIN-201          | BIN-108           | Falsche Nummer (2. Sem statt 2. Abschnitt) |
| BIN-301..BIN-306 | BIN-110..BIN-116  | Semester-Präfix-Schema statt fortlaufend |
| BIN-401..BIN-405 | BIN-200..BIN-204  | Falsche Nummerierung |
| BIN-501, BIN-601 | — (Platzhalter)   | Fiktive Module, nicht in der PO |
| BIN-212..BIN-218 | andere Namen       | BIN-212 = "Erweiterte Webentwicklung" (erfunden!) |

**Fehlende Module** (nicht im Seed, aber in der PO):
- `BIN-209` — Ergänzende Fächer (6 ECTS, PFLICHT, Sem 4–6)
- `BIN-207` — Computergrafik 2 (6 ECTS, PFLICHT, Sem 5) ← fehlt!

**Falsche WAHLPFLICHT-Namen** — aktuell erfunden, korrekte Namen:

| Kürzel | Aktuell (falsch) | Korrekt laut Modulhandbuch |
|--------|------------------|---------------------------|
| BIN-212 | Erweiterte Webentwicklung | Software Engineering 3 |
| BIN-213 | Machine Learning Grundlagen | Betriebssysteme und Netze 3 |
| BIN-214 | Mobile Computing | Datenbanksysteme 3 |
| BIN-215 | IT-Sicherheit | Parallele Programmierung |
| BIN-216 | Verteilte Systeme | Aktuelle Aspekte der Informatik 1 |
| BIN-217 | Cloud Computing | Aktuelle Aspekte der Informatik 2 |
| BIN-218 | Data Science | Wissenschaftliches Arbeiten in der Informatik |

---

## 2. Vollständige korrekte Modulliste BIN PO 2019

### 1. Studienabschnitt — PFLICHT (Sem 1–3, total 90 ECTS)

| Kürzel  | Name                           | Sem | ECTS | benotet | has_prereq | Prüfung |
|---------|--------------------------------|-----|------|---------|------------|---------|
| BIN-100 | Mathematik 1                   | 1   | 6    | true    | false      | Klausur/mdl. |
| BIN-101 | Startprojekt                   | 1   | 4    | true    | false      | Klausur/mdl. + exp. |
| BIN-102 | Programmieren 1                | 1   | 6    | true    | false      | Klausur/mdl. + exp. |
| BIN-103 | Grundlagen der Informatik      | 1   | 6    | true    | false      | Klausur/mdl. + exp. |
| BIN-104 | Theoretische Informatik        | 1   | 6    | true    | false      | Klausur/mdl. + exp. |
| BIN-116 | Englisch                       | 1   | 2    | true    | false      | Klausur/mdl. + Hausarbeit |
| BIN-105 | Mathematik 2 (Lin. Algebra)    | 2   | 6    | true    | false      | Klausur/mdl. + exp. |
| BIN-106 | Datenbanksysteme 1             | 2   | 6    | true    | false      | Klausur/mdl. + exp. |
| BIN-107 | Statistik                      | 2   | 6    | true    | false      | Klausur/mdl. + exp. |
| BIN-108 | Programmieren 2                | 2   | 6    | true    | false      | Klausur/mdl. + exp. |
| BIN-109 | Algorithmen und Datenstrukturen| 2   | 6    | true    | false      | Klausur/mdl. + exp. |
| BIN-110 | Programmieren 3 (C/C++)        | 3   | 6    | true    | false      | Klausur/mdl. + exp. |
| BIN-111 | Mathematik 3 (Analysis)        | 3   | 6    | true    | false      | Klausur/mdl. + exp. |
| BIN-112 | Betriebssysteme und Netze 1    | 3   | 6    | true    | false      | Klausur/mdl. + exp. |
| BIN-113 | Datenbanksysteme 2             | 3   | 6    | true    | false      | Klausur/mdl. + exp. |
| BIN-114 | Programmierprojekt             | 3   | 4    | **false** | false    | Experimentelle Arbeit |
| BIN-115 | Betriebswirtschaft             | 3   | 2    | true    | false      | Klausur/mdl. + exp. |

**Summe Sem 1–3: 30 + 30 + 30 = 90 ECTS**

> BIN-114 (Programmierprojekt) und BIN-116 (Englisch) haben gewichtung=0.0 (fließen nicht in GPA ein).

### 2. Studienabschnitt — PFLICHT (Sem 4–6, total 78 ECTS)

| Kürzel  | Name                           | Sem | ECTS | benotet | has_prereq | Voraussetzung laut PO |
|---------|--------------------------------|-----|------|---------|------------|-----------------------|
| BIN-200 | Computergrafik 1               | 4   | 6    | true    | **true**   | Alle Prüfungen Sem 1 |
| BIN-201 | Software Engineering 1         | 4   | 6    | true    | **true**   | Alle Prüfungen Sem 1 |
| BIN-202 | Betriebssysteme und Netze 2    | 4   | 6    | true    | **true**   | Alle Prüfungen Sem 1 |
| BIN-203 | Webtechnologien                | 4   | 6    | true    | **true**   | Alle Prüfungen Sem 1 |
| BIN-204 | Seminar                        | 4   | 4    | **false** | **true**  | Alle Prüfungen Sem 1 (Referat) |
| BIN-205 | Software Engineering 2         | 5   | 6    | true    | **true**   | Alle Prüfungen Sem 1+2 |
| BIN-206 | Praxisprojekt 1                | 5   | 10   | **false** | **true**  | Alle Prüfungen Sem 1–3 |
| BIN-207 | Computergrafik 2 (Bildverarb.) | 5   | 6    | true    | **true**   | Alle Prüfungen Sem 1+2 |
| BIN-208 | Praxisprojekt 2                | 6   | 7    | **false** | **true**  | Alle Prüfungen Sem 1–3 |
| BIN-209 | Ergänzende Fächer              | 4–6 | 6    | true    | false      | keine (Sonderfall, s.u.) |
| BIN-210 | Bachelorarbeit mit Kolloquium  | 6   | 15   | true    | **true**   | Vorprüfung + 134 CP |

**Summe 2. Abschnitt PFLICHT: 6+6+6+6+4+6+10+6+7+6+15 = 78 ECTS**

### WAHLPFLICHT (Sem 5–6, Student wählt genau 2 = 12 ECTS)

| Kürzel  | Name                                     | Sem | ECTS | has_prereq |
|---------|------------------------------------------|-----|------|------------|
| BIN-211 | Computergrafik 3 (Animation)             | 5–6 | 6    | true |
| BIN-212 | Software Engineering 3                   | 5–6 | 6    | true |
| BIN-213 | Betriebssysteme und Netze 3              | 5–6 | 6    | true |
| BIN-214 | Datenbanksysteme 3                       | 5–6 | 6    | true |
| BIN-215 | Parallele Programmierung                 | 5–6 | 6    | true |
| BIN-216 | Aktuelle Aspekte der Informatik 1        | 5–6 | 6    | true |
| BIN-217 | Aktuelle Aspekte der Informatik 2        | 5–6 | 6    | true |
| BIN-218 | Wissenschaftliches Arbeiten in der Inf. | 5–6 | 6    | true |
| BIN-219 | Kryptographie und Algorithmen            | 5–6 | 6    | true |

**ECTS-Check: 90 (Abschnitt 1) + 78 (Abschnitt 2) + 12 (WP) = 180 ECTS ✓**

---

## 3. BIN-209 "Ergänzende Fächer" — Architekturentscheidung

### Was die PO sagt
- BIN-209 ist ein **PFLICHT**-Modul mit **6 ECTS** (Kürzel: BIN-EF)
- Laufzeit: **3 Semester** (Sem 4–6 zusammen)
- Student muss **3 Fächer** aus einem variierenden Angebot wählen
- Mindestens **1 Fach aus dem BWL-Bereich** (z.B. "Erg. Fach BWL")
- Jedes Fach = 2 ECTS (6 / 3 = 2 ECTS pro Fach)
- Keine formale Vorprüfungs-Voraussetzung

### Optionen

**Option A: BIN-209 als Katalog-PFLICHT, Fächer als ERGAENZEND (Empfohlen für MVP)**
- BIN-209 bleibt als PFLICHT-Modul im Katalog (6 ECTS, Sem 4, semester_empfehlung=4)
- Jedes Ergänzende Fach wird als **custom ERGAENZEND** mit 2 ECTS hinzugefügt
- StudentModule: custom_name="Erg. Fach BWL", custom_ects=2, custom_ist_benotet=true/false
- UI erklärt: "BIN-209 erfordert 3 Ergänzende Fächer (mind. 1 BWL-Fach). Füge sie unten hinzu."
- **Pro**: Einfach, kein neues Datenbankfeld
- **Con**: Keine Datenbank-Verknüpfung zwischen dem ERGAENZEND und BIN-209

**Option B: BIN-209 entfällt, 3 ERGAENZEND-Slots**
- BIN-209 aus dem PFLICHT-Katalog streichen
- Student muss 3 custom ERGAENZEND-Module (je 2 ECTS) manuell anlegen
- **Pro**: Flexibel
- **Con**: Kein Tracking, ob die BWL-Anforderung erfüllt ist

**Option C: parent_module_id auf StudentModule**
- Zu komplex für Sprint 4 — überspringen

### Entscheidung: Option A (MVP)
BIN-209 bleibt im Katalog als PFLICHT. Die einzelnen Ergänzenden Fächer (z.B. "Erg. Fach BWL") werden als **custom ERGAENZEND** à 2 ECTS hinzugefügt. Das ist exakt das, was der Nutzer gerade braucht.

---

## 4. `ist_benotet` für Custom-Module — DB-Änderung

### Problem
Das Feld `ist_benotet` liegt aktuell nur auf der `Module`-Tabelle (für Katalog-Module). Custom-Module (ERGAENZEND mit custom_name) haben kein eigenes `ist_benotet`-Feld auf `StudentModule`.

### Lösung: Migration 0011 — `custom_ist_benotet` auf StudentModule

```sql
ALTER TABLE student_modules ADD COLUMN custom_ist_benotet BOOLEAN;
```

- `NULL` = nicht relevant (Katalog-Modul, nimmt `module.ist_benotet`)
- `TRUE` = custom-Modul ist benotet
- `FALSE` = custom-Modul ist unbenotet

**Backend-Logik:**
```python
# In _build_sm_response:
ist_benotet_resolved = (
    module.ist_benotet if module
    else (sm.custom_ist_benotet if sm.custom_ist_benotet is not None else True)
)
```

**Frontend (AddModuleModal):**
- Checkbox "Benotet?" erscheint nur für custom ERGAENZEND-Module
- Default: checked (true), da die meisten Ergänzenden Fächer benotet sind

---

## 5. Multi-Program-Architektur — Isolation sicherstellen

### Aktueller Stand (korrekt)
Das DB-Schema ist bereits richtig für Multi-Program:
```
University → Faculty → Program → ExamRegulation → Module[]
User → UserProgram → ExamRegulation (1:1 pro User)
User → StudentModule[] (alle Module des Users)
```

Isolation ist durch ExamRegulation gewährleistet: Jeder Studiengang hat seinen eigenen ExamReg-Eintrag und damit separate Module. Keine zwei Programme teilen sich Module.

### Potenzielle Schwachstelle
`StudentModule` hat keine direkte FK auf `UserProgram`. Wenn ein User den Studiengang wechselt (PUT /me/program), bleiben die alten StudentModules erhalten. Das ist **gewollt** (Bestandsschutz für bereits erfasste Noten), könnte aber bei vollständigem Programmwechsel problematisch werden.

**Empfehlung für jetzt**: Kein Handlungsbedarf. Wenn Multi-Program für einen User nötig wird (unwahrscheinlich), dann `user_program_id` FK auf StudentModule hinzufügen.

### Neue Programme hinzufügen (z.B. MDI, Master)
Prozess:
1. Neuer Eintrag in `programs` (z.B. "Medieninformatik und Interaktives Entertainment", abschluss="Bachelor")
2. Neuer Eintrag in `exam_regulations`
3. Neue Einträge in `modules` (komplett eigene Module-Nummern, z.B. MDI-100 ff.)
4. Neue Migration mit den Seed-Daten

**Kein Code-Change nötig** — das Schema skaliert bereits. Nur Seed-Daten.

### Modultyp-Semantik ist universell
`PFLICHT / WAHLPFLICHT / ERGAENZEND` gilt für alle Programme. Die Bedeutung ist:
- PFLICHT: Automatisch beim Programm-Select angelegt
- WAHLPFLICHT: Student wählt aus dem Katalog
- ERGAENZEND: Freitextmodul (custom) oder aus separatem Katalog

---

## 6. Was muss implementiert werden (Sprint 4 — PO-Fix)

### Phase 1: Seed-Daten korrigieren (Migration 0011)

**Schritt 1:** Alle PFLICHT-Module auf korrekte Kürzel/Namen bringen
- `UPDATE modules SET kuerzel='BIN-100' WHERE name='Mathematik 1'` etc.
- Korrekte `semester_empfehlung` setzen (derzeit evtl. falsch)
- Korrekte `ist_benotet` setzen (BIN-114, BIN-204, BIN-206, BIN-208 → false)
- Korrekte `gewichtung` setzen (BIN-114 → 0.0, BIN-204 → 0.0, etc.)

**Schritt 2:** Fehlende Module einfügen
- `BIN-207 Computergrafik 2` (Sem 5, 6 ECTS, benotet=true, has_prereq=true)
- `BIN-209 Ergänzende Fächer` (Sem 4, 6 ECTS, benotet=true, has_prereq=false)
  - semester_empfehlung = 4 (erster möglicher Semester)

**Schritt 3:** WAHLPFLICHT-Katalog korrigieren
- Namen auf korrekte PO-Namen setzen (BIN-212 = "Software Engineering 3" etc.)
- has_prerequisites = true für alle
- semester_empfehlung = NULL (Sem 5-6, kein fester Empfehlungs-Semester)

**Schritt 4:** Alte Platzhalter entfernen
- DELETE Module mit kuerzel IN ('BIN-501', 'BIN-601') — fiktive Platzhalter

**Schritt 5:** `custom_ist_benotet` Spalte auf student_modules (neue Column, nullable)

### Phase 2: Backend-Anpassungen

- `UpdateModuleRequest`: `custom_ist_benotet: Optional[bool] = None` hinzufügen
- `StudentModuleResponse`: `custom_ist_benotet: Optional[bool]` hinzufügen
- `_build_sm_response`: `custom_ist_benotet=sm.custom_ist_benotet` serialisieren
- GPA-Berechnung: `ist_benotet` resolving — wenn custom-Modul, dann `custom_ist_benotet`
- `AddModuleRequest`: `custom_ist_benotet: Optional[bool] = None` hinzufügen

### Phase 3: Frontend-Anpassungen

**AddModuleModal** (ERGAENZEND custom):
- Checkbox "Benotet?" nur für custom ERGAENZEND-Module sichtbar
- Default: true

**types/study.ts**:
- `custom_ist_benotet: boolean | null` zu `StudentModuleResponse` hinzufügen

---

## 7. Datenmigrations-Strategie (kein Datenverlust)

Da der User bereits echte Daten (82 StudentModules nach Reset) hat:

1. Migration läuft als reines UPDATE/INSERT — kein DELETE der StudentModules
2. Die Module-Namen/-Kürzel werden geändert, StudentModule-FK (`module_id`) bleibt gültig
3. Nur die fiktiven Platzhalter-Module (BIN-501, BIN-601) werden gelöscht — aber diese haben keine StudentModules, da sie nie vom System automatisch angelegt wurden (WAHLPFLICHT = muss manuell hinzugefügt werden)
4. `custom_ist_benotet` = nullable → keine Default-Probleme

---

## 8. Offene Fragen (vor Implementierung klären)

1. **semester_empfehlung für multi-Semester-Module (BIN-209: Sem 4-6, WP: Sem 5-6):**
   - Aktuell: Single Integer. Setzen wir `semester_empfehlung=4` für BIN-209 und `semester_empfehlung=5` für WP?
   - Alternative: NULL (landet in "Ungeplant" im StudyPlanBoard) — unschön
   - **Empfehlung**: Ersten Semester des Bereichs verwenden (BIN-209→4, WP→5)

2. **BIN-210 Bachelorarbeit — GPA-Gewichtung:**
   - Laut PO: "Bestandene Vorprüfung + mind. 134 CP" als Voraussetzung
   - gewichtung = 4.0 (wie bisher gesetzt) — korrekt?

3. **has_prerequisites = TRUE für 1. Abschnitt?**
   - Laut 0003-Migration: ALL PFLICHT/WP modules have has_prerequisites=TRUE
   - Aber 1. Abschnitt-Module haben KEINE formalen PO-Voraussetzungen
   - **Fix**: has_prerequisites=false für BIN-100 bis BIN-116, has_prerequisites=true für BIN-200+

---

## 9. Zusammenfassung: Was ändert sich

| Bereich | Jetzt | Nach Fix |
|---------|-------|----------|
| Kürzel | BIN-101..BIN-603 (falsch) | BIN-100..BIN-219 (korrekt) |
| WAHLPFLICHT-Namen | Erfunden | Laut Modulhandbuch |
| BIN-209 | Fehlt | Vorhanden als PFLICHT |
| BIN-207 | Fehlt | Vorhanden als PFLICHT |
| ist_benotet | Alle=true | BIN-114, 204, 206, 208 = false |
| has_prerequisites | Alle PFLICHT=true | Nur BIN-200+ = true |
| Custom-Module benotet | Nicht konfigurierbar | custom_ist_benotet Checkbox |
| Multi-Program | Bereits isoliert ✓ | Kein Change needed |
