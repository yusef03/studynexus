# Sprint 3.5 Review – StudyNexus

**Sprint:** 3.5 – Mobile Ergonomics
**Zeitraum:** 27. April 2026
**Status:** 🟢 Abgeschlossen

---

## Sprint Ziel

Optimierung der mobilen Benutzererfahrung für StudyNexus. Einführung von Features, die das tägliche Studienmanagement auf dem Smartphone ermöglichen, ohne auf Desktop-Funktionalität angewiesen zu sein.

---

## Erledigte User Stories

| Issue | User Story | Status |
|---|---|---|
| #26 | Als Studierender möchte ich auf dem Handy schnell Aufgaben, Abgaben und Termine anlegen | ✅ Done |
| #27 | Als Studierender möchte ich meinen Stundenplan auf dem Handy in einer Listenansicht sehen | ✅ Done |
| #28 | Als Studierender möchte ich sehen, wie viele Tage noch bis zu meiner nächsten Klausur sind | ✅ Done |
| #29 | Als Studierender möchte ich Abgaben visuell von normalen Aufgaben unterscheiden können | ✅ Done |

---

## Was wurde gebaut

### Mobile Quick Add (Floating Action Button)
- Schwebendes `+`-Icon unten rechts auf dem Bildschirm, global auf allen Seiten verfügbar.
- Fächert sich auf zu drei Optionen: 📄 Abgabe, 📝 Aufgabe, 📅 Termin.
- Öffnet direkt das passende Modal, ohne Seitenwechsel.

### Mobile Agenda View
- Auf Smartphones (< 768px) wird das Desktop-CSS-Grid durch eine chronologische Listenansicht ersetzt.
- Gruppiert nach Wochentagen (Montag bis Sonntag), sortiert nach Startzeit.
- Farbcodierung identisch zum Desktop-Grid (Vorlesung=Blau, Arbeit=Orange, Fokus=Amber etc.).

### Exam Countdown Widget
- Dashboard-Widget das alle anstehenden Klausuren (`event_type = EXAM`) chronologisch anzeigt.
- Countdown in Tagen mit schrumpfendem Fortschrittsbalken.
- Farbsystem: Grün (> 30 Tage), Orange (< 30 Tage), Rot + Pulsieren (< 14 Tage).

### Submissions Support
- Neues `is_submission` Flag auf Tasks.
- Abgaben erhalten ein eigenes 📄-Icon im Kanban-Board.
- Smart Timeline priorisiert Abgaben direkt nach Klausuren.

### Focus Time
- Neuer Event-Typ `FOCUS` (🎧 Fokuszeit / Deep Work).
- Distinct amber/gold Styling mit Glow-Effekt im Schedule-Board.

---

## Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Floating Action Button statt Toolbar | Mobile First: weniger Platz wird verbraucht, schnellere Interaktion mit einer Hand |
| Agenda-View statt Mini-Grid | CSS-Grid auf 375px Breite ist unlesbar. Chronologische Listen sind auf dem Handy ergonomischer |
| `text-base md:text-sm` Pattern | iOS Safari Auto-Zoom Fix: Inputs mit font-size < 16px triggern ungewolltes Zoomen |

---

## Bugfixes

| Problem | Lösung |
|---|---|
| iOS Safari Auto-Zoom auf Input-Feldern | `text-base` (16px) als Basis-Schriftgröße für alle Inputs |
| CSRF Origin Mismatch bei Mobile Login | Dynamische Host/Origin Prüfung in der Middleware statt hardcoded localhost |
| Missing TypeScript types for Tasks | Neues `task.ts` typing file erstellt |
