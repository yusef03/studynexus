# Sprint 1 Review – StudyNexus

**Sprint:** 1 – Infrastruktur und Authentifizierung
**Zeitraum:** 18. April 2026
**Status:** 🟢 Abgeschlossen

---

## Sprint Ziel

Lauffähige Entwicklungsumgebung mit vollständigem Authentifizierungssystem.

---

## Erledigte User Stories

| Issue | User Story | Story Points | Status |
|---|---|---|---|
| #1 | Docker Compose Setup | 3 | ✅ Done |
| #2 | User Registrierung | 3 | ✅ Done |
| #3 | User Login und Logout | 2 | ✅ Done |
| #4 | Eingeloggt bleiben (JWT) | 3 | ✅ Done (httpOnly Cookie) |
| #5 | Login und Register UI | 3 | ✅ Done |
| #6 | Geschützte Seiten | 2 | ✅ Done |

**Gesamt:** 16 Story Points

---

## Was wurde gebaut

### Backend (FastAPI)
- POST /api/v1/auth/register – User erstellen mit bcrypt Passwort-Hash
- POST /api/v1/auth/login – JWT Token als httpOnly Cookie
- POST /api/v1/auth/logout – Cookie löschen
- GET /api/v1/ping + /api/v1/health – Health Checks
- Alembic Migration 0001 – users Tabelle in PostgreSQL
- get_current_user Dependency – Türsteher für geschützte Routen
- 10/10 Tests bestanden

### Frontend (Next.js)
- Landing Page (localhost:3000/de)
- Register Seite mit Formular und Passwort-Toggle
- Login Seite mit Formular und Passwort-Toggle
- Dashboard (geschützte Seite)
- Next.js API Proxy (httpOnly Cookie Sicherheit)
- Middleware – schützt alle Routen außer /, /login, /register
- i18n DE + EN vollständig
- 14/14 Tests bestanden

### Infrastruktur
- Docker Compose mit 4 Services (Next.js, FastAPI, PostgreSQL, Redis)
- Vollständige Ordnerstruktur
- GitHub Projects Scrum Board
- Issue Templates, PR Template

---

## Technische Entscheidungen

| Entscheidung | Begründung |
|---|---|
| bcrypt direkt statt passlib | passlib inkompatibel mit bcrypt 5.x |
| httpOnly Cookie statt localStorage | Schutz vor XSS-Angriffen |
| Next.js API Proxy | Browser sieht JWT nie direkt |
| next.config.js statt .ts | Next.js 14.2.3 unterstützt kein .ts Config |
| BACKEND_API_URL intern | Docker-internes Netzwerk nutzt backend:8000 |

---

## Probleme und Lösungen

| Problem | Lösung |
|---|---|
| npm ci scheitert ohne package-lock.json | npm install im Dockerfile, lock file extrahiert |
| next.config.ts nicht unterstützt | Umbenannt zu next.config.js |
| passlib + bcrypt 5.x inkompatibel | passlib entfernt, bcrypt direkt verwendet |
| .pytest_cache Berechtigungsfehler | sudo rm -rf vor Docker Build |
| Eingebettetes Git-Repo | git rm --cached, .gitignore erweitert |

---

## Metriken

| Metrik | Wert |
|---|---|
| Backend Tests | 10/10 ✅ |
| Frontend Tests | 14/14 ✅ |
| API Endpunkte | 5 |
| Neue Dateien | ~80 |
| Commits | 10 |
| Story Points | 16 |

---

## Sprint 2 Vorschau

**Thema:** Studienplan und Notenmanagement
**Ziel:** Studierende können Hochschule, Studiengang und Module verwalten sowie Noten eintragen

**Geplante Features:**
- Hochschul- und Studiengang-Auswahl
- Modul-Verwaltung (CRUD)
- Noteneingabe und GPA-Berechnung
- ECTS-Tracking
- Visueller Studienplan
