# Sprint-Plan – StudyNexus

## Übersicht

| Sprint   | Thema                       | Status  | Dauer    |
| -------- | --------------------------- | ------- | -------- |
| Sprint 0 | Setup und Anforderungen     | Fertig  | 1 Woche  |
| Sprint 1 | Infrastruktur und Auth      | Fertig  | 2 Wochen |
| Sprint 2 | Studienplan und Noten       | Aktuell | 2 Wochen |
| Sprint 3 | Mission Control Dashboard   | Geplant | 2 Wochen |
| Sprint 4 | Community und Kollaboration | Geplant | 2 Wochen |
| Sprint 5 | Gamification und KI         | Geplant | 2 Wochen |
| Sprint 6 | PWA, i18n und Launch        | Geplant | 2 Wochen |

---

## Sprint 1 – Infrastruktur und Authentifizierung

**Ziel:** Lauffähige Entwicklungsumgebung mit funktionierender User-Auth

**User Stories:**

- Als Entwickler möchte ich Docker Compose mit allen Services starten können
- Als Besucher möchte ich mich registrieren können (Email + Passwort)
- Als Nutzer möchte ich mich einloggen und ausloggen können
- Als Nutzer möchte ich eingeloggt bleiben (JWT Refresh Token)

**Technische Tasks:**

- [ ] docker-compose.yml (Next.js, FastAPI, PostgreSQL, Redis)
- [ ] FastAPI Projektstruktur (Router, Models, Schemas)
- [ ] SQLAlchemy User-Model + Alembic Migration
- [ ] POST /auth/register Endpoint
- [ ] POST /auth/login Endpoint (JWT)
- [ ] POST /auth/refresh Endpoint
- [ ] Next.js Auth.js v5 Integration
- [ ] Login/Register UI Seiten
- [ ] Protected Routes im Frontend

**Definition of Done:**

- Nutzer kann sich registrieren, einloggen und ausloggen
- JWT funktioniert mit Refresh Token
- Alle Endpunkte getestet (pytest)
- Code gepusht auf develop Branch

---

## Sprint 2 – Studienplan und Notenmanagement

**Ziel:** Nutzer kann seinen Studienplan verwalten und Noten eintragen

**User Stories:**

- Als Studierender möchte ich meine Hochschule und meinen Studiengang auswählen
- Als Studierender möchte ich Module anlegen und deren Status setzen
- Als Studierender möchte ich Noten eintragen und meinen GPA sehen
- Als Studierender möchte ich meine ECTS-Punkte automatisch berechnet bekommen

**Technische Tasks:**

- [ ] Hochschul- und Studiengang-Datenbank (Seed-Daten)
- [ ] Modul-Model + API Endpoints (CRUD)
- [ ] GPA- und ECTS-Berechnung (Backend-Logik)
- [ ] Studienplan UI (Modulliste mit Status und Noten)
- [ ] Semester-Planung (Modul einem Semester zuordnen)

---

## Sprint 3 – Mission Control Dashboard

**Ziel:** Zentrales Dashboard mit Stundenplan, Terminen und Kanban

**User Stories:**

- Als Studierender möchte ich einen Wochenstundenplan sehen
- Als Studierender möchte ich Termine eintragen, verschieben und löschen
- Als Studierender möchte ich alle Termine in einer Timeline sehen
- Als Studierender möchte ich meine Aufgaben in einem Kanban-Board verwalten

**Technische Tasks:**

- [ ] Termin-Model + API Endpoints
- [ ] Wochenstundenplan UI (responsive)
- [ ] Universal Mission Hub UI
- [ ] Smart Timeline Komponente
- [ ] Semester Kanban-Board (To Do / In Progress / Exam Ready / Done)
- [ ] Fokus-Zeiten / Routine-System

---

## Sprint 4 – Community und Kollaboration

**Ziel:** Soziale Features – Wiki, Evaluationen, Study Spaces

**User Stories:**

- Als Studierender möchte ich ein Modul anonym evaluieren
- Als Studierender möchte ich Lernmaterialien hochladen und teilen
- Als Studierender möchte ich eine Lerngruppe gründen
- Als Studierender möchte ich in meiner Lerngruppe ein geteiltes Kanban nutzen

**Technische Tasks:**

- [ ] Modul-Wiki Modell und API
- [ ] Anonyme Evaluation Endpoint (DSGVO-konform)
- [ ] PDF-Upload mit Verschlüsselung
- [ ] Study Space Modell und API
- [ ] Geteiltes Kanban-Board pro Study Space
- [ ] Berechtigungskonzept (privat / hochschulöffentlich)

---

## Sprint 5 – Gamification und KI-Features

**Ziel:** XP-System, Badges, Streaks und KI-gestützte Planung

**User Stories:**

- Als Studierender möchte ich XP für abgeschlossene Aufgaben verdienen
- Als Studierender möchte ich Badges für Meilensteine erhalten
- Als Studierender möchte ich KI-Empfehlungen für meinen Studienplan
- Als Studierender möchte ich aus PDFs automatisch Karteikarten generieren

**Technische Tasks:**

- [ ] XP- und Badge-System (Backend)
- [ ] Streak-Tracking
- [ ] Skill-Tree Visualisierung (interaktiver Modul-Graph)
- [ ] LangChain Integration (OpenAI / Claude API)
- [ ] PDF-Analyse Endpoint
- [ ] Karteikarten-Generator

---

## Sprint 6 – PWA, i18n und Launch

**Ziel:** Produktionsreife App – offline, mehrsprachig, deployed

**User Stories:**

- Als Nutzer möchte ich die App auch offline nutzen können
- Als Nutzer möchte ich die Sprache zwischen Deutsch und Englisch wechseln
- Als Nutzer möchte ich die App auf meinem Handy installieren können

**Technische Tasks:**

- [ ] Service Worker und Offline-Cache
- [ ] next-intl Integration (DE / EN)
- [ ] Lighthouse PWA Score >= 90 erreichen
- [ ] GitHub Actions CI/CD Pipeline
- [ ] Security Audit (OWASP Top 10)
- [ ] Cloud Deployment (Railway oder Render)
- [ ] Produktions-Docker-Compose
