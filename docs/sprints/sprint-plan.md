# Sprint-Plan – StudyNexus

## Übersicht

| Sprint   | Thema                                      | Status       | Dauer    |
| -------- | ------------------------------------------ | ------------ | -------- |
| Sprint 0 | Setup und Anforderungen                    | ✅ Fertig    | 1 Woche  |
| Sprint 1 | Infrastruktur und Auth                     | ✅ Fertig    | 2 Wochen |
| Sprint 2 | Studienplan und Noten                      | ✅ Fertig    | 2 Wochen |
| Sprint 3 | Dashboard + E-Mail-Verifikation            | 🔵 Aktuell  | 2 Wochen |
| Sprint 4 | Community und Kollaboration                | Geplant      | 2 Wochen |
| Sprint 5 | Gamification, KI und Admin-Panel           | Geplant      | 2 Wochen |
| Sprint 6 | PWA, i18n, Branding und Launch             | Geplant      | 2 Wochen |

---

## Sprint 1 – Infrastruktur und Authentifizierung ✅

**Ziel:** Lauffähige Entwicklungsumgebung mit funktionierender User-Auth

**User Stories:**

- Als Entwickler möchte ich Docker Compose mit allen Services starten können
- Als Besucher möchte ich mich registrieren können (Email + Passwort)
- Als Nutzer möchte ich mich einloggen und ausloggen können
- Als Nutzer möchte ich eingeloggt bleiben (JWT Refresh Token)

**Erledigte Tasks:**

- [x] docker-compose.yml (Next.js, FastAPI, PostgreSQL, Redis)
- [x] FastAPI Projektstruktur (Router, Models, Schemas)
- [x] SQLAlchemy User-Model + Alembic Migration 0001
- [x] POST /auth/register Endpoint
- [x] POST /auth/login Endpoint (JWT, httpOnly Cookie)
- [x] POST /auth/logout Endpoint
- [x] Login/Register UI Seiten (Next.js, shadcn/ui)
- [x] Protected Routes im Frontend
- [x] Passwort-Sichtbarkeits-Toggle (Login + Register)

---

## Sprint 2 – Studienplan und Notenmanagement ✅

**Ziel:** Nutzer kann seinen Studienplan verwalten und Noten eintragen

**User Stories:**

- Als Studierender möchte ich meine Hochschule und meinen Studiengang auswählen
- Als Studierender möchte ich Module anlegen und deren Status setzen
- Als Studierender möchte ich Noten eintragen und meinen GPA sehen
- Als Studierender möchte ich meine ECTS-Punkte automatisch berechnet bekommen

**Erledigte Tasks:**

- [x] 7 neue DB-Modelle: University, Faculty, Program, ExamRegulation, Module, UserProgram, StudentModule
- [x] Alembic Migration 0002: alle 7 Tabellen + HSH-Seed (32 Module, 6 Semester, 180 ECTS)
- [x] Alembic Migration 0003: kuerzel (BIN-101…BIN-603), gewichtung-Korrekturen, ECTS-Fixes, 9 Wahlpflichtmodule, has_prerequisites
- [x] 5 öffentliche Endpunkte (Hochschul-/Studiengangskatalog)
- [x] 8 geschützte Endpunkte (Studienplan + Notenmanagement)
- [x] GPA-Service: sum(note×ects×gewichtung) / sum(ects×gewichtung)
- [x] Stats-Endpunkt (GPA, ECTS, Fortschritt, Modulzählungen)
- [x] 66 Backend-Tests, alle grün
- [x] Docs: docs/api/study-plan.md + docs/api/stats.md

**Ausstehend (auf Sprint 3 verschoben):**

- [ ] Frontend: Hochschul-/Studiengangsauswahl UI
- [ ] Frontend: Modulliste gruppiert nach Semester
- [ ] Frontend: Noteneingabe-Formular mit Validierung
- [ ] Frontend: Stats-Dashboard mit GPA und Fortschrittsbalken

---

## Sprint 3 – Dashboard + E-Mail-Verifikation 🔵

**Ziel:** Mission Control Dashboard + HsH-spezifische Registrierung absichern

**User Stories:**

- Als Studierender möchte ich nach der Registrierung meine E-Mail-Adresse bestätigen
- Als Studierender möchte ich mich nur mit meiner HsH-Adresse registrieren können
- Als Studierender möchte ich meine Matrikelnummer hinterlegen
- Als Studierender möchte ich einen Wochenstundenplan sehen
- Als Studierender möchte ich Termine eintragen, verschieben und löschen
- Als Studierender möchte ich meine Aufgaben in einem Kanban-Board verwalten

**Technische Tasks:**

- [ ] E-Mail-Domainvalidierung: nur @stud.hs-hannover.de erlaubt (Backend + Frontend)
- [ ] E-Mail-Verifikation: 6-stelliger Code per E-Mail, Pflicht vor erstem Login
- [ ] Matrikelnummer: Pflichtfeld im User-Modell (Alembic Migration 0004)
- [ ] Frontend: Studienplan-UI (Modulliste, Noteneingabe, Stats-Dashboard)
- [ ] Termin-Model + API Endpoints
- [ ] Wochenstundenplan UI (responsive)
- [ ] Universal Mission Hub UI
- [ ] Smart Timeline Komponente
- [ ] Semester Kanban-Board (To Do / In Progress / Exam Ready / Done)

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

## Sprint 5 – Gamification, KI und Admin-Panel

**Ziel:** XP-System, Badges, KI-Planung und Admin-Verwaltung für POs

**User Stories:**

- Als Studierender möchte ich XP für abgeschlossene Aufgaben verdienen
- Als Studierender möchte ich Badges für Meilensteine erhalten
- Als Studierender möchte ich KI-Empfehlungen für meinen Studienplan
- Als Studierender möchte ich aus PDFs automatisch Karteikarten generieren
- Als Admin möchte ich Studiengänge und POs im Admin-Panel verwalten

**Technische Tasks:**

- [ ] XP- und Badge-System (Backend)
- [ ] Streak-Tracking
- [ ] Skill-Tree Visualisierung (interaktiver Modul-Graph)
- [ ] LangChain Integration (OpenAI / Claude API)
- [ ] PDF-Analyse Endpoint
- [ ] Karteikarten-Generator
- [ ] Admin-Panel (Yusef-only): Studiengänge, POs, Module anlegen/bearbeiten
- [ ] is_admin Flag auf User-Modell + Admin-Auth-Guard
- [ ] Admin-API: CRUD für University, Faculty, Program, ExamRegulation, Module

---

## Sprint 6 – PWA, i18n, Branding und Launch

**Ziel:** Produktionsreife App – offline, mehrsprachig, mit HsH-Branding deployed

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
- [ ] Branding: StudyNexus-Logo + HsH-Farbschema + offizielle Typografie
- [ ] HsH-Logo-Integration (Lizenzklärung)
- [ ] Launch-Landing-Page
