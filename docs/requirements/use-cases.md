# Use Cases – StudyNexus

## Akteure

| Akteur | Typ | Beschreibung |
|---|---|---|
| Anonymer Besucher | Menschlich | Nicht eingeloggter Nutzer, kann nur Registrierung starten |
| Studierender | Menschlich (primär) | Registrierter Hauptnutzer der Plattform |
| Globale PO-Datenbank | Technisch (extern) | Externes System, liefert Prüfungsordnungsstrukturen |
| KI-Subsystem | Intern | Teil des Systems, kein externer Akteur |

---

## Use Case Übersicht

| ID | Use Case | Akteur | Beziehung |
|---|---|---|---|
| UC01 | Registrieren | Anonymer Besucher | - |
| UC02 | Studiengang auswählen | Studierender | <<include>> UC03 |
| UC03 | PO synchronisieren | Globale PO-Datenbank | wird included von UC02 |
| UC04 | Noten und Status eintragen | Studierender | - |
| UC05 | Studienplan anpassen | Studierender | - |
| UC06 | Termine verwalten | Studierender | - |
| UC07 | Fokus-Zeiten blocken | Studierender | - |
| UC08 | Module evaluieren | Studierender | - |
| UC09 | PDF-Skripte hochladen | Studierender | <<extend>> UC10 |
| UC10 | Karteikarten/Tests generieren | KI-Subsystem | extends UC09 |
| UC11 | Study Space gründen | Studierender | - |

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
