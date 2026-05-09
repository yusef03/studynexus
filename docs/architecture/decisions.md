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
- passlib inkompatibel mit bcrypt 5.x (AttributeError: module bcrypt has no attribute **about**)
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
- ANTIGRAVITY.md als zentrales Projektgedächtnis

**Konsequenzen:**

- Bei größerem Team könnten separate Repos sinnvoller sein
- CI/CD muss Frontend und Backend separat testen

---

## ADR-007: HsH-only Plattform

**Status:** Akzeptiert
**Datum:** 2026-04-19

**Kontext:**
StudyNexus könnte als generische Studienplattform für alle Hochschulen konzipiert werden.
Die Datengrundlage (POs, Module, Studiengänge) wird jedoch manuell gepflegt und erfordert
erheblichen Aufwand. Für den MVP und die initiale Nutzerbasis ist eine Beschränkung sinnvoll.

**Entscheidung:**
StudyNexus ist zunächst ausschließlich für Studierende der Hochschule Hannover (HsH).
Registrierung ist nur mit einer @stud.hs-hannover.de E-Mail-Adresse möglich.

**Begründung:**

- Fokus ermöglicht schnellere Markteinführung mit hoher Qualität für eine Zielgruppe
- PO-Daten können sorgfältig gepflegt werden, bevor weitere Hochschulen ongeboardet werden
- Vertrauensaufbau in einer bekannten Community (Word-of-Mouth in der HsH)
- Reduziert Missbrauchsrisiko durch unbekannte externe Nutzer
- Einfachere DSGVO-Konformität mit überschaubarem Nutzerkreis

**Konsequenzen:**

- E-Mail-Domainvalidierung im Backend (register-Endpoint) und Frontend (Formularvalidierung)
- Klare Kommunikation auf der Landing Page: „Für HsH-Studierende"
- Erweiterung auf andere Hochschulen erst nach stabilem Admin-Panel (Sprint 5+)

---

## ADR-008: E-Mail-Domainvalidierung (@stud.hs-hannover.de)

**Status:** Akzeptiert
**Datum:** 2026-04-19

**Kontext:**
Folgt aus ADR-007. Die technische Umsetzung der HsH-Beschränkung muss definiert werden.

**Entscheidung:**
Der Backend-Register-Endpoint prüft die E-Mail-Domain und lehnt alle Adressen ab, die nicht
auf `@stud.hs-hannover.de` enden. Das Frontend zeigt vorab eine entsprechende Fehlermeldung.
Die Validierung wird in Sprint 3 implementiert.

**Begründung:**

- Server-seitige Validierung als primäre Sicherheitsebene (Frontend ist umgehbar)
- Frontend-Validierung verbessert UX (sofortiges Feedback)
- Einfache, wartbare Implementierung via Pydantic-Validator

**Konsequenzen:**

- Pydantic-Validator auf dem `email`-Feld in `RegisterRequest`
- Fehlermeldung: HTTP 422 mit klarem Hinweis auf HsH-Domain
- i18n-Keys für die Fehlermeldung in de.json / en.json
- Später erweiterbar: Whitelist von zugelassenen Domains in der Konfiguration

---

## ADR-009: Admin-only PO-Verwaltung

**Status:** Akzeptiert
**Datum:** 2026-04-19

**Kontext:**
Prüfungsordnungen (POs), Studiengänge und Modulkataloge müssen in der Datenbank gepflegt werden.
Alternativen wären: automatisches Scraping, Community-Beiträge (Wikipedia-Modell) oder Admin-Pflege.

**Entscheidung:**
POs und Modulkataloge werden ausschließlich manuell durch den Admin (Yusef) über ein
Admin-Panel gepflegt. Kein Crowdsourcing, kein Scraping.

**Begründung:**

- Offizielle PO-Dokumente sind die einzig verlässliche Quelle; Fehler würden Studierende
  bei Studienplanentscheidungen irreführen
- Scraping ist fragil und rechtlich unklar
- Crowdsourcing erfordert Moderationsaufwand und Verifikationsprozesse
- Als Einzelentwickler und HSH-Student hat Yusef direkten Zugang zu den offiziellen Dokumenten
- Qualität über Quantität: lieber ein akkurat gepflegter Studiengang als viele fehlerhafte

**Konsequenzen:**

- `is_admin` Flag auf dem User-Modell (Sprint 5)
- Admin-Panel als separate Next.js-Route, nur für is_admin=True zugänglich
- Admin-API-Endpunkte: CRUD für University, Faculty, Program, ExamRegulation, Module
- PO-Daten werden vorerst per Alembic-Seed-Migrationen eingetragen (Sprints 1–4)
- Admin-Panel ersetzt manuelle Migrationen ab Sprint 5

---

## ADR-010: Module Prerequisites via Database Table (not hardcoded)

**Status:** Akzeptiert
**Datum:** 2026-04-20

**Kontext:**
Prerequisite rules across different POs vary significantly (e.g. particular modules needed vs. generic ECTS thresholds vs. Vorprüfung).

**Entscheidung:**

- Never hardcode semester prerequisite logic (e.g. if semester == 4...)
- Create `module_prerequisites` table in Sprint 3A migration:
  - id (UUID)
  - module_id (FK → modules) - the module you want to take
  - required_module_id (FK → modules, nullable) - specific module required
  - minimum_ects_required (Integer, nullable) - ECTS threshold required
  - description (String) - human readable rule

**Begründung:**

- This supports all PO rules: specific module deps AND ECTS thresholds
- Replaces has_prerequisites boolean (which is too simple)

---

## ADR-011: Email Provider = Resend

**Status:** Akzeptiert
**Datum:** 2026-04-20

**Kontext:**
Wir brauchen einen zuverlässigen E-Mail-Provider für Verifizierungscodes.

**Entscheidung:**

- Provider: Resend (resend.com)
- Python SDK: resend (pip install resend)
- Free tier: 3000 emails/month

**Begründung:**

- Use case: Email verification codes (6-digit, expires in 15 min)
- Implement in Sprint 3A

---

## ADR-012: CSRF Protection via Custom Header

**Status:** Akzeptiert
**Datum:** 2026-04-26

**Kontext:**
Als SPA mit httpOnly Cookies ist das System anfällig für CSRF-Angriffe. Klassische CSRF-Token
erfordern serverseitige Session-State, was dem JWT-Ansatz widerspricht.

**Entscheidung:**

- Next.js Middleware validiert einen Custom Header `x-studynexus-client: true` auf allen
  mutierenden Requests (POST, PUT, DELETE, PATCH)
- Zusätzlich: Origin/Host Header-Prüfung gegen Cross-Origin Requests
- Erlaubte Origin wird über `NEXT_PUBLIC_APP_URL` Umgebungsvariable konfiguriert

**Begründung:**

- Custom Headers können von Cross-Origin Requests nicht ohne CORS-Preflight gesetzt werden
- Einfacher als Token-basierter CSRF-Schutz, aber effektiv gegen die meisten Angriffsvektoren
- Kombiniert mit httpOnly Cookies und SameSite=lax bietet dies ein solides Sicherheitsniveau

**Konsequenzen:**

- Alle Frontend fetch-Calls müssen `x-studynexus-client: true` Header mitsenden
- API-Proxy-Routes leiten den Header nicht weiter (er wird nur von der Middleware geprüft)

---

## ADR-013: Vollständige i18n via next-intl

**Status:** Akzeptiert
**Datum:** 2026-04-29

**Kontext:**
Internationalisierung war ursprünglich für Sprint 6 geplant. Die Professionalisierung der
Plattform in Sprint 3.7 erforderte jedoch eine sofortige Umsetzung.

**Entscheidung:**

- `next-intl` als i18n-Bibliothek (bereits im Projekt vorhanden, aber nur teilweise genutzt)
- Alle UI-Strings in `messages/de.json` und `messages/en.json` ausgelagert
- `useTranslations()` Hook in allen Komponenten, keine hardcodierten Strings
- Locale-basiertes URL-Routing (`/de/...` und `/en/...`)
- Datumsformatierung via `useLocale()` + `date-fns` Locale-Objekte

**Begründung:**

- next-intl integriert sich nahtlos mit dem Next.js App Router
- URL-basiertes Routing ermöglicht SEO-freundliche mehrsprachige Seiten
- Kein Build-Time i18n nötig – alles dynamisch zur Runtime

**Konsequenzen:**

- Jede neue Komponente muss Translation-Keys verwenden, nie hardcodierte Strings
- Neue Sprachen (z.B. Türkisch) können durch einfaches Hinzufügen einer JSON-Datei ergänzt werden
- Performance: Minimal – next-intl lädt nur die aktive Sprach-Datei

---

## ADR-014: Token Lifetime 7 Tage (Development)

**Status:** Akzeptiert
**Datum:** 2026-04-29

**Kontext:**
Die ursprüngliche Token-Lebensdauer von 30 Minuten führte zu häufigen "Not authenticated"
Fehlern während normaler Nutzung. Studierende arbeiten oft in langen Sessions.

**Entscheidung:**

- `ACCESS_TOKEN_EXPIRE_MINUTES=10080` (7 Tage) in der `.env`-Datei
- Cookie `maxAge` auf `60 * 60 * 24 * 7` (7 Tage) synchronisiert
- Frontend: Bei 401-Antworten wird automatisch zum Login weitergeleitet

**Begründung:**

- 30 Minuten ist für eine Studien-App inakzeptabel kurz
- Studierende loggen sich einmal ein und erwarten, dass die App "einfach funktioniert"
- In Produktion kann der Wert angepasst werden, ohne Code-Änderungen

**Konsequenzen:**

- Kompromiss: Längere Token-Gültigkeit = größeres Fenster bei Token-Diebstahl
- Mitigiert durch: httpOnly Cookie (nicht per JS auslesbar), SameSite=lax, CSRF-Schutz
- Für Produktion: Wert sollte auf 1–3 Tage reduziert werden + Refresh Token Mechanismus

---

## ADR-015: @dnd-kit statt HTML5 Drag and Drop

**Status:** Akzeptiert
**Datum:** 2026-05-07

**Kontext:**
Die bisherige DnD-Implementierung (Kanban Board + Studienplan) basierte auf dem nativen HTML5
Drag and Drop API mit dem `mobile-drag-drop` Polyfill (Release Candidate v3.0.0-rc.0).
Auf mobilen Geräten war das Erlebnis unbrauchbar: kein visuelles Feedback, kein natives Scrollen
möglich, und häufige Ghost-Effekte.

**Entscheidung:**

- `@dnd-kit/core`, `@dnd-kit/sortable` und `@dnd-kit/utilities` als einheitliche DnD-Lösung
- `PointerSensor` mit `activationConstraint: { distance: 8 }` für Touch + Maus + Pen
- `DragOverlay` für visuelles Feedback beim Ziehen
- Komponenten-Extraktion: `KanbanCard`, `KanbanColumn`, `StudyPlanCard`, `StudyPlanColumn`

**Begründung:**

- @dnd-kit ist die Standard-Library für React DnD (16k+ GitHub Stars)
- Einheitlicher Sensor für alle Input-Methoden (Touch, Maus, Pen, Keyboard)
- Keine Polyfills nötig – native Performance
- `activationConstraint` löst das Touch-Scroll-Problem elegant
- `React.memo` + ausgelagerte Sub-Komponenten = performant bei vielen Items

**Konsequenzen:**

- Drei neue Dependencies: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `mobile-drag-drop` Polyfill wurde entfernt
- Alle Hooks müssen vor bedingten Returns stehen (React Hook-Regel strikt eingehalten)

---

## ADR-017: `custom_ist_benotet` für custom ERGAENZEND-Module

**Status:** Akzeptiert  
**Datum:** 2026-05-07

**Kontext:**
Das Feld `ist_benotet` liegt auf der `Module`-Tabelle und gilt für Katalog-Module. Custom-Module (ERGAENZEND mit `custom_name`, kein `module_id`) haben keinen Katalogeintrag und damit kein vererbtes `ist_benotet`. Für BIN-209 müssen Studierende eigene Ergänzende Fächer anlegen — diese können benotet oder unbenotet sein.

**Entscheidung:**
Ein neues nullable Boolean-Feld `custom_ist_benotet` auf `student_modules`:
- `NULL`: Katalog-Modul — `ist_benotet` wird von `module.ist_benotet` gelesen
- `TRUE`: Custom-Modul ist benotet
- `FALSE`: Custom-Modul ist unbenotet
- Default beim Anlegen: `TRUE` (in `AddModuleModal` vorausgewählt)

**Begründung:**
- Minimale Datenbankänderung — ein Feld statt einer eigenen Tabelle
- Klare Semantik: `NULL` heißt "schau ins Katalog-Modul"
- `AddModuleModal` zeigt die Checkbox nur im custom-Modus (ERGAENZEND)
- GPA-Berechnung muss custom-Module aktuell nicht berücksichtigen (keine `gewichtung`)

**Konsequenzen:**
- Migration 0011: `ALTER TABLE student_modules ADD COLUMN custom_ist_benotet BOOLEAN` ✅
- Alle Schemas (AddModuleRequest, UpdateModuleRequest, StudentModuleResponse) erweitert ✅
- Frontend: Checkbox "Benotet?" in `AddModuleModal` (custom-Modus, default: checked) ✅
- ModuleModal liest `custom_ist_benotet` korrekt aus wenn `module === null` ✅ (Sprint 3.7.7)

---

---

## ADR-018: `pruefungsart` und `sws` auf der `modules`-Tabelle

**Status:** Akzeptiert ✅ (Sprint 4 Phase 1 abgeschlossen)
**Datum:** 2026-05-08

**Kontext:**
Die ATPO-FIV 2025 §7 und PO BIN 2019 Anlage B1/B2 definieren für jedes Modul eine Prüfungsart (z.B. PX = Prüfung mündl. oder Klausur, EA = Experimentelle Arbeit, R = Referat, BAA+Ko = Bachelorarbeit mit Kolloquium). Außerdem ist die SWS-Zahl (Semesterwochenstunden) pro Modul dokumentiert. Diese Informationen sind aktuell nicht in der Datenbank gespeichert.

**Entscheidung:**
Zwei neue nullable Felder auf der `modules`-Tabelle (Migration 0012):
- `pruefungsart VARCHAR(20) NULLABLE` — kodierter Wert (PX, EA, R, BAA_KO, etc.)
- `sws SMALLINT NULLABLE` — Semesterwochenstunden (z.B. 4 für "Vorlesung mit Übung / 4 SWS")

**Begründung:**
- Studierende müssen wissen, was für eine Prüfungsart sie erwartet (Klausur vs. Projekt vs. Referat)
- `pruefungsart` ist relevant für das geplante Modul-Wiki (Sprint 8) und die aktuelle Moduldetail-Ansicht
- Nullable = kein Breaking Change für bestehende Daten
- Ein `VARCHAR` statt ENUM: einfacher zu erweitern bei neuen Prüfungsarten

**Konsequenzen:**
- Migration 0012: 2 neue nullable Spalten auf `modules` ✅
- BIN-Seed in Migration 0012: pruefungsart + sws für alle 37 BIN-Module eingetragen ✅
- Backend: `ModuleResponse` Schema um `pruefungsart` + `sws` erweitert ✅
- Backend: `module.py` SQLAlchemy-Model um beide Felder erweitert ✅
- Frontend: `types/study.ts` um `pruefungsart` + `sws` erweitert ✅
- Frontend: `ModuleModal` zeigt farbige Prüfungsart-Badge + SWS-Chip ✅
- Frontend: `ModuleList` zeigt Prüfungsart-Chip pro Modulzeile ✅
- i18n: `dashboard.modules.pruefungsart.*` in de.json + en.json ✅
- Admin-Panel (Sprint 5): Prüfungsart als Dropdown-Feld im Modul-Formular (offen)

---

## ADR-016: Getrenntes `plan_semester`-Feld für StudyPlanBoard

**Status:** Akzeptiert
**Datum:** 2026-05-07

**Kontext:**
`StudentModule.semester` wurde sowohl von der Notenübersicht (`/modules`) als auch vom
StudyPlanBoard (`/study-plan`) genutzt. DnD-Verschiebungen im StudyPlanBoard änderten
dadurch die Gruppierung in der Notenübersicht — ein kritischer UX-Bug.

**Entscheidung:**

Zwei getrennte Felder auf `StudentModule`:

| Feld | Besitzer | Bedeutung |
|---|---|---|
| `semester` | Notenübersicht | Administratives/tatsächliches Semester; wird vom Noten-Flow gesetzt |
| `plan_semester` | StudyPlanBoard | Persönliche Planung des Studierenden; wird nur durch DnD gesetzt |

Display-Fallback im StudyPlanBoard: `plan_semester → semester_empfehlung → "Ungeplant"`

**Begründung:**

- Konzeptuelle Trennung: „Wann belege ich dieses Modul?" (administrativ) vs. „Wie plane ich mein Studium?" (strategisch)
- Neue Studiengänge/Fakultäten funktionieren automatisch korrekt: PFLICHT-Module starten mit `plan_semester=null` und landen über `semester_empfehlung` automatisch in der richtigen Spalte
- Neue Module (Wahlpflicht, Ergänzend) erscheinen automatisch in „Ungeplant" im StudyPlanBoard
- Reihenfolge ist zukunftssicher: weitere Felder (z.B. `target_grade`) können analog getrennt werden

**Konsequenzen:**

- Migration 0010: `ALTER TABLE student_modules ADD COLUMN plan_semester VARCHAR`
- `UpdateModuleRequest.plan_semester` schreibt nur `plan_semester`, nie `semester`
- Backend verwendet `model_fields_set` um zwischen „nicht gesendet" und „explizit null" zu unterscheiden
- StudyPlanBoard sendet ausschließlich `{ plan_semester: value }` im PUT-Body
- `useUpdateModule` (Notenübersicht) sendet niemals `plan_semester` → sauber getrennt

---

## ADR-019: Admin-Session via Redis (15-Minuten-Token für destruktive Operationen)

**Status:** Akzeptiert ✅ (Sprint 5 Phase 1)
**Datum:** 2026-05-09

**Kontext:**
Admin-Operationen wie Archivieren oder Löschen sind riskant. Ein dauerhafter `is_admin`-Flag im JWT reicht nicht aus — wenn ein JWT gestohlen wird, hätte der Angreifer dauerhaften Vollzugriff. Das Sudo-Konzept aus Unix (kurze Re-Authentifizierung für privilegierte Aktionen) bietet einen besseren Ansatz.

**Entscheidung:**
- Separate Admin-Session via Redis: `POST /admin/auth/session` → Passwort-Verifikation → UUID-Token mit 15-min TTL in Redis gespeichert
- Token wird als `X-Admin-Token` Header gesendet (nicht im Cookie — explizit)
- FastAPI `get_verified_admin` Dependency prüft `X-Admin-Token` via Redis — nur für destruktive Ops
- `is_admin` im JWT reicht für lesende Admin-Ops (GET endpoints)
- Frontend speichert Token in `sessionStorage` (nicht localStorage — tab-scoped, kein XSS-Risiko durch httpOnly-Cookies)

**Begründung:**
- Zeitbegrenzung: 15-min Fenster reduziert Missbrauchsrisiko drastisch
- Explizit: Header-basiert (kein Cookie) — klar von normaler Auth getrennt
- Einfach: Redis-TTL macht Session-Management trivial
- Sudo-Semantik: Benutzer muss Passwort re-eingeben, stärkt Bewusstsein für riskante Aktionen

**Konsequenzen:**
- Redis muss laufen (bereits Teil des Stacks)
- Frontend: `useAdminSession` Hook mit Countdown-Timer, Warning ab 120s, `saveSession`/`clearSession`
- Alle destruktiven Endpunkte: `Depends(get_verified_admin)` statt `Depends(get_admin_user)`
- `/admin/login` Seite für Re-Auth

---

## ADR-020: Soft Delete (is_archived) für Module, Studiengänge und POs

**Status:** Akzeptiert ✅ (Sprint 5 Phase 1)
**Datum:** 2026-05-09

**Kontext:**
Module, Studiengänge und Prüfungsordnungen sind mit `StudentModule`-Einträgen verknüpft. Ein Hard Delete würde Studentendaten inkonsistent machen oder kaskadierend zerstören — beides inakzeptabel für eine Studienplattform.

**Entscheidung:**
Soft Delete via `is_archived`-Flag auf drei Tabellen:
```sql
ALTER TABLE modules ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE modules ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE modules ADD COLUMN archived_by_id UUID REFERENCES users(id);
ALTER TABLE modules ADD COLUMN archive_reason TEXT;
-- analog für programs, exam_regulations
```
- Hard Delete ist in der Admin-API verboten für diese Entitäten
- Archive/Restore erfordert `X-Admin-Token` + `reason` (Begründungspflicht)
- Öffentliche Endpoints filtern `is_archived == False` automatisch
- `module_prerequisites` (keine Studentdaten) erlaubt Hard Delete — Ausnahme zu dieser Regel

**Begründung:**
- Bestandsschutz: Bestehende StudentModule-Einträge bleiben valide
- Auditierbarkeit: `archived_at` + `archived_by_id` + `archive_reason` → vollständiger Audit-Trail
- Reversibel: Restore möglich ohne Datenverlust

**Konsequenzen:**
- Migration 0017: 4 neue Spalten auf modules/programs/exam_regulations
- Admin-API: `POST /{id}/archive` + `POST /{id}/restore` statt `DELETE /{id}`
- Public-APIs: explizite `is_archived == False` Filter in allen öffentlichen Endpoints
- Frontend: ArchiveDialog-Komponente mit Pflicht-Begründungsfeld (Phase 7)

---

## ADR-021: is_admin-Claim im JWT — Middleware liest ohne DB-Query

**Status:** Akzeptiert ✅ (Sprint 5 Phase 1)
**Datum:** 2026-05-09

**Kontext:**
Die Next.js Middleware muss `/admin/*` Routen schützen. Optionen: (A) DB-Query pro Request, (B) Claim im JWT, (C) separates Cookie. Next.js Middleware läuft im Edge Runtime — kein direkter DB-Zugriff möglich.

**Entscheidung:**
- `is_admin: bool` wird beim Login in den JWT-Payload eingebettet: `create_access_token(..., is_admin=user.is_admin)`
- Next.js Middleware dekodiert JWT-Payload mit `atob()` + manuelles Base64url-Padding (kein `Buffer` im Edge Runtime)
- Keine Signaturverifikation in der Middleware (Signatur wird im Backend geprüft)
- Beim Admin-Flag-Wechsel: nächster Login erzeugt neuen JWT mit korrektem Claim

**Begründung:**
- Edge Runtime: `Buffer` nicht verfügbar — `atob()` + manuelle Padding-Korrektur ist die einzige Option ohne externe Dependencies
- Performance: Kein DB-Round-trip pro Request
- Einfach: JWT ist bereits vorhanden, ein Feld hinzufügen kostet nichts
- Sicherheit: Middleware macht "fast-fail" für Nicht-Admins, echte Verifikation findet im Backend statt (`get_admin_user` Dependency)

**Konsequenzen:**
- `create_access_token()` Signatur erweitert: `is_admin: bool = False`
- `app/routers/auth.py`: `login()` übergibt `is_admin=user.is_admin`
- `frontend/src/middleware.ts`: `parseJwtPayload()` Funktion mit `atob()` + Base64url-Padding
- Kein Re-Login nötig für existierende Sessions bis zur natürlichen Token-Expiry

---

## ADR-022: AdminDataTable server-side paginiert (25 Einträge/Seite)

**Status:** Akzeptiert ✅ (implementiert Sprint 5 Phasen 7+8)
**Datum:** 2026-05-09

**Kontext:**
User- und Modul-Tabellen können tausende Einträge haben. Client-side Pagination würde alle Daten auf einmal laden.

**Entscheidung:**
- Alle Admin-Listendaten werden server-side paginiert (default: 25/Seite)
- URL-Parameter: `?page=1&limit=25&search=&sort_by=created_at&sort_dir=desc`
- Backend gibt `{ items: [...], total: N, page: N, limit: N }` zurück
- Frontend verwendet `useQuery` mit Page-Parameter (kein TanStack Table client-side Sorting)

**Begründung:**
- Skalierbar: 10.000 User + 1000 Module kein Problem
- Konsistent: Alle Admin-Listen verhalten sich gleich
- Einfacher als Virtualisierung (react-virtual) für Admin-Use-Case

**Konsequenzen:**
- Alle Admin-Router haben `skip`/`limit` Parameter
- `AdminUserListResponse` Schema: `{ items, total, page, limit }`
- Frontend: Pagination-Komponente mit Seiten-Navigation
