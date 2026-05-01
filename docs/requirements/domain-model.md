# Domänenmodell – StudyNexus

## Klassen und Attribute

| Klasse | Attribut | Typ | Beschreibung |
|---|---|---|---|
| Studierender | benutzername | String | Eindeutiger Anzeigename |
| | hochschule | String | Eingeschriebene Hochschule |
| | matrikelnummer | String | HsH-Matrikelnummer |
| | geburtsdatum | Date | Geburtsdatum |
| | aktueller_gpa | Float | Berechneter Notendurchschnitt |
| | gesamt_ects | Integer | Erreichte ECTS-Punkte gesamt |
| Prüfungsordnung | version | String | z.B. PO 2022 |
| | fakultät | String | Zugehörige Fakultät |
| | studiengang | String | z.B. Informatik B.Sc. |
| | hochschule | String | Zugehörige Hochschule |
| Modul | bezeichnung | String | Name des Moduls |
| | status | Enum | PLANNED / REGISTERED / PASSED / FAILED |
| | note | Float | Eingetragene Note (1.0 – 5.0) |
| | ects_punkte | Integer | ECTS-Wert des Moduls |
| | semester | Integer | Geplantes Semester laut Studienplan |
| Task | titel | String | Aufgabenbezeichnung |
| | beschreibung | String | Detailbeschreibung |
| | status | Enum | TODO / IN_PROGRESS / EXAM_READY / DONE |
| | priorität | Enum | LOW / MEDIUM / HIGH |
| | fälligkeitsdatum | Date | Deadline |
| | ist_abgabe | Boolean | Markiert als Abgabe / Hausarbeit |
| | modul_id | FK | Verknüpfung mit Hochschul-Modul |
| Event | titel | String | Bezeichnung des Termins |
| | event_typ | Enum | LECTURE / EXERCISE / TUTORIAL / SEMINAR / PRACTICUM / CUSTOM_STUDY / FOCUS / EXAM / WORK / LIFE |
| | wochentag | Integer | 0=Mo bis 6=So (für wiederkehrende Termine) |
| | event_datum | Date | Spezifisches Datum (für Einzeltermine) |
| | startzeit | Time | Startzeit |
| | endzeit | Time | Endzeit |
| | ist_wiederkehrend | Boolean | Wöchentlich wiederholend |
| | ist_versteckt | Boolean | Ghosting-Modus (temporär ausgeblendet) |
| | ort | String | Raum oder online |
| | dozent | String | Name des Dozenten |
| | semester_tag | String | z.B. WiSe2425 – bindet Event an ein Semester |
| | modul_id | FK | Verknüpfung mit Hochschul-Modul |
| Study Space | name | String | Name der Lerngruppe |
| | beschreibung | String | Kurzbeschreibung |
| | erstellt_am | DateTime | Erstellungszeitpunkt |
| | max_mitglieder | Integer | Maximale Gruppengröße |
| Dokument | titel | String | Dateiname oder Titel |
| | datei_typ | String | z.B. PDF, PNG |
| | upload_datum | DateTime | Zeitpunkt des Uploads |
| | ist_öffentlich | Boolean | Sichtbar für andere Studierende |

---

## Assoziationen und Multiplizitäten

| Von | Zu | Multiplizität | Bedeutung |
|---|---|---|---|
| Studierender | Prüfungsordnung | 0..* zu 1 | Viele Studierende studieren nach genau einer geltenden PO |
| Studierender | Modul | 1 zu 0..* | Ein Studierender hat viele Module in seinem Skill-Tree |
| Studierender | Task | 1 zu 0..* | Ein Studierender verwaltet viele Aufgaben (Kanban) |
| Studierender | Event | 1 zu 0..* | Ein Studierender hat viele Termine (Stundenplan) |
| Studierender | Study Space | 1..* zu 0..* | Mehrere Studierende sind in mehreren Study Spaces |
| Studierender | Dokument | 1 zu 0..* | Ein Studierender lädt viele Dokumente hoch |
| Study Space | Dokument | 1 zu 0..* | Ein Study Space enthält viele geteilte Dokumente |
| Task | Modul | 0..* zu 0..1 | Tasks können optional mit einem Modul verknüpft sein |
| Event | Modul | 0..* zu 0..1 | Events können optional mit einem Modul verknüpft sein |

---

## Hinweise zum Modell

- **GPA** wird dynamisch berechnet aus allen Modul-Noten mit Status bestanden
- **ECTS gesamt** summiert automatisch alle bestandenen Module
- **Dokument** wurde als eigene Klasse ergänzt (fachlich notwendig für das Modul-Wiki und Study Spaces)
- **Event-Typen** als Enum statt Freitext – verhindert Inkonsistenzen in der Datenbank
- **Task-Status** bildet die Kanban-Spalten ab (TODO → IN_PROGRESS → EXAM_READY → DONE)
- **Semester-Tag** bindet Events an ein konkretes Semester und schützt historische Stundenpläne
- **Ghosting** erlaubt temporäres Ausblenden von Events ohne Löschung
- **ist_öffentlich** bei Dokument implementiert das Berechtigungskonzept (DSGVO)
