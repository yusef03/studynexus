# Architecture Decision Records (ADR) – StudyNexus

ADRs dokumentieren wichtige Architekturentscheidungen mit Kontext und Begründung.
Format: Titel, Status, Kontext, Entscheidung, Konsequenzen.

---

## ADR-001: FastAPI als Backend Framework

**Status:** Akzeptiert
**Datum:** 2026-04-18

**Kontext:**
Wir brauchen ein Python-Backend das modern, schnell und gut für KI-Integration geeignet ist.

**Entscheidung:**
FastAPI statt Django oder Flask.

**Begründung:**
- Automatische Swagger-Dokumentation
- Async-fähig von Anfang an
- Pydantic-Integration für Datenvalidierung
- Perfekt für KI-Integration (Python-Ökosystem)
- Schneller zu lernen als Django

**Konsequenzen:**
- Weniger eingebaute Features als Django (kein Admin-Panel)
- Manuelle Strukturierung nötig

---

## ADR-002: bcrypt direkt statt passlib

**Status:** Akzeptiert
**Datum:** 2026-04-18

**Kontext:**
Passwörter müssen sicher gehasht werden. Ursprünglich passlib[bcrypt] geplant.

**Entscheidung:**
bcrypt 4.1.3 direkt verwenden, passlib komplett entfernen.

**Begründung:**
- passlib seit Jahren nicht mehr aktiv gepflegt
- passlib inkompatibel mit bcrypt 5.x (AttributeError: module bcrypt has no attribute __about__)
- Direktes bcrypt ist einfacher, weniger Abhängigkeiten

**Konsequenzen:**
- Leicht mehr Code in security.py
- Keine passlib-spezifischen Features verfügbar

---

## ADR-003: httpOnly Cookie statt localStorage für JWT

**Status:** Akzeptiert
**Datum:** 2026-04-18

**Kontext:**
JWT Token muss nach Login im Browser gespeichert werden.

**Entscheidung:**
Token in httpOnly Cookie via Next.js API Proxy speichern.

**Begründung:**
- localStorage ist anfällig für XSS-Angriffe
- httpOnly Cookie ist für JavaScript nicht lesbar
- Server-Side Rendering funktioniert mit Cookies besser
- DSGVO-konformer Ansatz

**Konsequenzen:**
- Next.js API Routes als Proxy nötig
- Zwei API URLs erforderlich (NEXT_PUBLIC_API_URL + BACKEND_API_URL)
- CSRF-Schutz muss später ergänzt werden

---

## ADR-004: Zwei API URLs (Browser vs Docker-intern)

**Status:** Akzeptiert
**Datum:** 2026-04-18

**Kontext:**
Frontend läuft in Docker und muss Backend erreichen. Browser und Docker-Container haben unterschiedliche Netzwerke.

**Entscheidung:**
- NEXT_PUBLIC_API_URL=http://localhost:8000 (Browser)
- BACKEND_API_URL=http://backend:8000 (Docker-intern)

**Begründung:**
- Browser kann nicht auf Docker-interne Hostnamen zugreifen
- Docker-Container kommunizieren über interne Netzwerknamen
- Klare Trennung von Client-side und Server-side Anfragen

**Konsequenzen:**
- Zwei Umgebungsvariablen zu pflegen
- In .env.example dokumentiert

---

## ADR-005: next.config.js statt next.config.ts

**Status:** Akzeptiert
**Datum:** 2026-04-18

**Kontext:**
Next.js 14.2.3 wurde mit TypeScript-Konfigurationsdatei initialisiert.

**Entscheidung:**
next.config.ts zu next.config.js umbenennen und CommonJS-Syntax verwenden.

**Begründung:**
- Next.js 14.2.3 unterstützt .ts Konfiguration nicht
- Fehler: Configuring Next.js via next.config.ts is not supported

**Konsequenzen:**
- Keine TypeScript-Typprüfung in der Konfigurationsdatei
- Bei Next.js Upgrade auf 15+ kann .ts wieder aktiviert werden

---

## ADR-006: Monorepo-Struktur

**Status:** Akzeptiert
**Datum:** 2026-04-18

**Kontext:**
Frontend und Backend könnten in separaten Repositories liegen.

**Entscheidung:**
Alles in einem Repository (Monorepo).

**Begründung:**
- Einfachere Entwicklung als Einzelperson
- Ein Git-History für das gesamte Projekt
- Einfacheres Docker Compose Setup
- CLAUDE.md als zentrales Projektgedächtnis

**Konsequenzen:**
- Bei größerem Team könnten separate Repos sinnvoller sein
- CI/CD muss Frontend und Backend separat testen
