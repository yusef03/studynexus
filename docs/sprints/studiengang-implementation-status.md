# Studiengang-Implementierung — Vollständiger Status

**Letzte Aktualisierung:** 2026-05-07 (Feierabend-Stand)  
**Autor:** Yusef B. + Claude

---

## Welche Datei ist wofür? (Navigationshilfe)

| Datei | Zweck |
|---|---|
| **diese Datei** | Lebendiger Status: was gemacht, was offen, was als nächstes |
| `po-architecture-analysis.md` | Historisches Analysedokument (Basis war die PO-PDF-Lektüre). Enthält die vollständige korrekte Modulliste und die Architekturentscheidungen (BIN-209, custom_ist_benotet, Multi-Program). Nicht mehr aktiv bearbeiten. |
| `sprint-plan.md` | Sprint-Übersicht mit User Stories und erledigten Tasks pro Sprint |
| `../architecture/decisions.md` | ADR-001 bis ADR-017: alle Architekturentscheidungen mit Begründung |
| `ANTIGRAVITY.md` (Root) | Projekt-Gedächtnis für AI: Tech Stack, Rules, API, Migrations, offene Punkte |

---

## Was in dieser Session gemacht wurde (2026-05-07)

### Schritt 1: PO-Analyse (Vorsession)
- Alle 76 Seiten des Modulhandbuchs BIN 19WS gelesen
- PO BIN 2019 und ATPO-FIV 2025 gelesen
- `po-architecture-analysis.md` erstellt mit vollständiger Modulliste und Architekturentscheidungen

### Schritt 2: Migration 0011 ✅
**Datei:** `backend/alembic/versions/2026_05_07_0011_fix_bin_modules_and_add_custom_ist_benotet.py`

Was die Migration macht:
- `custom_ist_benotet BOOLEAN NULLABLE` auf `student_modules` hinzugefügt
- Fake-Platzhaltermodule gelöscht: "Ergänzendes Fach BWL", "Ergänzendes Fach 1", "Ergänzendes Fach 2", "Wahlpflichtfach Informatik 1", "Wahlpflichtfach Informatik 2" (inkl. zugehörige StudentModule-Einträge)
- Alle 27 PFLICHT-Module korrigiert: kuerzel (BIN-100..BIN-210), ects, ist_benotet, has_prerequisites, gewichtung, semester_empfehlung
- Alle 9 WAHLPFLICHT-Module korrigiert: echte PO-Namen, semester_empfehlung=5, has_prerequisites=TRUE
- BIN-209 "Ergänzende Fächer" (PFLICHT, 6 ECTS, Sem 4) eingefügt
- BIN-209 automatisch für alle bestehenden User mit BIN-Programm provisioniert

### Schritt 3: Backend — custom_ist_benotet ✅
- **`backend/app/models/student_module.py`:** `custom_ist_benotet = Column(Boolean, nullable=True)` hinzugefügt
- **`backend/app/schemas/study_plan.py`:** `custom_ist_benotet: Optional[bool]` in `StudentModuleResponse`, `AddModuleRequest`, `UpdateModuleRequest`
- **`backend/app/routers/study_plan.py`:** 
  - `add_module()`: speichert `custom_ist_benotet`
  - `update_module()`: aktualisiert via `model_fields_set`
  - `_build_sm_response()`: serialisiert `custom_ist_benotet`

### Schritt 4: Backend — WAHLPFLICHT-Limit ✅
- **`backend/app/routers/study_plan.py`** in `add_module()`: Wenn User versucht mehr als 2 WAHLPFLICHT-Module hinzuzufügen → HTTP 409 "Wahlpflicht limit reached"

### Schritt 5: Frontend — Typen & Hook ✅
- **`frontend/src/types/study.ts`:** `custom_ist_benotet: boolean | null` auf `StudentModuleResponse`
- **`frontend/src/hooks/queries/useAddModule.ts`:** `custom_ist_benotet?: boolean` in `AddPayload`

### Schritt 6: Frontend — ModuleModal Bug-Fix ✅
- **`frontend/src/components/study/ModuleModal.tsx`:** Zeile 36 war `sm.module?.ist_benotet ?? false` → Custom-Module (module=null) zeigten immer "unbenotet", Notenfeld war nicht sichtbar.
  - Fix: `const isBenotet = sm.module !== null ? sm.module.ist_benotet : (sm.custom_ist_benotet ?? true)`

### Schritt 7: Frontend — AddModuleModal ✅
- **`frontend/src/components/study/AddModuleModal.tsx`:**
  - Neuer State: `customIsGraded` (default: true)
  - "Benotet?" Checkbox im Custom-Modus — übergibt `custom_ist_benotet` an Backend
  - `wahlpflichtCount?: number` Prop (optional, default 0)
  - Bei `wahlpflichtCount >= 2`: amber Warning-Banner statt Dropdown, "Hinzufügen" deaktiviert
  - Im Custom-Modus: BIN-209 Hinweis-Text (`ergaenzendHint`)

### Schritt 8: Frontend — ModuleList ✅
- **`frontend/src/components/study/ModuleList.tsx`:**
  - Berechnet `wahlpflichtCount` aus allen StudentModules (`sm.module?.modul_typ === "WAHLPFLICHT"`)
  - Übergibt `wahlpflichtCount` an `AddModuleModal`

### Schritt 9: i18n ✅
- **`de.json`** unter `dashboard.addModule`:
  - `"isGraded": "Benotet"`
  - `"wahlpflichtFull": "Limit erreicht – laut PO sind genau 2 Wahlpflichtmodule (12 ECTS) vorgesehen"`
  - `"ergaenzendHint": "BIN-209 Ergänzende Fächer: Füge hier 3 eigene Module (je 2 ECTS) hinzu – mind. 1 aus dem BWL-Bereich"`
- **`en.json`** analog

### Schritt 10: Dokumentation ✅
- `docs/sprints/studiengang-implementation-status.md` erstellt (diese Datei)
- `docs/sprints/sprint-plan.md` aktualisiert: Sprint 3.7.7 eingetragen
- `docs/architecture/decisions.md` aktualisiert: ADR-017 für custom_ist_benotet
- `docs/sprints/po-architecture-analysis.md` Status-Banner hinzugefügt
- `ANTIGRAVITY.md` aktualisiert: Migration 0011, offene Punkte, Known Limitations

---

## Aktueller Systemstand (vollständig, Stand Feierabend 2026-05-07)

### Datenbank (PostgreSQL)

```
student_modules Tabelle — neue Spalten seit Sprint 3.7.x:
  plan_semester        VARCHAR  NULLABLE  (StudyPlanBoard-Only, Migration 0010)
  custom_ist_benotet   BOOLEAN  NULLABLE  (Custom ERGAENZEND, Migration 0011)

modules Tabelle — nach Migration 0011:
  28 PFLICHT:   BIN-100..BIN-116 (Sem 1-3), BIN-200..BIN-210 (Sem 4-6) — alle korrekt
   9 WAHLPFLICHT: BIN-211..BIN-219 — echte PO-Namen, sem=5
   0 ERGAENZEND: Leer (wird von Studierenden als Custom-Module angelegt)
```

### BIN-Moduldaten — vollständig korrekt laut PO ✅

| Was | Korrekt? |
|---|---|
| Kürzel (BIN-100..BIN-219) | ✅ |
| ECTS aller Module | ✅ |
| semester_empfehlung | ✅ |
| ist_benotet (inkl. BIN-114, 204, 206, 208 = false) | ✅ |
| has_prerequisites (1. Abschnitt=false, 2. Abschnitt=true) | ✅ |
| gewichtung (BA=4.0, Startprojekt=0, etc.) | ✅ |
| WAHLPFLICHT-Namen laut Modulhandbuch | ✅ |
| BIN-209 "Ergänzende Fächer" vorhanden | ✅ |

### Backend-API — was funktioniert

| Endpoint | Funktion | Status |
|---|---|---|
| `POST /me/modules` | Modul hinzufügen — WAHLPFLICHT-Limit (max 2) wird mit 409 durchgesetzt | ✅ |
| `PUT /me/modules/{id}` | Modul aktualisieren — `custom_ist_benotet` via `model_fields_set` schreibbar | ✅ |
| `GET /me/modules` | Alle Module — `custom_ist_benotet` wird serialisiert | ✅ |
| `GET /me/stats` | GPA, ECTS, Fortschritt — custom Module (module_id=null) korrekt ausgeschlossen | ✅ |

### Frontend — was funktioniert

| Komponente | Funktion | Status |
|---|---|---|
| `ModuleList` | Berechnet wahlpflichtCount, zeigt alle Module | ✅ |
| `ModuleModal` | Noteneingabe korrekt für custom Module (custom_ist_benotet statt module.ist_benotet) | ✅ |
| `AddModuleModal` — WAHLPFLICHT-Modus | Zeigt amber Warning + deaktiviert Button wenn 2 bereits vorhanden | ✅ |
| `AddModuleModal` — Custom-Modus | Zeigt BIN-209 Hinweis + Benotet-Checkbox + übergibt custom_ist_benotet | ✅ |
| `StudyPlanBoard` | DnD mit @dnd-kit, plan_semester getrennt von semester | ✅ |
| `MobileQuickAdd FAB` | Versteckt sich auf /settings, /profile, /setup | ✅ |

---

## Was noch offen ist

### P1 — Wichtig, aber kein Blocker

#### 1. Vorprüfungs-Milestone im Dashboard
Die BIN PO definiert zwei wichtige ECTS-Schwellen:
- **Vorprüfung** (Zugang zum 2. Studienabschnitt): Alle Prüfungen aus Sem 1 bestanden
- **BA-Zulassung**: Vorprüfung + mind. 134 CP

**Was fehlt:** Dashboard-Widget das diese Meilensteine trackt und visuell zeigt (z.B. "Vorprüfung: 7/6 Prüfungen — ✅ bestanden" oder "134 CP für BA: 112/134")

**Was zu tun ist:**
- `GET /me/stats` um `vorpruefung_bestanden: bool` und `ects_fuer_ba_eligible: bool` erweitern
- Dashboard-Widget anpassen

**Dateien:** `backend/app/routers/stats.py`, `backend/app/schemas/study_plan.py`, Dashboard-Seite

#### 2. Semester-Tag im FAB hardcoded
`MobileQuickAdd` hat den Semester-Tag "WiSe2425" hardcoded. Sollte aus User-Profil oder einer Config kommen.

**Was zu tun ist:** `start_semester` aus `GET /me/program` Response lesen und als Default im FAB verwenden.

**Dateien:** `frontend/src/components/mission/MobileQuickAdd.tsx`

### P2 — Tech Debt

#### 3. `/api/me/profile` Route fehlt im Next.js Proxy
MobileQuickAdd versucht `/api/me/profile` aufzurufen, aber diese Route existiert nicht im Next.js API-Proxy.

**Was zu tun ist:** `frontend/src/app/api/me/profile/route.ts` anlegen (GET + PUT, analog zu anderen Proxy-Routes).

#### 4. `module_prerequisites` Tabelle (ADR-010) nie gebaut
ADR-010 definierte eine Tabelle für granulare Voraussetzungsprüfung. Aktuell ist `has_prerequisites` nur ein Boolean ohne Detail.

**Was zu tun ist:** Tabelle erstellen, BIN-Voraussetzungen eintragen (z.B. "BIN-200 braucht alle Prüfungen aus Sem 1"). Erst sinnvoll wenn Admin-Panel existiert (Sprint 5).

### P3 — Zukunft

#### 5. Weitere HsH-Studiengänge
Aktuell in DB: nur BIN. Laut ATPO-FIV 2025 gibt es in Fakultät IV:
- MDI (Medieninformatik und Interaktives Entertainment, Bachelor)
- MIN (Master Informatik)
- MMI (Master Medieninformatik)
- BWL (Betriebswirtschaftslehre, Bachelor)

**Prozess:** PO-PDF lesen → Analyse-Dokument → neue Alembic-Migration mit Seed-Daten. Kein Code-Change nötig (Schema ist multi-program-fähig).

#### 6. Prüfungsarten pro Modul
Das Modulhandbuch enthält Prüfungsarten (Klausur, mündliche Prüfung, experimentelle Arbeit, Hausarbeit, Referat). Diese sind aktuell nicht in der DB gespeichert. Benötigt für das Modul-Wiki (Sprint 4).

---

## Nächste Sprints — Überblick

### Sprint 4 — Community & Collaboration
- Modul-Wiki (Modulbeschreibungen, Prüfungsarten, Bewertungen)
- Anonyme Modulevaluationen (DSGVO-konform)
- PDF-Upload und -Sharing (verschlüsselt)
- Study Spaces (digitale Lerngruppen mit geteiltem Kanban)

### Sprint 5 — Gamification & Admin
- XP-System, Badges, Streaks, Leaderboard
- Skill-Tree Visualisierung (interaktiver Modul-Abhängigkeitsgraph)
- LangChain / Claude API Integration (PDF-Analyse, Karteikarten)
- Admin-Panel (Yusef-only) für PO-Verwaltung → ersetzt manuelle Alembic-Migrationen
- Weitere HsH-Studiengänge (MDI zuerst)
- module_prerequisites Tabelle + BIN-Daten eintragen
- Push-Notifications für Deadlines

### Sprint 6 — PWA & Launch
- Service Worker, Offline-Cache, Lighthouse PWA ≥ 90
- GitHub Actions CI/CD
- Cloud Deployment (Railway oder Render)
- Security Audit (OWASP Top 10)
- Landing Page

---

## Neue Ideen (gesammelt, noch nicht priorisiert)

- **Vorprüfungs-Dashboard-Widget** → P1, kommt in Sprint 4 Phase 2
- **GPA-Prognose:** Wenn Student alle offenen Module mit einer bestimmten Note besteht, was wäre der End-GPA? ("Was-wäre-wenn"-Rechner)
- **Semester-Planung Export:** StudyPlanBoard als PDF/ICS exportieren
- **Notifikation bei Klausur-Nähe:** 7 Tage vorher Push-Notification via Service Worker
- **Auto-Suggest für Ergänzende Fächer:** Basierend auf WAHLPFLICHT-Auswahl passende Ergänzende Fächer vorschlagen (KI, Sprint 5)
- **Stundenplan-Import:** ICS/Excel-Import für HsH-Stundenplan statt manueller Eingabe

---

## Neue Erkenntnisse aus erneuter PDF-Analyse (2026-05-08)

Vollständige Neulektüre aller drei PDFs (105 Seiten gesamt). Erkenntnisse für Sprint 4:

### 1. Prüfungsarten (pruefungsart) — FEHLT in DB

Die ATPO-FIV 2025 §7 und PO BIN 2019 Anlage B1/B2 definieren Prüfungsarten pro Modul:

| Code | Bezeichnung | BIN-Module |
|---|---|---|
| PX | Prüfung (Klausur oder mündl., 90 Min.) | Alle Standard-Module |
| EA | Experimentelle Arbeit | BIN-114, BIN-206, BIN-208 |
| R | Referat | BIN-204 |
| BAA+Ko | Bachelorarbeit mit Kolloquium | BIN-210 |

**Aktion Sprint 4 Phase 1:** Migration 0012 + `pruefungsart` Feld auf `modules`

### 2. Zulassungsregeln (PO BIN 2019 §6) — genauer als bisher dokumentiert

```
§6 Abs. 1:
  - Allgemeine Voraussetzung: BIN-116 (Englisch) muss bestanden sein
  - Sem 4: alle Prüfungsleistungen des 1. Semesters bestanden
  - Sem 5: alle Prüfungsleistungen des 1. UND 2. Semesters bestanden
  - Sem 6: Bachelor-Vorprüfung bestanden (= alle Sem 1-3)
  - BIN-206 (Praxisprojekt 1): Bachelor-Vorprüfung
  - BIN-209 (Ergänzende Fächer): KEINE Voraussetzung, jederzeit!

§6 Abs. 2:
  - Bachelor-Arbeit (BIN-210): Vorprüfung + mind. 134 Credits bestanden
```

**Aktion Sprint 4 Phase 2:** Stats-Endpunkt + Dashboard-Widget

### 3. BIN-209 Sub-Module — offizielle Namen laut PO

PO BIN 2019 Anlage B2 zeigt 7 offizielle Teilmodule (WP innerhalb BIN-209, Student wählt 3):

| TM-Kürzel | Name | Typ | Sem | ECTS |
|---|---|---|---|---|
| BIN-209-01 | Ergänzendes Fach A | WP | 4-6 | 2 |
| BIN-209-02 | Ergänzendes Fach B | WP | 4-6 | 2 |
| BIN-209-03 | Ergänzendes Fach C | WP | 4-6 | 2 |
| BIN-209-04 | Ergänzendes Fach D | WP | 4-6 | 2 |
| BIN-209-05 | Ergänzendes BWL-Fach A | WP | 4-6 | 2 |
| BIN-209-06 | Ergänzendes BWL-Fach B | WP | 4-6 | 2 |
| BIN-209-07 | Ergänzendes BWL-Fach C | WP | 4-6 | 2 |

**Aktion Sprint 4 Phase 3:** AddModuleModal mit Dropdown-Auswahl dieser 7 Namen

### 4. Notenystem (ATPO-FIV 2025 §10) — Validierung fehlt

Erlaubte Noten: 1,0 | 1,3 | 1,7 | 2,0 | 2,3 | 2,7 | 3,0 | 3,3 | 3,7 | 4,0 | 5,0

Aktuell: Backend akzeptiert beliebige Dezimalzahlen als Note. Student könnte 1.5 eingeben.

**Aktion Sprint 4 Phase 6:** Pydantic-Validator + Frontend-Dropdown mit 11 Optionen

### 5. BIN-209 GPA-Beitrag — aktuell falsch

BIN-209 hat `gewichtung = 1.5` in der DB. Die Custom-ERGAENZEND-Sub-Module werden aber aktuell von der GPA-Berechnung ausgeschlossen (`module_id=null` → kein GPA-Beitrag).

**Korrekt laut PO:** Benotete Ergänzende Fächer fließen in BIN-209-Modulnote ein (Durchschnitt der 3 gewählten Fächer), dann BIN-209-Note × gewichtung=1.5 in Gesamt-GPA.

**Aktion Sprint 4 Phase 5+:** GPA-Logik für ERGAENZEND-Module korrigieren (verknüpft mit module_prerequisites-Tabelle)

### 6. SWS (Semesterwochenstunden) — fehlt in DB

Modulhandbuch BIN 19WS enthält SWS pro Modul (meist 4 SWS = "Vorlesung mit Übung / 4 SWS").

**Aktion Sprint 4 Phase 1:** `sws SMALLINT NULLABLE` auf `modules` (Migration 0012)
