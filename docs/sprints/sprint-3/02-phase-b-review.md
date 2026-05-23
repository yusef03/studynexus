# Sprint 3B Review – StudyNexus

**Sprint:** 3B – Mission Control (Kalender & Kanban)
**Zeitraum:** 27. April 2026
**Status:** 🟢 Abgeschlossen

---

## Sprint Ziel

Ausbau von StudyNexus zu einem vollwertigen "Mission Control" Cockpit für das Selbstmanagement. Entwicklung eines pixelgenauen Stundenplans und eines Drag & Drop Kanban-Boards mit Fokus auf extreme Zukunftsfähigkeit (Semester-Binding) und nahtlose Verknüpfung aller Termine.

---

## Erledigte User Stories

| Issue | User Story | Status |
|---|---|---|
| #18 | Als Studierender möchte ich meine Aufgaben im Kanban-Board organisieren | ✅ Done |
| #19 | Als Studierender möchte ich Vorlesungen in einem 15-Minuten Raster sehen | ✅ Done |
| #20 | Als Studierender möchte ich meine privaten und geschäftlichen Termine filtern | ✅ Done |
| #21 | Als Studierender möchte ich auf einem Radar sehen, was heute noch ansteht | ✅ Done |
| #22 | Als Studierender möchte ich Blockseminare außerhalb wöchentlicher Serien eintragen | ✅ Done |
| #23 | Als Studierender möchte ich das Cockpit optimal auf dem Smartphone nutzen (Mobile-First) | ✅ Done |
| #24 | Als Studierender möchte ich Klausuren-Countdowns und Abgaben priorisiert sehen | ✅ Done |
| #25 | Als Studierender möchte ich Fokus-Zeiten im Kalender klar vom Rest trennen | ✅ Done |

---

## Was wurde gebaut

### Architektur & Layout
- **Dashboard Refactoring:** Komplette Neustrukturierung in Nested-Routes (`/dashboard/schedule`, `/dashboard/kanban`, `/dashboard/modules`). Einführung einer skalierbaren **Sidebar**, die das Projekt für zukünftige Sprints (Wiki/Spaces) absichert.

### Kanban Board (`/dashboard/kanban`)
- Drag & Drop Funktionalität (HTML5) zur Organisation von Aufgaben.
- Spalten: `To Do`, `In Progress`, `Exam Ready`, `Done`.
- Verknüpfung von Tasks mit Hochschul-Modulen via `module_id`.

### Der Smart-Kalender (`/dashboard/schedule`)
- **CSS-Grid Engine:** Eigens geschriebenes, ressourcenschonendes 15-Minuten-Raster für Desktop.
- **Mobile Agenda-Ansicht:** Cleane Listen-Ansicht der Termine für Smartphones, die das Grid ersetzt.
- **Kollisions-Radar:** Das Backend validiert parallel liegende Termine und das UI generiert eine "Weiche Warnung" (`HTTP 409 Conflict`), ohne den User zu bevormunden.
- **Life-Sync Enum:** Unterstützung für Privatleben (`LIFE`), Nebenjob (`WORK`) und Fokus-Zeiten (`FOCUS`).
- **Semester-Binding:** Alle Events sind an das spezifische Semester-Tag (z.B. `WiSe2425`) gebunden.
- **Block-Termine:** Unterstützung für einmalige Termine (`event_date`) abseits des wöchentlichen Rhythmus.
- **Ghosting-Mode:** Termine können temporär via `is_hidden` ausgeblendet werden.

### Mission Hub Dashboard (`/dashboard`)
- **Smart Timeline:** Chronologische Filterung aller Kanban-Tasks. Sortiert `EXAM_READY` Tasks, Abgaben (`is_submission`) und Deadlines ganz nach oben.
- **Daily Focus Radar:** Live-Filter des Kalenders. Zeigt nur an, was *heute* ab der jetzigen Uhrzeit noch passiert.
- **Exam Countdown Widget:** Berechnet live die verbleibenden Tage bis zu den nächsten Klausuren und färbt sich bei kritischer Nähe rot und fängt an zu pulsieren.
- **Global Mobile Quick-Add:** Ein "Floating Action Button" (FAB) auf dem Handy, der global über alle Seiten hinweg die Anlage von Terminen, Aufgaben und Abgaben ermöglicht.

---

## Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| CSS-Grid statt Calendar Library | Heavyweight Libraries (z.B. FullCalendar) sind träge und lassen sich nur extrem aufwändig in Custom-Designs zwingen. Unser natives CSS-Grid ist performant und passgenau für die HsH. |
| Semester-Binding statt Datumschleifen | `is_recurring=True` war in der Basis endlos. Durch das `semester_tag` wird die Historie geschützt. |
| Weiche Kollisionen (Frontend-Toasts) | Geisteswissenschaftler haben oft überlappende Wunsch-Pläne. Hard-Blocks (400 Errors) frustrieren. Der Soft-Block (409) weist darauf hin, lässt aber per "Trotzdem Speichern" alle Freiheiten. |
| UI Auto-Fill (Smart Titles) | Reduzierung von Tipparbeit durch automatisches Abfangen von Modulnamen bei Selektion im Event-Modal. |

---

## Probleme und Lösungen

| Problem | Lösung |
|---|---|
| Endlos-Render Loops beim Drag&Drop | Nutzung modernster State-Updates via TanStack Mutations kombiniert mit sauberem React-Key Management. |
| `Semester undefined` Dropdown Bug | Anpassung der Pydantic-Schema Mapping-Logik, da das Backend `group.semester` als Flat-Number und nicht als verschachteltes Objekt sendet. |
| Fehlende Event-Container Verschachtelung | Syntaktische Fixes im Map-Loop des ScheduleBoards (schließende `div` Tags korrigiert). |

---

## Sprint 4 Vorschau

**Thema:** Community und Kollaboration
**Ziel:** Einführung von sozialen Lern-Features, anonymen Modul-Evaluationen und geteilten Lerngruppen (Study Spaces).

---

## User Manual & Use Cases (Sprint 3B)

Dieses Kapitel dient als detaillierte Anleitung und Use-Case-Dokumentation für alle Features des Mission Control Cockpits.

### Use Case 1: Kanban-Board für Aufgaben nutzen (`/dashboard/kanban`)
**Ziel:** Aufgaben, Deadlines und Klausurvorbereitungen strukturieren.
1. **Aufgabe anlegen:** Klicke oben rechts auf den Button "Neuer Task".
2. **Details ausfüllen:** 
   - Vergib einen Titel (z. B. "Zusammenfassung Software Engineering schreiben").
   - Wähle (optional) ein passendes Hochschul-Modul aus dem Dropdown.
   - Wähle eine Deadline (`due_date`) und setze die Priorität (`LOW`, `MEDIUM`, `HIGH`).
3. **Status verwalten (Drag & Drop):**
   - Der Task erscheint in der Spalte `To Do`.
   - Ziehe ihn mit der Maus in `In Progress`, sobald du anfängst zu lernen.
8. **Abgaben markieren:** 
   - Nutze den Haken "Ist eine Abgabe / Hausarbeit 📄", um den Task zu einer offiziellen Abgabe zu machen.
   - Er erhält ein eigenes Icon im Kanban-Board und wird in der "Smart Timeline" priorisiert behandelt (direkt nach Klausuren, vor "Hoher Priorität").

### Use Case 2: Wochenstundenplan aufbauen (`/dashboard/schedule`)
**Ziel:** Vorlesungen, Nebenjobs und Privatleben in einem 15-Minuten Raster übersichtlich organisieren.
1. **Block anlegen:** Klicke irgendwo in das leere Raster (z. B. am Dienstag um 10:00 Uhr). Ein Modal öffnet sich.
2. **Intelligentes Ausfüllen (Smart Titles):**
   - Wähle unter "Modul" dein Hochschul-Modul aus. Die Dropdown-Liste ist übersichtlich nach `Semester 1`, `Semester 2` etc. gruppiert.
   - Sobald du das Modul auswählst, füllt sich der "Titel" automatisch mit dem Modulnamen. Du kannst ihn aber manuell überschreiben.
3. **Farben & Typen wählen (Life-Sync):**
   - Ist es eine normale Vorlesung? Wähle `Vorlesung` (wird edles Blau).
   - Ist es dein Nebenjob? Wähle `Nebenjob / Arbeit` (wird Orange).
   - Willst du ungestört lernen? Wähle `🎧 Fokuszeit / Deep Work` (wird Bernstein-Gelb).
   - Ist es Sport oder ein Date? Wähle `Privates (Life)` (wird Lila).
4. **Wiederholungen vs. Einzeltermine:**
   - Standardmäßig ist "Wöchentlich wiederholen" aktiv. Das Event erscheint jede Woche im Raster.
   - Wenn du den Haken entfernst, erscheint ein Feld für ein exaktes Datum. Perfekt für Blockseminare am Wochenende!
5. **Klausur eintragen (Failsafe):**
   - Wählst du als Typ `Klausur / Prüfung` aus, wird der Wiederholungs-Haken automatisch gesperrt. Klausuren finden nur einmal statt! Die Kachel wird im Raster dick rot umrandet.
6. **Kollisionen auflösen:**
   - Trägst du zwei Termine zur exakt selben Zeit ein, springt das Frontend ein. Du erhältst einen gelben Toast-Alert: *"Zeit-Konflikt! Überschneidet sich mit [Modul X]."*.
   - Du darfst dennoch auf "Trotzdem Speichern" klicken. Die Kacheln ordnen sich dann im Raster elegant nebeneinander an.
7. **Ghosting-Mode (Termine ausblenden):**
   - Du gehst nicht mehr zur Vorlesung, willst sie aber für später nicht komplett löschen? Setze im Modal den Haken bei `Ghosting`.
   - Die Kachel verschwindet völlig. Oben über dem Raster gibt es einen "Geister-Blöcke anzeigen"-Schalter. Klickst du diesen, taucht die Vorlesung als halbtransparente, gestrichelte Kachel wieder auf.

### Use Case 3: Das Live-Cockpit nutzen (`/dashboard`)
**Ziel:** Morgens einloggen und sofort wissen, was heute am wichtigsten ist.
1. **Der Daily Focus (Rechtes Widget):**
   - Das System weiß auf die Sekunde genau, wie spät es ist.
   - Es zieht sich alle Vorlesungen und Privat-Termine für den *heutigen* Tag aus the Raster.
   - Es zeigt dir eine cleane Liste mit Zeit, Titel, Ort (📍) und Dozent (👨‍🏫).
   - **Zeitreise:** Ist es 14:00 Uhr und deine Mathe-Vorlesung (10:00 - 13:00) ist vorbei? Dann verschwindet sie vollautomatisch aus dem Radar! Du siehst immer *nur* das, was noch ansteht.
   - Ist the Tag vorbei (nach 20:00 Uhr oder wenn alle heutigen Termine erledigt sind), schaltet das Widget vollautomatisch um und zeigt dir das Badge **Morgen** sowie die Termine des Folgetages.
2. **Die Smart Timeline (Mitte):**
   - Hier musst du nichts konfigurieren, das System sortiert alles automatisch für dich aus dem Kanban-Board zusammen.
   - Ganz oben: Status `EXAM_READY` (rot pulsierend).
   - Danach: Checkbox "Abgabe" aktiv (📄 Icon).
   - Danach: Deadlines. Läuft eine Deadline in den nächsten 3 Tagen ab, wird das Datum rot hinterlegt!
   - Danach: Tasks ohne Deadline, aber mit Priorität `HIGH`.
3. **Exam Countdowns (Mitte-Rechts):**
   - Sobald du eine Klausur (`EXAM`) in den Stundenplan einträgst, wird diese Klausur hier im Radar auftauchen.
   - Du siehst den genauen Countdown in Tagen und einen schrumpfenden Fortschrittsbalken.
   - `< 30 Tage`: Balken wird Orange.
   - `< 14 Tage`: Balken wird Rot und fängt aggressiv an zu pulsieren.

### Use Case 4: Mobile-First Nutzung (Smartphone)
**Ziel:** StudyNexus auf dem Smartphone nutzen.
1. **Hamburger Menü:** Oben links findest du das Hamburger-Icon. Klicke darauf, um ein smoothes Slide-In-Menü zu öffnen. Von hier kannst du jederzeit in Module, Kanban oder den Stundenplan springen.
2. **Globaler Quick Add:** Egal wo du in der App bist, unten rechts schwebt ein großer "Plus"-Button. 
   - Klicke darauf, und er fächert sich auf.
   - Du hast die Wahl zwischen 📄 Abgabe, 📝 Aufgabe oder 📅 Termin. 
   - Klickst du eines davon, öffnet sich sofort das Formular, ohne dass du den Bereich wechseln musst.
3. **Mobile Agenda View:** Im Bereich "Stundenplan" wird auf dem Handy kein unleserliches Grid mehr gerendert. Du hast stattdessen eine chronologische, aufgeräumte Liste (Agenda) von Montag bis Sonntag, perfekt fürs Scrollen.
