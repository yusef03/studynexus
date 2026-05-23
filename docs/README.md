# StudyNexus — Zentrale Dokumentation (Map of Content)

Willkommen in der zentralen Projektdokumentation von StudyNexus. Um das Projekt übersichtlich und pflegbar zu halten, ist das Wissen in folgende Bereiche strukturiert:

## 📁 Verzeichnis-Struktur

### 1. [Sprints (`/sprints`)](sprints/)
Die chronologische Entwicklung des Projekts. Jeder Sprint hat seinen eigenen Ordner mit Plänen, Reviews und Bug-Reports.
- `sprint-plan.md` ist der Master-Plan für alle Sprints.
- `sprint-5/` enthält z.B. das aktuelle Admin-Panel.

### 2. [Requirements (`/requirements`)](requirements/)
Hier liegt das "Was" und "Warum".
- `use-cases.md`: Generelle User-Stories (Studenten)
- `admin-po-use-cases.md`: Vollständige Use-Cases für das Admin-Panel (sehr detailliert)
- `domain-model.md`: Beschreibung der Datenbank-Entitäten
- `nfas.md`: Nicht-funktionale Anforderungen

### 3. [API-Referenz (`/api`)](api/)
Spezifikationen und Payload-Beispiele für unsere FastAPI-Routen.
*(Siehe das lokale `README.md` im Ordner für eine Endpunkt-Übersicht)*

### 4. [Architektur (`/architecture`)](architecture/)
Entscheidungen, die die technische Basis betreffen.
- `decisions.md`: Architecture Decision Records (ADRs). Alle großen technischen Entscheidungen werden hier mit Kontext und Begründung festgehalten.

### 5. [Qualitätssicherung (`/qa`)](qa/)
- Offizielle Abnahme- und Testberichte (z.B. der formale Abschluss von Sprint 5).

### 6. [PO-Testdokumente (`/pos_test`)](pos_test/)
- Original-PDFs der Hochschule Hannover (Prüfungsordnungen, ATPO, Modulhandbücher), die als rechtliche Grundlage für die App dienen.

---

> **Regel:** Bevor du Code schreibst, lies immer die globale `ANTIGRAVITY.md` im Projekt-Root. Sie enthält die destillierte Wahrheit aller hier abgelegten Dokumente!
