# Admin PO-Verwaltung — Detaillierte Use Cases

*Erstellt: 2026-05-10 (Sprint 5 Phase 9)*  
*Betroffene Seiten: `/admin/universities`, `/admin/programs`, `/admin/exam-regulations`, `/admin/modules`*

---

## Überblick

Phase 9 liefert das vollständige Frontend für die **Prüfungsordnungs-Verwaltung** (PO-Verwaltung) im Admin-Panel. Admins können damit die komplette Hierarchie `Hochschule → Fakultät → Studiengang → Prüfungsordnung → Modul → Voraussetzung` über eine professionelle, mobile-taugliche UI pflegen — ohne direkten DB-Zugriff.

---

## Datenhierarchie

```
Hochschule (University)
└── Fakultät (Faculty)         [1..N pro Hochschule]
    └── Studiengang (Program)  [1..N pro Fakultät]
        └── Prüfungsordnung    [1..N pro Studiengang]
            └── Modul          [1..N pro PO]
                └── Voraussetzung [0..N pro Modul]
```

**Archivierung** (Soft Delete) ist möglich auf: Studiengang, Prüfungsordnung, Modul.  
**Hartes Löschen** ist möglich bei: Hochschule (nur wenn keine Fakultäten), Fakultät, Voraussetzung.

---

## Navigation (Routing)

```
/admin
  /universities                → UC-A01, UC-A02
    /[id]                      → UC-A03, UC-A04, UC-A05, UC-A06
  /programs                    → UC-A07, UC-A08
    /[id]                      → UC-A09, UC-A10, UC-A11, UC-A12, UC-A13
  /exam-regulations
    /[id]                      → UC-A14, UC-A15, UC-A16, UC-A17, UC-A18
  /modules                     → UC-A25
    /[id]                      → UC-A19, UC-A20, UC-A21, UC-A22, UC-A23, UC-A24
```

**Breadcrumb-Navigation:** Jede Detailseite hat einen "Zurück"-Link zur übergeordneten Seite.

---

## Vorbedingungen (für alle Use Cases)

1. Benutzer ist eingeloggt mit einem Account, der `is_admin = true` im JWT-Payload hat
2. Middleware `/admin/*` prüft `is_admin` aus dem Cookie-JWT und gibt sonst `403` zurück
3. Für **destruktive Operationen** (Archivieren, Löschen, Wiederherstellen) ist zusätzlich eine aktive **Admin-Session** nötig:
   - Admin-Session wird über `/admin/auth/session` (Re-Authentifizierung) erzeugt
   - Der Session-Token liegt im localStorage als `admin_token`
   - TTL: 15 Minuten (Redis-basiert)
   - Die UI zeigt einen roten Warntext "Keine aktive Admin-Session" wenn kein Token vorhanden oder abgelaufen

---

## Hochschulen (Universities)

### UC-A01 — Hochschulübersicht anzeigen

**Seite:** `/admin/universities`  
**Akteur:** Admin  
**Vorbedingung:** Admin ist eingeloggt

**Ablauf:**
1. Admin navigiert über die Sidebar zu "Hochschulen"
2. System lädt alle Hochschulen via `GET /api/admin/universities`
3. Während des Ladens: 3 Skeleton-Karten mit `animate-pulse`-Animation
4. Nach dem Laden: Liste aller Hochschulen als klickbare Karten
5. Jede Karte zeigt: Name (fett), Kürzel · Stadt · Typ (z.B. `HsH · Hannover · FH`)
6. Pfeil-Icon (`→`) rechts signalisiert Navigierbarkeit

**Suche:**
- Suchfeld oben: Live-Filter über Name UND Kürzel (case-insensitive)
- Filter läuft clientseitig auf den geladenen Daten
- Kein API-Call bei Eingabe
- Keine Ergebnisse: Platzhaltertext statt leerer Liste

**API:** `GET /api/admin/universities` → `AdminUniversity[]`  
**Query Key:** `["admin-universities"]` · staleTime: 60s

---

### UC-A02 — Neue Hochschule anlegen

**Seite:** `/admin/universities`  
**Akteur:** Admin  
**Auslöser:** Button "+ Hochschule anlegen" oben rechts

**Ablauf:**
1. Admin klickt "+ Hochschule anlegen"
2. `AdminFormModal` öffnet sich (Bottom-Sheet auf Mobile, zentriertes Modal auf Desktop)
3. **Formularfelder:**
   - Name (Pflicht) — `text`, Placeholder: "Hochschule Hannover"
   - Kürzel (Pflicht) — `text`, Placeholder: "HsH"
   - Stadt (Pflicht) — `text`, Placeholder: "Hannover"
   - Bundesland (Pflicht) — `text`, Placeholder: "Niedersachsen"
   - Typ (Pflicht) — `<select>`: Optionen "FH" und "Uni"
4. Admin füllt alle Felder aus, klickt "Erstellen"
5. Validierung: `name.trim()` muss nicht-leer sein, sonst kein Submit
6. System sendet `POST /api/admin/universities` mit JSON-Body
7. Erfolg: Modal schließt, TanStack Query invalidiert `["admin-universities"]`, Liste aktualisiert sich automatisch
8. Fehler: Exception wird nicht gecatcht → Browser-Console-Fehler (keine UI-Fehlermeldung in Phase 9)

**Request Body:**
```json
{ "name": "Hochschule Hannover", "kuerzel": "HsH", "stadt": "Hannover", "bundesland": "Niedersachsen", "typ": "FH" }
```

**API:** `POST /api/admin/universities` → `201 Created`  
**Audit-Log:** Wird automatisch vom Backend geschrieben (Action: "CREATE", Entity: "University")

---

### UC-A03 — Hochschule-Detail anzeigen

**Seite:** `/admin/universities/[id]`  
**Akteur:** Admin  
**Auslöser:** Klick auf Hochschul-Karte in der Übersicht

**Ablauf:**
1. System lädt Detail via `GET /api/admin/universities/{id}`
2. Während Laden: Zentrierter Spinner `Loader2` aus lucide-react
3. Seite gliedert sich in zwei Abschnitte:

**Abschnitt "Informationen"** (SectionCard):
- Name, Kürzel, Stadt, Bundesland, Typ — je als InfoRow (Label links, Wert rechts)

**Abschnitt "Fakultäten"** (SectionCard):
- Liste aller Fakultäten der Hochschule
- Pro Fakultät: Name (fett) + Kürzel als Untertitel
- Wenn Admin-Session aktiv: Trash-Icon-Button rechts neben jeder Fakultät (→ UC-A05)
- Button "Fakultät hinzufügen" am Ende der Liste (→ UC-A04)

**Nicht gefunden:**
- `error || !uni` → Fehlermeldung + "Zurück"-Link

**API:** `GET /api/admin/universities/{id}` → `AdminUniversityDetail` (inkl. `faculties[]`)  
**Query Key:** `["admin-university", id]` · staleTime: 30s

---

### UC-A04 — Fakultät zur Hochschule hinzufügen

**Seite:** `/admin/universities/[id]`  
**Akteur:** Admin  
**Auslöser:** Button "Fakultät hinzufügen"

**Ablauf:**
1. Admin klickt "Fakultät hinzufügen"
2. `AdminFormModal` öffnet sich
3. **Formularfelder:**
   - Name (Pflicht) — `text`, Placeholder: "Fakultät IV - Wirtschaft und Informatik"
   - Kürzel (optional) — `text`, Placeholder: "Fak IV"
4. Validierung: `name.trim()` muss nicht-leer sein
5. Submit → `POST /api/admin/faculties` mit `{ university_id, name, kuerzel }`
6. Erfolg: Modal schließt, Formular wird zurückgesetzt, `["admin-university", id]` invalidiert → Fakultätsliste aktualisiert sich

**Request Body:**
```json
{ "university_id": "uuid-der-hochschule", "name": "Fak. IV Wirtschaft & Informatik", "kuerzel": "Fak IV" }
```

**API:** `POST /api/admin/faculties` → `201 Created`  
**Kein Admin-Session-Token** nötig (nicht-destruktiv)

---

### UC-A05 — Fakultät löschen

**Seite:** `/admin/universities/[id]`  
**Akteur:** Admin (mit aktiver Admin-Session)  
**Auslöser:** Trash-Icon rechts neben einer Fakultät  
**Voraussetzung:** `isActive === true` (Admin-Session vorhanden)

**Ablauf:**
1. Trash-Icon ist **nur sichtbar wenn Admin-Session aktiv**
2. Admin klickt Trash-Icon neben der gewünschten Fakultät
3. **Kein Bestätigungsdialog** — sofortiger API-Call (Hard Delete)
4. System sendet `DELETE /api/admin/faculties/{facultyId}` mit `X-Admin-Token`-Header
5. Erfolg: `["admin-university", id]` invalidiert → Fakultätsliste ohne gelöschte Fakultät

**Achtung:** Hard Delete. Funktioniert nur wenn die Fakultät keine Studiengänge hat (Backend prüft das und gibt ggf. 409 zurück).  
**API:** `DELETE /api/admin/faculties/{id}` → `204 No Content`  
**Admin-Session:** Ja, `X-Admin-Token` Header wird mitgeschickt

---

### UC-A06 — Hochschule bearbeiten

**Seite:** `/admin/universities/[id]`  
**Akteur:** Admin  
**Auslöser:** Button "Bearbeiten" oben rechts

**Ablauf:**
1. Admin klickt "Bearbeiten"
2. `openEdit()` befüllt das Formular mit aktuellen Werten (name, kuerzel, stadt, bundesland, typ)
3. `AdminFormModal` öffnet sich mit vorausgefüllten Feldern
4. **Formularfelder:** Alle 5 Felder (name, kuerzel, stadt, bundesland als Text, typ als Select)
5. Admin ändert gewünschte Felder, klickt "Speichern"
6. System sendet `PATCH /api/admin/universities/{id}` (nur geänderte Felder via `model_dump(exclude_none=True)`)
7. Erfolg: `["admin-university", id]` und `["admin-universities"]` invalidiert

**API:** `PATCH /api/admin/universities/{id}` → `200 OK`  
**Kein Admin-Session-Token** nötig

---

### UC-A07 — Hochschule löschen

**Seite:** `/admin/universities/[id]`  
**Akteur:** Admin (mit aktiver Admin-Session)  
**Vorbedingung:** Hochschule hat **keine Fakultäten** (sonst kein "Danger Zone"-Abschnitt sichtbar)

**Ablauf:**
1. Abschnitt "Hochschule löschen" erscheint **nur wenn `uni.faculties.length === 0`**
2. Wenn keine Admin-Session: Roter Text "Keine aktive Admin-Session.", Button deaktiviert
3. Admin klickt "Löschen"
4. `DeleteDialog` öffnet sich: Bestätigungstext + Eingabefeld, der Nutzer muss den Hochschulnamen eintippen
5. Nach Bestätigung: `DELETE /api/admin/universities/{id}` mit `X-Admin-Token`
6. Erfolg: `["admin-universities"]` invalidiert, Router navigiert zurück zu `/admin/universities`

**Warum nur ohne Fakultäten?** Backend gibt `409 Conflict` wenn Fakultäten vorhanden sind. Die UI versteckt den Button proaktiv.  
**API:** `DELETE /api/admin/universities/{id}` → `204 No Content`  
**Admin-Session:** Ja, `X-Admin-Token` Header

---

## Studiengänge (Programs)

### UC-A08 — Studiengangsübersicht anzeigen

**Seite:** `/admin/programs`  
**Akteur:** Admin

**Ablauf:**
1. Admin navigiert zu "Studiengänge"
2. System lädt via `GET /api/admin/programs?include_archived=true` — immer alle inkl. archivierten
3. **Filter-Tabs** (Pill-Buttons):
   - "Alle": zeigt alles
   - "Aktiv": filtert clientseitig `!p.is_archived`
   - "Archiviert": filtert clientseitig `p.is_archived`
4. **Suchfeld**: Live-Filter über `name` (case-insensitive)
5. Pro Studiengang-Karte: Name + ggf. `StatusBadge "Archiviert"`, darunter: `{abschluss} · {gesamt_ects} ECTS · {regelstudienzeit} Sem.`
6. Klick auf Karte → navigiert zu `/admin/programs/{id}`

**API:** `GET /api/admin/programs?include_archived=true` → `AdminProgram[]`  
**Query Key:** `["admin-programs", undefined, true]` · staleTime: 60s

---

### UC-A09 — Neuen Studiengang anlegen

**Seite:** `/admin/programs`  
**Akteur:** Admin  
**Auslöser:** Button "+ Studiengang anlegen"

**Ablauf:**
1. `AdminFormModal` öffnet sich
2. **Formularfelder:**
   - Name (Pflicht) — `text`, Placeholder: "Angewandte Informatik"
   - Abschluss (Pflicht) — `text`, Placeholder: "Bachelor of Science"
   - Regelstudienzeit (Pflicht) — `number` min=1, Default: **7**
   - Gesamt-ECTS (Pflicht) — `number` min=1, Default: **210**
   - Fakultäts-ID (Pflicht) — `text` (Monospace-Font), UUID der Zielfakultät
3. Validierung: `name.trim()` und `faculty_id.trim()` müssen nicht-leer sein
4. Submit → `parseInt(regelstudienzeit)` und `parseInt(gesamt_ects)` vor dem Senden
5. `POST /api/admin/programs` mit JSON-Body
6. `["admin-programs"]` invalidiert

**Request Body:**
```json
{ "faculty_id": "uuid", "name": "Angewandte Informatik", "abschluss": "Bachelor of Science", "regelstudienzeit": 7, "gesamt_ects": 210 }
```

**API:** `POST /api/admin/programs` → `201 Created`  
**Hinweis:** faculty_id muss als UUID-String eingegeben werden (keine Dropdown-Auswahl in Phase 9)

---

### UC-A10 — Studiengang-Detail anzeigen

**Seite:** `/admin/programs/[id]`  
**Akteur:** Admin  
**Auslöser:** Klick auf Studiengang-Karte

**Ablauf:**
1. System lädt `GET /api/admin/programs/{id}` (Detail inkl. exam_regulations und student_count)
2. Seite gliedert sich in 3 Abschnitte:

**Abschnitt "Informationen":**
- Name, Abschluss, Regelstudienzeit (+ "Semester"), Gesamt-ECTS (+ "ECTS"), Studierende (formatiert mit Plural)

**Abschnitt "Prüfungsordnungen":**
- Liste aller POs als klickbare Zeilen → `/admin/exam-regulations/{er.id}`
- Pro PO: Version (fett) + ggf. "Aktuell gültig"-Badge (grün) + ggf. `StatusBadge "Archiviert"`, darunter: Datum
- Pfeil-Icon mit Text "Öffnen" rechts
- Button "Prüfungsordnung hinzufügen" am Ende → UC-A14 (PO anlegen)

**Abschnitt "Archiv/Wiederherstellen":**
- Wenn archiviert: Archivierungsgrund + "Wiederherstellen"-Button
- Wenn aktiv: Amber-Button "Archivieren" → UC-A12

**API:** `GET /api/admin/programs/{id}` → `AdminProgramDetail`  
**Query Key:** `["admin-program", id]` · staleTime: 30s

---

### UC-A11 — Studiengang bearbeiten

**Seite:** `/admin/programs/[id]`  
**Akteur:** Admin  
**Auslöser:** Button "Bearbeiten" oben rechts

**Ablauf:**
1. `openEdit()` befüllt Formular: name, abschluss, regelstudienzeit (als String für Input), gesamt_ects (als String)
2. `AdminFormModal` öffnet sich mit aktuellen Werten
3. **Formularfelder:** Name, Abschluss (je Text), Regelstudienzeit + Gesamt-ECTS (je Number, im 2-Spalten-Grid)
4. Submit → `parseInt()` bevor Senden
5. `PATCH /api/admin/programs/{id}` mit `{ name, abschluss, regelstudienzeit: int, gesamt_ects: int }`
6. `["admin-program", id]` und `["admin-programs"]` invalidiert

**API:** `PATCH /api/admin/programs/{id}` → `200 OK`

---

### UC-A12 — Studiengang archivieren

**Seite:** `/admin/programs/[id]`  
**Akteur:** Admin (mit aktiver Admin-Session)  
**Vorbedingung:** Studiengang ist noch nicht archiviert

**Ablauf:**
1. Admin klickt amber "Archivieren"-Button
2. `ArchiveDialog` öffnet sich:
   - Zeigt den Studiengangs-Namen
   - **Pflichtfeld:** Begründung (muss nicht-leer sein)
   - Bestätigungs-Button "Archivieren"
3. Admin gibt Begründung ein, klickt bestätigen
4. `POST /api/admin/programs/{id}/archive` mit `{ reason: "Begründungstext" }` und `X-Admin-Token`
5. `["admin-program", id]` und `["admin-programs"]` invalidiert
6. Seite zeigt nun: `StatusBadge "Archiviert"` im Header + "Wiederherstellen"-Bereich

**Request Body:** `{ "reason": "Studiengang ausgelaufen ab WS 2025/26" }`  
**API:** `POST /api/admin/programs/{id}/archive` → `204 No Content`  
**Admin-Session:** Ja, `X-Admin-Token` (Backend: `get_verified_admin`)  
**Audit-Log:** Backend schreibt automatisch Entry mit `reason`

---

### UC-A13 — Studiengang wiederherstellen

**Seite:** `/admin/programs/[id]`  
**Akteur:** Admin (mit aktiver Admin-Session)  
**Vorbedingung:** Studiengang ist archiviert

**Ablauf:**
1. Im Bereich "Wiederherstellen": ggf. Archivierungsgrund als Hinweis angezeigt
2. Admin klickt "Wiederherstellen"
3. `POST /api/admin/programs/{id}/restore` mit `X-Admin-Token` (kein Body)
4. `["admin-program", id]` und `["admin-programs"]` invalidiert
5. `is_archived`-Flag entfernt, `archived_at` und `archive_reason` auf `null` gesetzt

**API:** `POST /api/admin/programs/{id}/restore` → `204 No Content`  
**Admin-Session:** Ja

---

## Prüfungsordnungen (Exam Regulations)

### UC-A14 — Prüfungsordnung anlegen

**Seite:** `/admin/programs/[id]`  
**Akteur:** Admin  
**Auslöser:** Button "Prüfungsordnung hinzufügen" im Abschnitt "Prüfungsordnungen"

**Ablauf:**
1. `AdminFormModal` öffnet sich
2. **Formularfelder:**
   - Version (Pflicht) — `text`, Placeholder: "PO 2019"
   - Gültig ab (optional) — `text`, Placeholder: "WS 2024/25"
   - "Aktuell gültig" — Checkbox
3. Validierung: `version.trim()` muss nicht-leer sein
4. `POST /api/admin/exam-regulations` mit `{ program_id: id, version, gueltig_ab: null|string, ist_aktuell }`
5. `["admin-program", id]` invalidiert → PO-Liste im Studiengang-Detail aktualisiert

**Request Body:**
```json
{ "program_id": "uuid", "version": "PO 2019", "gueltig_ab": "2019-10-01", "ist_aktuell": true }
```

**Hinweis zu `gueltig_ab`:** Backend erwartet ein ISO-Date oder `null`. Der Freitext-Input (z.B. "WS 2024/25") wird so übergeben, was ggf. zu Validierungsfehlern führt. Für Produktiveinsatz sollte ein Date-Picker verwendet werden (Phase 10-Kandidat).  
**API:** `POST /api/admin/exam-regulations` → `201 Created`

---

### UC-A15 — Prüfungsordnungs-Detail anzeigen (zentrales PO-Hub)

**Seite:** `/admin/exam-regulations/[id]`  
**Akteur:** Admin  
**Auslöser:** Klick auf PO-Zeile im Studiengang-Detail

**Ablauf:**
1. System lädt **parallel**:
   - `GET /api/admin/exam-regulations/{id}` (→ AdminExamRegDetail mit module_count)
   - `GET /api/admin/modules?exam_regulation_id={id}&include_archived=true` (→ AdminModule[])
2. Während Laden: Spinner

**Seiten-Aufbau:**
```
← Studiengang [Zurück-Link zu /admin/programs/{program_id}]

PO 2019  [Aktuell gültig Badge]  [Bearbeiten-Button]
"X aktive Module"

[Details]
  Version         PO 2019
  Gültig ab       WS 2019/20
  Aktuell gültig  Ja
  Studiengang     {program_id} [Link zu /admin/programs/{id}]

[Module — Toolbar]
  [Alle] [Aktiv] [Archiviert]  [Suchfeld]  [JSON-Import]  [+ Modul anlegen]

[Modulkatalog-Tabelle]
  Kürzel | Modul | ECTS | Sem. | Typ | PA | Status
  (klickbare Zeilen → /admin/modules/{id})

[PO archivieren]  ← oder [Wiederherstellen] wenn archiviert
```

**Module-Tabelle Spalten:**
| Spalte | Inhalt | Sichtbarkeit |
|---|---|---|
| Kürzel | Monospace-Font, gedimmt | immer |
| Modul-Name | Fett | immer |
| ECTS | Rechts-ausgerichtet | immer |
| Sem. | Rechts-ausgerichtet | ab sm (≥640px) |
| Typ | ModulTypBadge (blau/lila/orange) | ab sm |
| PA | Prüfungsart-String | ab md (≥768px) |
| Status | StatusBadge "Archiviert" | immer |

**Query Keys:**  
- `["admin-exam-reg", id]` · staleTime: 30s  
- `["admin-modules", id, true]` · staleTime: 30s

---

### UC-A16 — Prüfungsordnung bearbeiten

**Seite:** `/admin/exam-regulations/[id]`  
**Akteur:** Admin  
**Auslöser:** Button "Bearbeiten" oben rechts

**Ablauf:**
1. `openEdit()` befüllt Formular mit aktuellen ER-Werten
2. `AdminFormModal` öffnet sich
3. **Formularfelder:**
   - Version — `text` (vorausgefüllt)
   - Gültig ab — `text` (vorausgefüllt oder leer), Placeholder: "z.B. WS 2024/25"
   - "Aktuell gültig" — Checkbox (vorausgefüllt)
4. `gueltig_ab || null` — leerer String wird zu `null`
5. `PATCH /api/admin/exam-regulations/{id}` mit geänderten Feldern

**API:** `PATCH /api/admin/exam-regulations/{id}` → `200 OK`

---

### UC-A17 — Prüfungsordnung archivieren

**Seite:** `/admin/exam-regulations/[id]`  
**Akteur:** Admin (mit aktiver Admin-Session)

**Ablauf:**
1. Amber-Button "PO archivieren" → `ArchiveDialog` öffnet sich
2. Zeigt PO-Version als Entitätsname
3. Pflichtfeld: Begründung
4. `POST /api/admin/exam-regulations/{id}/archive` mit `{ reason }` + `X-Admin-Token`
5. Seite zeigt `StatusBadge "Archiviert"` + Archivierungsgrund + "Wiederherstellen"-Button

**API:** `POST /api/admin/exam-regulations/{id}/archive` → `204 No Content`  
**Admin-Session:** Ja

---

### UC-A18 — Prüfungsordnung wiederherstellen

**Seite:** `/admin/exam-regulations/[id]`  
**Akteur:** Admin (mit aktiver Admin-Session)

**Ablauf:**
1. Button "Wiederherstellen" (sichtbar wenn `is_archived === true`)
2. `POST /api/admin/exam-regulations/{id}/restore` mit `X-Admin-Token`
3. `["admin-exam-reg", id]` invalidiert

**API:** `POST /api/admin/exam-regulations/{id}/restore` → `204 No Content`

---

## Module

### UC-A19 — Modul manuell anlegen

**Seite:** `/admin/exam-regulations/[id]`  
**Akteur:** Admin  
**Auslöser:** Button "+ Modul anlegen" in der Modulkatalog-Toolbar

**Ablauf:**
1. `AdminFormModal` öffnet sich mit `ModuleFormFields`-Komponente
2. **Formularfelder** (2-spaltig, alle in einem Grid):

| Feld | Typ | Default | Pflicht | Beschreibung |
|---|---|---|---|---|
| Name | text | — | Ja | Modulname, z.B. "Programmieren 1" |
| Kürzel | text (Monospace) | — | Nein | z.B. "BIN-100" |
| ECTS | number (min=1) | **5** | Ja | Kreditpunkte |
| Sem.-Empfehlung | number (min=1) | — | Nein | Empfohlenes Semester 1–7 |
| Modul-Typ | select | **PFLICHT** | Ja | PFLICHT / WAHLPFLICHT / ERGAENZEND |
| Prüfungsart | text | — | Nein | z.B. "PX", "EA", "R", "BAA+Ko" |
| Max. Versuche | number (min=1) | **3** | Ja | Anzahl Prüfungsversuche |
| GPA-Gewichtung | number (min=0, step=0.1) | **1** | Ja | Faktor für GPA-Berechnung |
| SWS | number (min=0) | — | Nein | Semesterwochenstunden |
| Benotet | checkbox | **true** | — | Fließt Note in GPA ein |
| Hat Voraussetzungen | checkbox | **false** | — | Signalisiert ob Voraussetzungen existieren |

3. Validierung: `name.trim()` muss nicht-leer sein
4. Leere optionale Felder werden als `null` gesendet:
   - `kuerzel || null`
   - `semester_empfehlung ? parseInt(...) : null`
   - `pruefungsart || null`
   - `sws ? parseInt(...) : null`
5. `POST /api/admin/modules` mit vollständigem Body
6. `["admin-modules", id, true]` und `["admin-exam-reg", id]` invalidiert (module_count aktualisiert sich)
7. Formular wird zurückgesetzt auf Defaults

**Request Body:**
```json
{
  "exam_regulation_id": "uuid-der-po",
  "name": "Programmieren 1",
  "kuerzel": "BIN-100",
  "ects": 5,
  "semester_empfehlung": 1,
  "modul_typ": "PFLICHT",
  "ist_benotet": true,
  "max_versuche": 3,
  "gewichtung": 1.0,
  "has_prerequisites": false,
  "pruefungsart": "PX",
  "sws": 4
}
```

**API:** `POST /api/admin/modules` → `201 Created`  
**Audit-Log:** Backend schreibt "CREATE Module" mit vollständigem Snapshot

---

### UC-A20 — Module per JSON-Bulk-Import einlesen

**Seite:** `/admin/exam-regulations/[id]`  
**Akteur:** Admin  
**Auslöser:** Button "JSON-Import" in der Modulkatalog-Toolbar

**Zweck:** Viele Module auf einmal importieren (z.B. beim Einpflegen einer neuen PO aus dem Modulhandbuch).  
**Max. Limit:** 500 Module pro Import-Request.

**Ablauf:**
1. `AdminFormModal` öffnet sich mit Textbereich (8 Zeilen, resize-y)
2. Beschreibungstext: "JSON-Array mit Modulen einfügen. Bestehende Einträge (gleiches Kürzel) werden übersprungen."
3. Admin fügt JSON-Array ein
4. Admin klickt "Importieren"

**Client-seitige Validierung (vor API-Call):**
- `JSON.parse(importJson)` — Fehler: rote Meldung "Invalid JSON"
- `Array.isArray(parsed)` — Fehler: "Expected a JSON array"

**Erfolgreicher Import:**
5. `POST /api/admin/modules/import/json` mit `{ exam_regulation_id: id, modules: parsed[] }`
6. Backend prüft für jedes Modul ob Kürzel bereits existiert (Skip-Logik)
7. Erfolg: Grüne Meldung "{created} erstellt, {skipped} übersprungen"
8. Bei partiellen Fehlern: zusätzlich rote "(N errors)"-Meldung
9. `["admin-modules", id, true]` und `["admin-exam-reg", id]` invalidiert
10. JSON-Textarea wird geleert

**JSON-Format (Beispiel mit Minimal-Felder):**
```json
[
  {
    "name": "Programmieren 1",
    "kuerzel": "BIN-100",
    "ects": 5,
    "semester_empfehlung": 1,
    "modul_typ": "PFLICHT",
    "ist_benotet": true,
    "max_versuche": 3,
    "gewichtung": 1.0,
    "has_prerequisites": false,
    "pruefungsart": "PX",
    "sws": 4
  },
  {
    "name": "Mathematik 1",
    "kuerzel": "BIN-101",
    "ects": 5,
    "modul_typ": "PFLICHT",
    "ist_benotet": true,
    "max_versuche": 3,
    "gewichtung": 1.0,
    "has_prerequisites": false
  }
]
```

**Skip-Logik (Backend):**  
Module mit gleichem `kuerzel` in derselben PO werden übersprungen. Module ohne Kürzel werden nie übersprungen. Dies erlaubt idempotente Re-Imports.

**API:** `POST /api/admin/modules/import/json` → `200 OK` mit `ImportResult`

**ImportResult-Struktur:**
```json
{ "created": 25, "skipped": 3, "errors": [], "audit_log_id": "uuid" }
```

**Audit-Log:** Backend schreibt einzigen Entry mit Summary: `"25 modules → ER {uuid}"`

---

### UC-A21 — Modulkatalog filtern und durchsuchen

**Seite:** `/admin/exam-regulations/[id]`  
**Akteur:** Admin  
**Auslöser:** Interaktion mit Filter-Tabs oder Suchfeld

**Filter-Tabs:**
- **"Alle"** (Default): zeigt aktive + archivierte Module
- **"Aktiv"**: zeigt nur `!m.is_archived`
- **"Archiviert"**: zeigt nur `m.is_archived`
- Aktiver Tab: `bg-foreground text-background` (invertiert), inaktiv: `text-muted-foreground`

**Suche:**
- Textfeld, Live-Filter (kein Debounce, kein API-Call)
- Sucht in: `m.name` UND `m.kuerzel` (case-insensitive)
- Filter läuft via `useMemo` über die geladenen Daten

**Kombination:** Filter und Suche arbeiten zusammen (AND-Verknüpfung)

**Beispiel:** Tab "Aktiv" + Suche "pro" → zeigt nur aktive Module die "pro" im Namen oder Kürzel haben

---

### UC-A22 — Modul-Detail anzeigen

**Seite:** `/admin/modules/[id]`  
**Akteur:** Admin  
**Auslöser:** Klick auf Modulzeile in der Katalog-Tabelle

**Ablauf:**
1. System lädt `GET /api/admin/modules/{id}` (→ AdminModuleDetail mit student_count und prerequisites)
2. Seite gliedert sich in 3 Abschnitte:

**Header:**
- Zurück-Link → `/admin/exam-regulations/{exam_regulation_id}`
- Kürzel (Monospace, gedimmt) + Name (H1 bold) + ModulTypBadge + ggf. StatusBadge
- Untertitel: "{N} Studierende belegen dieses Modul"
- "Bearbeiten"-Button oben rechts

**Abschnitt "Details"** (11 InfoRows):
| Label | Wert |
|---|---|
| Name | Modulname |
| Kürzel | BIN-100 oder — |
| ECTS | "5 ECTS" |
| Sem.-Empfehlung | 1 oder — |
| Modul-Typ | ModulTypBadge (PFLICHT/WAHLPFLICHT/ERGAENZEND) |
| Benotet | Ja / Nein |
| Max. Versuche | 3 |
| GPA-Gewichtung | 1 |
| Prüfungsart | PX oder — |
| SWS | 4 oder — |
| Hat Voraussetzungen | Ja / Nein |

**Abschnitt "Voraussetzungen":**
- Wenn keine: "Keine Voraussetzungen definiert."
- Wenn vorhanden: Tabelle mit 4 Spalten (Typ-Badge, Beschreibung, Min-ECTS, Semester) + Trash-Icon
- Button "Voraussetzung hinzufügen" → UC-A23

**Abschnitt "Modul archivieren / Wiederherstellen":**
- Analog zu UC-A17/UC-A18

**API:** `GET /api/admin/modules/{id}` → `AdminModuleDetail`  
**Query Key:** `["admin-module", id]`

---

### UC-A23 — Modul bearbeiten

**Seite:** `/admin/modules/[id]`  
**Akteur:** Admin  
**Auslöser:** Button "Bearbeiten"

**Ablauf:**
1. `openEdit()` befüllt alle 11 Felder mit aktuellen Werten des Moduls:
   - Zahlen werden via `String()` in Text-Inputs umgewandelt
   - Optionale `null`-Felder werden als `""` gesetzt
2. `AdminFormModal` öffnet sich mit vorausgefüllten Feldern (identisch zu UC-A19)
3. Admin ändert gewünschte Felder, klickt "Speichern"
4. Parsing vor dem Senden:
   - `kuerzel || null` — leerer String → null
   - `semester_empfehlung ? parseInt() : null`
   - `pruefungsart || null`
   - `sws ? parseInt() : null`
5. `PATCH /api/admin/modules/{id}` mit PATCH-Body (alle Felder, auch unveränderte)
6. `["admin-module", id]` invalidiert

**API:** `PATCH /api/admin/modules/{id}` → `200 OK`  
**Audit-Log:** Backend schreibt Update mit old/new Snapshot (name, ects, modul_typ)

---

### UC-A24 — Modul archivieren

**Seite:** `/admin/modules/[id]`  
**Akteur:** Admin (mit aktiver Admin-Session)

**Ablauf:**
1. Amber-Button "Modul archivieren" → `ArchiveDialog`
2. `ArchiveDialog` zeigt Modul-Name, Pflichtfeld Begründung
3. `POST /api/admin/modules/{id}/archive` mit `{ reason }` + `X-Admin-Token`
4. Modul bekommt: `is_archived=true`, `archived_at=now`, `archive_reason=reason`
5. Für Studierende: Modul verschwindet aus dem Katalog (Backend filtert is_archived=true)

**Achtung:** Bereits eingetragene StudentModule-Einträge bleiben erhalten (ADR-020 Bestandsschutz).  
**API:** `POST /api/admin/modules/{id}/archive` → `204 No Content`  
**Admin-Session:** Ja

---

### UC-A25 — Modul wiederherstellen

**Seite:** `/admin/modules/[id]`  
**Akteur:** Admin (mit aktiver Admin-Session)

**Ablauf:**
1. Button "Wiederherstellen"
2. `POST /api/admin/modules/{id}/restore` mit `X-Admin-Token`
3. `is_archived=false`, `archived_at=null`, `archive_reason=null`
4. Modul erscheint wieder im Studierenden-Katalog

**API:** `POST /api/admin/modules/{id}/restore` → `204 No Content`

---

## Voraussetzungen (Prerequisites)

### UC-A26 — Voraussetzung zu einem Modul hinzufügen

**Seite:** `/admin/modules/[id]`  
**Akteur:** Admin  
**Auslöser:** Button "Voraussetzung hinzufügen" im Voraussetzungs-Abschnitt

**Konzept:** Voraussetzungen definieren, welche Bedingungen erfüllt sein müssen, bevor ein Studierender sich für ein Modul anmelden kann. Es gibt 3 Typen:

| Typ | Bedeutung | Zusatzfeld |
|---|---|---|
| `MODULE` | Ein anderes Modul muss bestanden sein | required_module_id (UUID) |
| `ECTS_THRESHOLD` | Mindest-ECTS-Summe muss erreicht sein | minimum_ects (Zahl) |
| `SEMESTER_COMPLETE` | Bestimmte Semester müssen vollständig abgeschlossen sein | required_semesters (JSON-Array) |

**Ablauf:**
1. `AdminFormModal` öffnet sich
2. **Basis-Felder (immer sichtbar):**
   - Typ — `<select>` mit 3 Optionen: "Modul", "ECTS-Schwelle", "Semester"
   - Beschreibung (Pflicht) — `text`, Placeholder: "z.B. BIN-100 muss bestanden sein"
3. **Typ-konditionelle Felder** (erscheinen je nach Typ-Auswahl):
   - Typ = **MODULE**: UUID-Feld "Benötigtes Modul UUID (optional)" — Monospace-Font
   - Typ = **ECTS_THRESHOLD**: Number-Feld "Mindest-ECTS (optional)" — min=0
   - Typ = **SEMESTER_COMPLETE**: Text-Feld "Benötigte Semester als JSON (optional)" — Monospace, Placeholder: "[1, 2]"
4. Validierung: `description.trim()` muss nicht-leer sein
5. Parsing bei `SEMESTER_COMPLETE`: `JSON.parse(required_semesters)` — bei Fehler wird `null` gesendet
6. `POST /api/admin/prerequisites` mit Body:
   ```json
   {
     "module_id": "uuid-des-moduls",
     "prerequisite_type": "MODULE",
     "description": "BIN-100 muss bestanden sein",
     "required_module_id": "uuid-des-vorausgesetzten-moduls",
     "minimum_ects": null,
     "required_semesters": null
   }
   ```
7. `["admin-module", id]` invalidiert → Voraussetzungsliste aktualisiert
8. Formular zurückgesetzt auf `MODULE`-Default

**API:** `POST /api/admin/prerequisites` → `201 Created`  
**Hinweis:** Wenn `required_module_id` angegeben, validiert Backend dass dieses Modul existiert (→ 404 wenn nicht)

---

### UC-A27 — Voraussetzung löschen

**Seite:** `/admin/modules/[id]`  
**Akteur:** Admin (mit aktiver Admin-Session)  
**Auslöser:** Trash-Icon in der Voraussetzungs-Tabelle

**Ablauf:**
1. Trash-Icon ist **nur sichtbar wenn `isActive === true`**
2. Klick → sofortiger Hard Delete (kein Bestätigungs-Dialog)
3. `DELETE /api/admin/prerequisites/{prereqId}` mit `X-Admin-Token`
4. `["admin-module", id]` invalidiert → Tabelle ohne gelöschte Voraussetzung

**Warum Hard Delete?** Voraussetzungen sind reine Metadaten (keine StudentModule-Einträge dagegen). Hard Delete ist laut ADR-020 explizit erlaubt und korrekt.  
**API:** `DELETE /api/admin/prerequisites/{id}` → `204 No Content`  
**Admin-Session:** Ja

---

### UC-A28 — Voraussetzungen eines Moduls einsehen

**Seite:** `/admin/modules/[id]` → Abschnitt "Voraussetzungen"

**Tabellen-Spalten:**
| Spalte | Inhalt | Sichtbarkeit |
|---|---|---|
| Typ | PrereqTypeBadge (blau=Modul, gelb=ECTS, grün=Semester) | immer |
| Beschreibung | Freitext, gedimmt | immer |
| Min. ECTS | Zahl oder — | ab sm |
| Sem. | JSON-String oder — | ab sm |
| (Trash) | Nur wenn Admin-Session aktiv | immer |

**Badge-Farben:**
- MODULE → blau
- ECTS_THRESHOLD → gelb/amber
- SEMESTER_COMPLETE → grün

---

## Globale Modul-Übersicht

### UC-A29 — Alle Module übergreifend suchen

**Seite:** `/admin/modules`  
**Akteur:** Admin  
**Zweck:** Schnellen Überblick über alle Module aller Prüfungsordnungen, PO-übergreifende Suche

**Ablauf:**
1. Admin navigiert zu "Module" in der Admin-Sidebar
2. System lädt `GET /api/admin/modules?include_archived=true` — **alle Module aller ERs**
3. Filter-Tabs: Alle / Aktiv / Archiviert
4. Suchfeld: Live-Filter über Name + Kürzel
5. Tabelle mit Rand und Header-Hintergrund (abgesetzt von ER-Detail-Tabelle)

**Tabellen-Design** (kompakter als ER-Detail, aber selbe Spalten):
- Umrandeter Container (`rounded-lg border overflow-hidden`)
- Header-Zeile mit `bg-muted/30`
- Body-Zeilen mit `divide-y`
- Klick auf Zeile → `/admin/modules/{id}`

**API:** `GET /api/admin/modules?include_archived=true` → `AdminModule[]` (alle ERs kombiniert)  
**Query Key:** `["admin-modules", undefined, true]`

---

## Technisches Referenz-Kapitel

### Admin-Session — wie sie funktioniert

```
Standardoperationen (kein Token nötig):
  POST/PATCH an /universities, /faculties, /programs, /exam-regulations, /modules, /prerequisites
  → Backend: get_admin_user (prüft nur JWT is_admin=true)

Destruktive Operationen (Token nötig):
  POST /programs/{id}/archive|restore
  POST /exam-regulations/{id}/archive|restore
  POST /modules/{id}/archive|restore
  DELETE /universities/{id}, /faculties/{id}, /prerequisites/{id}
  POST /users/{id}/reset-password, DELETE /users/{id}
  → Backend: get_verified_admin (prüft JWT + X-Admin-Token gegen Redis)
```

**Im Frontend:**
- `useAdminSession()` Hook gibt `{ token, isActive }` zurück
- `isActive === true` wenn Token vorhanden UND nicht abgelaufen
- UI: Buttons disabled, ggf. Warntext wenn `!isActive`
- `adminMutate(path, method, { ..., adminToken: token })` setzt `X-Admin-Token`-Header

---

### Alle API-Endpunkte (Phase 9)

```
Hochschulen:
  GET    /api/admin/universities                     → AdminUniversity[]
  POST   /api/admin/universities                     → AdminUniversity (201)
  GET    /api/admin/universities/{id}                → AdminUniversityDetail
  PATCH  /api/admin/universities/{id}                → AdminUniversity
  DELETE /api/admin/universities/{id}                → 204 (nur ohne Fakultäten)

Fakultäten:
  POST   /api/admin/faculties                        → AdminFaculty (201)
  PATCH  /api/admin/faculties/{id}                   → AdminFaculty
  DELETE /api/admin/faculties/{id}                   → 204

Studiengänge:
  GET    /api/admin/programs?include_archived=bool   → AdminProgram[]
  POST   /api/admin/programs                         → AdminProgram (201)
  GET    /api/admin/programs/{id}                    → AdminProgramDetail
  PATCH  /api/admin/programs/{id}                    → AdminProgram
  POST   /api/admin/programs/{id}/archive            → 204 [Admin-Session]
  POST   /api/admin/programs/{id}/restore            → 204 [Admin-Session]

Prüfungsordnungen:
  GET    /api/admin/exam-regulations?program_id=     → AdminExamReg[]
  POST   /api/admin/exam-regulations                 → AdminExamReg (201)
  GET    /api/admin/exam-regulations/{id}            → AdminExamRegDetail (+module_count)
  PATCH  /api/admin/exam-regulations/{id}            → AdminExamReg
  POST   /api/admin/exam-regulations/{id}/archive    → 204 [Admin-Session]
  POST   /api/admin/exam-regulations/{id}/restore    → 204 [Admin-Session]

Module:
  GET    /api/admin/modules?exam_regulation_id=&include_archived=  → AdminModule[]
  POST   /api/admin/modules                          → AdminModule (201)
  POST   /api/admin/modules/import/json              → ImportResult
  GET    /api/admin/modules/{id}                     → AdminModuleDetail (+student_count +prerequisites)
  PATCH  /api/admin/modules/{id}                     → AdminModule
  POST   /api/admin/modules/{id}/archive             → 204 [Admin-Session]
  POST   /api/admin/modules/{id}/restore             → 204 [Admin-Session]

Voraussetzungen:
  GET    /api/admin/prerequisites/by-module/{id}     → AdminPrerequisite[]
  POST   /api/admin/prerequisites                    → AdminPrerequisite (201)
  PATCH  /api/admin/prerequisites/{id}               → AdminPrerequisite
  DELETE /api/admin/prerequisites/{id}               → 204 [Admin-Session]
```

---

### TypeScript-Typen (frontend/src/types/admin.ts)

```typescript
// Gebäude-Block
interface AdminFaculty {
  id: string; university_id: string; name: string; kuerzel: string;
}

interface AdminUniversity {
  id: string; name: string; kuerzel: string; stadt: string; bundesland: string; typ: string;
}
interface AdminUniversityDetail extends AdminUniversity {
  faculties: AdminFaculty[];
}

interface AdminProgram {
  id: string; faculty_id: string; name: string; abschluss: string;
  regelstudienzeit: number; gesamt_ects: number;
  is_archived: boolean; archived_at: string | null; archive_reason: string | null;
}
interface AdminProgramDetail extends AdminProgram {
  student_count: number;
  exam_regulations: AdminExamReg[];
}

interface AdminExamReg {
  id: string; program_id: string; version: string; gueltig_ab: string | null;
  ist_aktuell: boolean;
  is_archived: boolean; archived_at: string | null; archive_reason: string | null;
}
interface AdminExamRegDetail extends AdminExamReg {
  module_count: number;  // ← hinzugefügt in Phase 9
}

interface AdminModule {
  id: string; exam_regulation_id: string;
  name: string; kuerzel: string | null; ects: number;
  semester_empfehlung: number | null;
  modul_typ: "PFLICHT" | "WAHLPFLICHT" | "ERGAENZEND";
  ist_benotet: boolean; max_versuche: number; gewichtung: number;
  has_prerequisites: boolean; pruefungsart: string | null; sws: number | null;
  is_archived: boolean; archived_at: string | null; archive_reason: string | null;
}
interface AdminModuleDetail extends AdminModule {
  student_count: number;
  prerequisites: AdminPrerequisite[];
}

interface AdminPrerequisite {
  id: string; module_id: string;
  prerequisite_type: "MODULE" | "ECTS_THRESHOLD" | "SEMESTER_COMPLETE";
  description: string;
  required_module_id: string | null;
  minimum_ects: number | null;
  required_semesters: string | null;
}
```

---

### TanStack Query Keys

```typescript
["admin-universities"]                           // Liste aller Hochschulen
["admin-university", id]                         // Hochschule + Fakultäten
["admin-programs", faculty_id?, include_arch?]   // Studiengänge (ggf. gefiltert)
["admin-program", id]                            // Studiengang + exam_regulations + student_count
["admin-exam-reg", id]                           // PO-Detail + module_count
["admin-modules", er_id?, include_arch?]         // Module (ggf. per ER gefiltert)
["admin-module", id]                             // Modul + prerequisites + student_count
```

---

### Wichtige Verhaltensregeln der UI

| Situation | Verhalten |
|---|---|
| Laden | Spinner (Loader2) zentriert in min-h-[40vh] |
| Laden (Listen) | Animate-Pulse-Skeleton-Karten |
| Nicht gefunden | Text + Zurück-Link |
| Admin-Session fehlt | Warntext + Button `disabled` |
| Archivierte Entität | StatusBadge (grau, "Archiviert") + Restore-Option statt Archive-Option |
| Ist-aktuell (PO) | Grüner Pill-Badge "Aktuell gültig" |
| Modul-Typ | Farbige Pill-Badges: PFLICHT=blau, WAHLPFLICHT=lila, ERGAENZEND=orange |
| Voraussetzungs-Typ | Badges: MODULE=blau, ECTS_THRESHOLD=gelb, SEMESTER_COMPLETE=grün |
| Filter-Tabs | Aktiv: invertiert (schwarz/weiß), Inaktiv: gedimmt |
| Tabellen-Zeilen | hover:bg-muted/30 + cursor-pointer |
| Modals | AdminFormModal: Bottom-Sheet auf Mobile, zentriert auf Desktop |
| Archiv-Dialog | ArchiveDialog: Pflicht-Begründungsfeld |
| Lösch-Dialog | DeleteDialog: Bestätigungs-Wort eingeben |

---

### i18n-Namespace-Übersicht (Phase 9)

Alle Strings liegen unter dem `"admin"`-Namespace in `messages/de.json` und `messages/en.json`.

```
admin.common.*         → save, edit, archive, restore, delete, cancel, noSession, yes, no
admin.universities.*   → title, subtitle, create, searchPlaceholder, form.*, detail.*, facultyForm.*
admin.programs.*       → title, subtitle, create, filterAll/Active/Archived, form.*, detail.*, examRegForm.*
admin.examRegs.*       → back, addModule, jsonImport, archiveEr, filterAll/Active/Archived,
                         colKuerzel/Name/Ects/Sem/Typ/PA/Status/Actions, noModules, notFound,
                         moduleCount, version, gueltigAb, istAktuell, programLabel, infoSection,
                         form.editTitle/version/gueltigAb/gueltigAbPlaceholder/istAktuell,
                         jsonImportTitle/Desc/Placeholder/Result/Btn
admin.modules.*        → title, subtitle, create, filterAll/Active/Archived, searchPlaceholder,
                         colKuerzel/Name/Ects/Sem/Typ/PA/Status,
                         detail.back/infoSection/prereqSection/noPrereqs/archiveBtn/restoreBtn/
                                notFound/saved/saveError/students/name/kuerzel/ects/semEmpfehlung/
                                modulTyp/istBenotet/maxVersuche/gewichtung/hasPrereqs/pruefungsart/
                                sws/colPrereqType/colPrereqDesc/colPrereqSems/colPrereqEcts/deletePrereq,
                         form.createTitle/editTitle/name/namePlaceholder/kuerzel/kuerzelPlaceholder/
                              ects/semEmpfehlung/modulTyp/pflicht/wahlpflicht/ergaenzend/
                              istBenotet/maxVersuche/gewichtung/hasPrereqs/pruefungsart/
                              pruefungsartPlaceholder/sws/examRegId/examRegIdPlaceholder
admin.prerequisites.*  → title, subtitle, searchPlaceholder, colModule/Type/Desc/Semesters/Ects,
                         noResults, typeModule/typeEcts/typeSemester,
                         form.createTitle/moduleId/type/typeModule/typeEcts/typeSemester/
                              description/descriptionPlaceholder/requiredModuleId/minimumEcts/
                              requiredSemesters/requiredSemestersPlaceholder
```

---

## Bekannte Einschränkungen (Phase 9)

| Einschränkung | Begründung | Geplant |
|---|---|---|
| faculty_id beim Studiengang-Anlegen als UUID-Feld | Kein Dropdown (Uni → Fakultät) implementiert | Phase 10+ |
| required_module_id beim Voraussetzung-Anlegen als UUID-Feld | Kein Modul-Auswahl-Dropdown | Phase 10+ |
| gueltig_ab als Freitext-Feld | Kein Date-Picker | Phase 10+ |
| Fehlerbehandlung zeigt keine UI-Fehlermeldung | Nur Browser-Console | Phase 12 |
| Kein Bestätigungs-Dialog beim Fakultät-Löschen | Sofortiger DELETE | Bleibt so (wenig riskant) |
| Globale Modul-Übersicht lädt alle Module | Kein Server-Side-Pagination | Bei > 500 Modulen überdenken |
| Kein ER-Filter auf Programs-Übersicht | Alle ERs inline im Programm-Detail | Ausreichend für jetzigen Umfang |
