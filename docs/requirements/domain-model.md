# Domänenmodell – StudyNexus

## Klassen und Attribute

| Klasse | Attribut | Typ | Beschreibung |
|---|---|---|---|
| Studierender | benutzername | String | Eindeutiger Anzeigename |
| | hochschule | String | Eingeschriebene Hochschule |
| | aktueller_gpa | Float | Berechneter Notendurchschnitt |
| | gesamt_ects | Integer | Erreichte ECTS-Punkte gesamt |
| Prüfungsordnung | version | String | z.B. PO 2022 |
| | fakultät | String | Zugehörige Fakultät |
| | studiengang | String | z.B. Informatik B.Sc. |
| | hochschule | String | Zugehörige Hochschule |
| Modul | bezeichnung | String | Name des Moduls |
| | status | Enum | offen / in Bearbeitung / bestanden / nicht bestanden |
| | note | Float | Eingetragene Note (1.0 – 5.0) |
| | ects_punkte | Integer | ECTS-Wert des Moduls |
| | semester | Integer | Geplantes Semester laut Studienplan |
| Termin | titel | String | Bezeichnung des Termins |
| | datum | DateTime | Datum und Uhrzeit |
| | termin_art | Enum | Klausur / Abgabe / Vorlesung / Sonstiges |
| | ort | String | Raum oder online |
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
| Studierender | Termin | 1 zu 0..* | Ein Studierender verwaltet viele Termine |
| Studierender | Study Space | 1..* zu 0..* | Mehrere Studierende sind in mehreren Study Spaces |
| Studierender | Dokument | 1 zu 0..* | Ein Studierender lädt viele Dokumente hoch |
| Study Space | Dokument | 1 zu 0..* | Ein Study Space enthält viele geteilte Dokumente |

---

## Hinweise zum Modell

- **GPA** wird dynamisch berechnet aus allen Modul-Noten mit Status bestanden
- **ECTS gesamt** summiert automatisch alle bestandenen Module
- **Dokument** wurde als eigene Klasse ergänzt (nicht im Original-Text explizit, aber fachlich notwendig für das Modul-Wiki und Study Spaces)
- **Termin-Arten** als Enum statt Freitext – verhindert Inkonsistenzen in der Datenbank
- **ist_öffentlich** bei Dokument implementiert das Berechtigungskonzept (DSGVO)
