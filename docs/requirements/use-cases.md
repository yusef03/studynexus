# Use Cases – StudyNexus

*Zuletzt aktualisiert: 2026-05-10 (Sprint 5 Phase 8)*

## Akteure

| Akteur | Typ | Beschreibung |
|---|---|---|
| Anonymer Besucher | Menschlich | Nicht eingeloggter Nutzer, kann nur Registrierung starten |
| Studierender | Menschlich (primär) | Registrierter Hauptnutzer der Plattform |
| Admin | Menschlich (privilegiert) | Nutzer mit `is_admin=true`-Flag; verwaltet PO-Daten, User und System |
| Globale PO-Datenbank | Technisch (intern) | Das eigene Admin-Panel mit manuell gepflegten PO-Daten (kein externes System) |
| KI-Subsystem | Intern | Teil des Systems, geplant für Sprint 8+ |

---

## Use Case Übersicht

| ID | Use Case | Akteur | Status | Beziehung |
|---|---|---|---|---|
| UC01 | Registrieren | Anonymer Besucher | ✅ implementiert | - |
| UC02 | Studiengang auswählen | Studierender | ✅ implementiert | <<include>> UC03 |
| UC03 | PO-Daten laden | Globale PO-Datenbank | ✅ implementiert | wird included von UC02 |
| UC04 | Noten und Status eintragen | Studierender | ✅ implementiert | - |
| UC05 | Studienplan anpassen (DnD) | Studierender | ✅ implementiert | - |
| UC06 | Termine verwalten | Studierender | ✅ implementiert | - |
| UC07 | Aufgaben im Kanban verwalten | Studierender | ✅ implementiert | - |
| UC08 | PO-Regeln einsehen | Studierender | ✅ implementiert | - |
| UC09 | PDF-Skripte hochladen | Studierender | 🗓 Sprint 8 | <<extend>> UC10 |
| UC10 | Karteikarten/Tests generieren | KI-Subsystem | 🗓 Sprint 8 | extends UC09 |
| UC11 | Study Space gründen | Studierender | 🗓 Sprint 8 | - |
| UC12 | Admin-Panel betreten (Re-Auth) | Admin | ✅ implementiert | - |
| UC13 | Nutzer verwalten | Admin | ✅ implementiert | - |
| UC14 | PO-Daten verwalten | Admin | ✅ implementiert → [Detaillierte Use Cases](admin-po-use-cases.md) | - |
| UC15 | Analytics-Dashboard einsehen | Admin | ✅ implementiert | - |
| UC16 | Audit-Log einsehen | Admin | 🔧 Backend ✅, Frontend Phase 10 | - |

---

## Detaillierte Use Case Beschreibungen

### UC02 – Studiengang auswählen

**Akteure:** Studierender, Globale PO-Datenbank
**Vorbedingung:** Studierender ist registriert und eingeloggt (UC01 abgeschlossen)

**Standardablauf:**
1. Studierender wählt Hochschule, Fakultät und Studiengang in der App
2. System kontaktiert die Globale PO-Datenbank (<<include>> UC03)
3. PO-Datenbank liefert die Struktur der geltenden Prüfungsordnung zurück
4. System generiert interaktiven Modul-Graphen (Skill-Tree)
5. System generiert visuellen Studienverlaufsplan
6. System zeigt dem Studierenden den fertigen personalisierten Studienplan

**Alternativer Ablauf (2a – Datenbank nicht erreichbar):**
- System zeigt Fehlermeldung und bietet manuelle Eingabe der Module an

**Alternativer Ablauf (2b – Studiengang nicht in Datenbank):**
- System informiert Nutzer und ermöglicht manuellen Import per CSV

**Nachbedingung:** Individueller Studienplan ist vollständig visualisiert und bereit zur Bearbeitung

---

### UC09 – PDF-Skripte hochladen

**Akteure:** Studierender, (optional) KI-Subsystem
**Vorbedingung:** Studierender befindet sich in einem Modul oder Study Space

**Standardablauf:**
1. Studierender wählt PDF-Datei vom Endgerät aus
2. System validiert Dateiformat und Dateigröße
3. System speichert das Skript verschlüsselt im Cloud-Speicher
4. System stellt das Dokument zur Ansicht bereit
5. System teilt das Dokument mit Kommilitonen (falls Study Space)

**Erweiterung (<<extend>> UC10 – KI aktiv):**
- Nach Schritt 3: KI-Subsystem analysiert das PDF automatisch
- KI generiert Karteikarten und Multiple-Choice-Tests
- Generierte Lernmaterialien werden dem Studierenden angezeigt

**Alternativer Ablauf (2a – Datei zu groß oder falsches Format):**
- System zeigt Fehlermeldung mit erlaubten Formaten und Größenlimits

**Nachbedingung:** Skript ist verschlüsselt gespeichert und verfügbar (optional mit KI-Lernmaterialien)

---

### UC12 – Admin-Panel betreten (Re-Authentifizierung)

**Akteure:** Admin  
**Vorbedingung:** Nutzer ist eingeloggt (`is_admin=true` im JWT-Claim)

**Standardablauf:**
1. Admin öffnet `/admin` → Middleware prüft `is_admin`-Claim im JWT
2. Admin ist authentifiziert als Admin (lesende Operationen freigeschaltet)
3. Für destruktive Operationen: System fordert Re-Authentifizierung (`/admin/login`)
4. Admin gibt Passwort ein → `POST /admin/auth/session`
5. Backend verifiziert Passwort, generiert UUID-Token → in Redis gespeichert (15 Min TTL)
6. Frontend speichert Token in `sessionStorage`, Countdown-Timer startet
7. Admin-Session-Banner zeigt "Session aktiv" mit Countdown

**Alternativer Ablauf (4a – Falsches Passwort):**
- HTTP 401 → Fehlermeldung, Formular bleibt offen

**Alternativer Ablauf (Session abgelaufen):**
- Nach 15 Min: Token aus Redis entfernt, Banner zeigt "Keine aktive Admin-Session"
- Destruktive Operationen geben 401 zurück → Admin wird zu Login geleitet

**Nachbedingung:** Admin-Session-Token im sessionStorage, destruktive Endpunkte erreichbar für 15 Min

---

### UC13 – Nutzer verwalten

**Akteure:** Admin  
**Vorbedingung:** Admin ist eingeloggt (UC12 für destruktive Ops abgeschlossen)

**Standardablauf (Nutzerliste):**
1. Admin öffnet `/admin/users`
2. System lädt Nutzerliste (paginiert, 25/Seite) mit Filter-Tabs (Alle / Aktiv / Inaktiv / Premium / Unverifiziert)
3. Admin sucht nach Name/E-Mail/Matrikelnummer (debounced)
4. Admin klickt auf Zeile → Nutzer-Detailseite

**Standardablauf (Nutzer bearbeiten):**
1. Admin öffnet `/admin/users/{id}`
2. System zeigt: persönliche Daten, Studienplan-Zusammenfassung, Status-Toggles, Admin-Notizen, Danger Zone
3. Admin schaltet `is_active`/`is_premium`/`is_verified` um → `PATCH /admin/users/{id}` (kein Admin-Token nötig)
4. Admin bearbeitet interne Notizen → speichert via PATCH

**Standardablauf (Passwort-Reset):**
1. Admin klickt "Passwort zurücksetzen" → `POST /admin/users/{id}/reset-password` [Admin-Token]
2. Backend sendet Reset-E-Mail via Resend

**Standardablauf (Nutzer löschen):**
1. Admin klickt "Nutzer löschen" → DeleteDialog öffnet sich
2. Admin tippt "LÖSCHEN" zur Bestätigung
3. Admin-Token wird geprüft → `DELETE /admin/users/{id}` [Admin-Token + Begründung]
4. Alle Nutzerdaten werden gelöscht (Cascade), Audit-Log-Eintrag erstellt
5. Admin wird zur Nutzerliste zurückgeleitet

**Nachbedingung:** Nutzeränderungen sind persistiert, Audit-Log aktualisiert

---

### UC14 – PO-Daten verwalten (Hochschulen, Studiengänge, Module)

**Akteure:** Admin  
**Vorbedingung:** Admin-Session aktiv (für destruktive Ops)

**Standardablauf (Neues Modul anlegen):**
1. Admin navigiert zu `/admin/modules/new`
2. Füllt Formular aus (Name, Kürzel, ECTS, Typ, Prüfungsart, SWS, ...)
3. `POST /admin/modules` → Modul erstellt, Audit-Log-Eintrag
4. Modul erscheint im Katalog der Prüfungsordnung

**Standardablauf (Modul archivieren):**
1. Admin öffnet Modul-Detailseite
2. Klickt "Archivieren" → ArchiveDialog (Pflicht-Begründung)
3. Admin gibt Begründung ein, bestätigt
4. `POST /admin/modules/{id}/archive` [Admin-Token + Begründung] → `is_archived=true`
5. Modul verschwindet für Studierende (öffentliche API filtert automatisch)
6. Studierende mit diesem Modul im Plan behalten ihre Einträge (Bestandsschutz)

**Standardablauf (JSON-Import):**
1. Admin öffnet `/admin/import`, wählt Prüfungsordnung
2. Lädt JSON-Datei hoch oder gibt JSON direkt ein
3. System validiert Schema (client-seitig)
4. Vorschau: "37 neue Module, 0 Duplikate, 0 Fehler"
5. Admin bestätigt → `POST /admin/modules/import/json` [Admin-Token]
6. Ergebnis: "37 erstellt, Audit-Log-Eintrag erstellt"

**Nachbedingung:** PO-Daten aktualisiert, Audit-Log mit old/new-Werten

---

### UC15 – Analytics-Dashboard einsehen

**Akteure:** Admin  
**Vorbedingung:** Admin eingeloggt (lesender Zugriff, kein Admin-Token nötig)

**Standardablauf:**
1. Admin öffnet `/admin`
2. System lädt `GET /admin/stats` (13 KPI-Felder) + `GET /admin/stats/growth?period=30d`
3. Dashboard zeigt:
   - Primäre KPIs: Nutzer gesamt, Aktiv (30d), Premium, Bestandene Module (heute)
   - Sekundäre KPIs: Hochschulen, Studiengänge, Module im Katalog
   - Wachstums-LineChart (30 Tage Neuregistrierungen)
   - Datenbankgröße-Anzeige
4. Admin kann zu Detail-Statistiken navigieren (Modul-Rangliste, User-Segmentierung)

**Nachbedingung:** Admin hat Plattform-Überblick

---

### UC16 – Audit-Log einsehen

**Akteure:** Admin  
**Vorbedingung:** Admin eingeloggt

**Standardablauf:**
1. Admin öffnet `/admin/audit-log`
2. Filtert nach Entity-Typ, Aktion, Datum-Bereich
3. System zeigt paginierten Audit-Trail: Zeitstempel, Admin, Aktion, Entity, old/new-Werte, Begründung
4. Admin klickt auf Eintrag → vollständiger Log-Eintrag mit Diff

**Nachbedingung:** Admin kann jede Mutation nachvollziehen und ggf. manuell revertieren
