# Sprint 5 – Admin Panel Masterplan

**Status:** 🔧 In Bearbeitung — Phasen 1–9 + 11 abgeschlossen (2026-05-10)  
**Zeitraum:** 2026-05-09 – laufend  
**Basis:** ADR-009 (Admin PO-Verwaltung), ADR-019–022

---

## Ziel & Vision

Ein professionelles, vollständiges Admin-Panel für StudyNexus — nicht nur ein schnelles Datenbank-UI,
sondern ein **highend Verwaltungssystem** das:

- jeden Aspekt der Plattform steuerbar macht (PO-Daten, User, System)
- alle Aktionen lückenlos auditiert (wer hat was wann geändert)
- sicher ist (Admin-Session, Passwort-Bestätigung bei destruktiven Operationen)
- für die Zukunft gebaut ist (JSON-Import, PDF-Parser Placeholder, Multi-Program)
- sauber vom User-Dashboard getrennt ist (eigene Route `/admin`, eigenes Layout)

---

## Entscheidungsprotokoll (aus Planungssession)

| Frage | Entscheidung | Begründung |
|---|---|---|
| Admin-Stufen | Super-Admin only (`is_admin` flag) | Nur Yusef, kein Rollen-System jetzt |
| Admin-Location | `/admin` separate Route + Layout | Klar getrennt, kein Subdomain-Overhead |
| Sicherheit | `is_admin` + Admin-Re-Auth + Audit-Log | Sudo-Konzept für destruktive Ops |
| Modul-Löschen | Soft Delete (archivieren) + Begründungspflicht | Bestands­schutz für Student-Daten |
| PO-Import | Formulare + JSON-Bulk-Import + PDF-Placeholder | Flexibel und zukunftssicher |
| Analytics | Alle drei Ebenen (KPIs + Modul-Stats + Wachstum) | Vollständige Sicht auf die Plattform |
| User-Management | Vollzugriff (alle Backend-Felder steuerbar) | Super-Admin kann alles |

---

## Architektur-Übersicht

```
/admin
├── /                     → Dashboard (KPIs, Aktivität, Systemstatus)
├── /users                → User-Tabelle (Suche, Filter, Pagination)
├── /users/[id]           → User-Detail + alle Aktionen
├── /universities         → Hochschulen verwalten
├── /universities/[id]    → Hochschule + Fakultäten bearbeiten
├── /programs             → Studiengänge verwalten
├── /programs/[id]        → Studiengang + Prüfungsordnungen
├── /exam-regulations/[id]→ PO-Version + Modulkatalog
├── /modules              → Alle Module (gefiltert, sortierbar)
├── /modules/new          → Neues Modul anlegen
├── /modules/[id]         → Modul bearbeiten + Voraussetzungen
├── /prerequisites        → Voraussetzungs-Übersicht + CRUD
├── /import               → JSON-Bulk-Import + PDF-Placeholder
├── /audit-log            → Vollständiger Audit-Trail
└── /system               → Systeminfo, DB-Stats, Gesundheitsstatus
```

---

## Datenbank-Migrationen

### Migration 0015 – Admin + Premium auf Users

```sql
ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN is_premium BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN admin_notes TEXT;  -- interne Notizen (nur Admin sichtbar)
```

> **Admin-Seed:** Nicht in der Migration — manuell setzen nach erstem Login (siehe ANTIGRAVITY.md → "Admin-Flag setzen").

### Migration 0016 – Audit Log

```sql
CREATE TABLE admin_audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(50) NOT NULL,          -- CREATE, UPDATE, DELETE, ARCHIVE, RESTORE, LOGIN
    entity_type VARCHAR(50) NOT NULL,          -- User, Module, Program, ExamRegulation, ...
    entity_id   UUID,                          -- ID des betroffenen Eintrags (nullable bei System-Events)
    entity_label VARCHAR(200),                 -- Lesbarer Name (z.B. "BIN-209 – Ergänzende Fächer")
    old_value   JSONB,                         -- Zustand vor der Änderung
    new_value   JSONB,                         -- Zustand nach der Änderung
    reason      TEXT,                          -- Pflicht bei ARCHIVE/DELETE
    ip_address  VARCHAR(45),                   -- Für Security-Auditing
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_entity ON admin_audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON admin_audit_logs(created_at DESC);
```

### Migration 0017 – Soft Delete auf Modulen + PO-Daten

```sql
-- modules
ALTER TABLE modules ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE modules ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE modules ADD COLUMN archived_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE modules ADD COLUMN archive_reason TEXT;

-- exam_regulations
ALTER TABLE exam_regulations ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE exam_regulations ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE exam_regulations ADD COLUMN archived_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE exam_regulations ADD COLUMN archive_reason TEXT;

-- programs
ALTER TABLE programs ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE programs ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE programs ADD COLUMN archived_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE programs ADD COLUMN archive_reason TEXT;
```

> Alle öffentlichen GET-Endpunkte filtern automatisch `is_archived = false`.  
> Admin-Endpunkte können `?include_archived=true` verwenden.

---

## Backend – Admin API (`/api/v1/admin/`)

### Security-Dependency-Chain

```python
# app/core/admin_auth.py

def get_admin_user(current_user = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(403, "Admin access required")
    return current_user

def get_verified_admin(
    admin: User = Depends(get_admin_user),
    x_admin_token: str = Header(None)
) -> User:
    """Für destruktive Operationen: Admin-Session-Token prüfen."""
    if not verify_admin_session_token(x_admin_token, admin.id):
        raise HTTPException(401, "Admin session expired. Re-authenticate.")
    return admin
```

**Admin-Session-Flow:**
1. Admin öffnet `/admin` → prüft `is_admin` im JWT (Redirect zu `/admin/login` wenn nicht admin)
2. Admin muss Passwort bestätigen → `POST /admin/auth/session` → gibt kurzlebigen Admin-Session-Token zurück (15 Min, in Memory/Redis)
3. Destruktive Operationen senden `X-Admin-Token` Header
4. Wenn Token abgelaufen → Modal "Admin-Session abgelaufen — Passwort erneut eingeben"

---

### Admin-Router Struktur

```
app/routers/
├── admin/
│   ├── __init__.py
│   ├── auth.py          # Admin-Session-Auth
│   ├── users.py         # User-Verwaltung
│   ├── universities.py  # Hochschulen CRUD
│   ├── faculties.py     # Fakultäten CRUD
│   ├── programs.py      # Studiengänge CRUD
│   ├── exam_regulations.py
│   ├── modules.py       # Module CRUD + Archivierung + Import
│   ├── prerequisites.py # Voraussetzungen CRUD
│   ├── analytics.py     # KPIs + Statistiken
│   ├── audit_log.py     # Audit-Log abfragen
│   └── system.py        # Systeminfo
```

---

### Vollständige Endpoint-Liste

#### Admin Auth
```
POST /admin/auth/session          → Admin-Re-Auth (Passwort → Session-Token)
DELETE /admin/auth/session        → Session invalidieren (Logout aus Admin-Mode)
GET  /admin/me                    → eigenes Admin-Profil
```

#### Analytics Dashboard
```
GET  /admin/stats                 → KPI-Übersicht
GET  /admin/stats/growth          → Registrierungen über Zeit (query: period=7d|30d|90d|1y)
GET  /admin/stats/modules         → Modul-Statistiken (beliebteste, Ø-Noten, Bestehensquoten)
GET  /admin/stats/users           → User-Segmentierung (nach Studiengang, Aktivität, Premium)
```

**KPI-Response Schema:**
```python
class AdminStatsResponse(BaseModel):
    total_users: int
    verified_users: int
    active_users_30d: int
    premium_users: int
    total_student_modules: int
    passed_modules_today: int
    new_registrations_today: int
    new_registrations_week: int
    total_universities: int
    total_programs: int
    total_modules: int
    db_size_mb: float
    last_updated: datetime
```

#### User Management
```
GET    /admin/users               → Paginated Liste (filter: is_active, is_premium, program_id, search)
GET    /admin/users/{id}          → User-Detail inkl. StudentModules-Zusammenfassung, letzter Login
PATCH  /admin/users/{id}          → Felder updaten (is_active, is_premium, is_verified, admin_notes)
POST   /admin/users/{id}/reset-password  → Passwort-Reset-Mail senden [Admin-Token required]
DELETE /admin/users/{id}          → User löschen inkl. aller Daten [Admin-Token + Begründung required]
```

**User-Detail-Response:**
```python
class AdminUserDetailResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    matrikelnummer: Optional[str]
    university: Optional[str]
    birth_date: Optional[datetime]
    is_active: bool
    is_premium: bool
    is_verified: bool
    is_admin: bool
    preferred_language: str
    admin_notes: Optional[str]
    created_at: datetime
    last_login_at: Optional[datetime]
    # Zusammenfassung der Studienplan-Daten
    program_name: Optional[str]
    start_semester: Optional[str]
    total_modules: int
    passed_modules: int
    gpa: Optional[float]
    erreichte_ects: int
```

#### Hochschulen & Struktur
```
GET    /admin/universities                → Liste aller Hochschulen (inkl. archived)
POST   /admin/universities                → Neue Hochschule anlegen
GET    /admin/universities/{id}           → Detail + Fakultäten
PATCH  /admin/universities/{id}           → Bearbeiten
DELETE /admin/universities/{id}           → Löschen (nur wenn keine Fakultäten)

GET    /admin/faculties                   → Liste (filter: university_id)
POST   /admin/faculties
PATCH  /admin/faculties/{id}
DELETE /admin/faculties/{id}             → Nur wenn keine Programme

GET    /admin/programs                    → Liste (filter: faculty_id, include_archived)
POST   /admin/programs
GET    /admin/programs/{id}               → Detail + Prüfungsordnungen + Studierendenanzahl
PATCH  /admin/programs/{id}
POST   /admin/programs/{id}/archive       → Archivieren [Admin-Token + Begründung]
POST   /admin/programs/{id}/restore       → Wiederherstellen [Admin-Token]

GET    /admin/exam-regulations            → Liste (filter: program_id, include_archived)
POST   /admin/exam-regulations
GET    /admin/exam-regulations/{id}       → Detail + Modulanzahl
PATCH  /admin/exam-regulations/{id}
POST   /admin/exam-regulations/{id}/archive
POST   /admin/exam-regulations/{id}/restore
```

#### Module Management
```
GET    /admin/modules                → Liste (filter: exam_reg_id, modul_typ, is_archived, search)
POST   /admin/modules                → Einzelnes Modul anlegen
GET    /admin/modules/{id}           → Detail + StudentModule-Count + Voraussetzungen
PATCH  /admin/modules/{id}           → Alle Felder bearbeitbar
POST   /admin/modules/{id}/archive   → Soft Delete [Admin-Token + Begründung PFLICHT]
POST   /admin/modules/{id}/restore   → Wiederherstellen [Admin-Token]
POST   /admin/modules/import/json    → JSON-Bulk-Import (bis 500 Module)
POST   /admin/modules/import/pdf     → PDF-Parser (501 Not Implemented — Placeholder Sprint 7)
```

**JSON-Import Format:**
```json
{
  "exam_regulation_id": "uuid",
  "modules": [
    {
      "name": "Programmieren 1",
      "kuerzel": "MDI-100",
      "ects": 5,
      "semester_empfehlung": 1,
      "modul_typ": "PFLICHT",
      "ist_benotet": true,
      "max_versuche": 3,
      "gewichtung": 1.0,
      "has_prerequisites": false,
      "pruefungsart": "PX",
      "sws": 4
    }
  ]
}
```

**Import-Response:**
```python
class ImportResult(BaseModel):
    created: int
    skipped: int  # bereits vorhanden (per kuerzel)
    errors: List[str]
    audit_log_id: UUID
```

#### Voraussetzungen (module_prerequisites)
```
GET    /admin/prerequisites          → Liste (filter: module_id, prerequisite_type)
POST   /admin/prerequisites          → Neue Voraussetzung
GET    /admin/prerequisites/{id}
PATCH  /admin/prerequisites/{id}
DELETE /admin/prerequisites/{id}    → Hard Delete erlaubt (nur Metadaten, keine Student-Daten)
```

#### Audit Log
```
GET  /admin/audit-log               → Paginated (filter: admin_id, entity_type, action, date_from, date_to)
GET  /admin/audit-log/{id}          → Einzelner Log-Eintrag mit full old/new JSON
```

#### System
```
GET  /admin/system                  → Version, DB-Size, Service-Uptime, Config-Übersicht
GET  /admin/system/health           → Health-Check aller Services (DB, Redis, Email)
```

---

### Automatisches Audit-Logging (FastAPI Middleware-Pattern)

```python
# app/core/audit.py

class AuditLogger:
    def __init__(self, db: Session, admin: User):
        self.db = db
        self.admin = admin

    def log(
        self,
        action: str,          # "CREATE", "UPDATE", "ARCHIVE", "DELETE", etc.
        entity_type: str,     # "Module", "User", "Program", etc.
        entity_id: UUID = None,
        entity_label: str = None,
        old_value: dict = None,
        new_value: dict = None,
        reason: str = None,
    ):
        entry = AdminAuditLog(
            admin_id=self.admin.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            ip_address=...,  # aus Request-Context
        )
        self.db.add(entry)
        self.db.flush()  # sofort persistiert, nicht erst beim commit
```

> Jeder Admin-Router bekommt `audit: AuditLogger = Depends(get_audit_logger)` als Dependency.

---

## Frontend – Admin Panel

### Route-Struktur

```
app/[locale]/admin/
├── layout.tsx           → AdminLayout (eigene Sidebar, kein Dashboard-Frame)
├── page.tsx             → /admin → Dashboard
├── login/
│   └── page.tsx         → Admin-Session-Auth (Passwort-Bestätigung)
├── users/
│   ├── page.tsx         → User-Tabelle
│   └── [id]/
│       └── page.tsx     → User-Detail
├── universities/
│   ├── page.tsx
│   └── [id]/page.tsx
├── programs/
│   ├── page.tsx
│   └── [id]/page.tsx
├── exam-regulations/
│   └── [id]/page.tsx
├── modules/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/page.tsx
├── prerequisites/
│   └── page.tsx
├── import/
│   └── page.tsx
├── audit-log/
│   └── page.tsx
└── system/
    └── page.tsx
```

---

### Admin Layout

```tsx
// AdminLayout (app/[locale]/admin/layout.tsx)
// - Komplett eigenes Design: dunkle Sidebar, roter "ADMIN"-Badge
// - Keine Dashboard-Komponenten, kein user-facing Code
// - AdminSidebar + AdminHeader

// AdminSidebar:
// [ADMIN] StudyNexus Admin
// ─────────────────────────
// 📊 Dashboard
// 👥 Nutzer
// 🏫 Hochschulen & POs
// 📚 Module
// 🔗 Voraussetzungen
// 📥 Import
// 📋 Audit-Log
// ⚙️ System
// ─────────────────────────
// [Admin: Yusef B.]  [Logout]
```

**AdminHeader:**
- Breadcrumb (z.B. "Admin / Module / BIN-209")
- Admin-Session-Status-Chip: "🔒 Session aktiv (12 min)" oder "⚠️ Session abgelaufen"
- Bei abgelaufener Session: Modal erscheint automatisch

---

### Middleware (Admin-Schutz)

```typescript
// middleware.ts – erweitert bestehende Middleware:

if (pathname.startsWith('/admin')) {
  // 1. Kein JWT → Redirect zu /login
  // 2. JWT vorhanden aber is_admin=false → 403-Seite
  // 3. is_admin=true → durchlassen
}
```

Der JWT bekommt `is_admin: boolean` als zusätzlichen Claim beim Login.

---

### Reusable Admin-Komponenten

```
components/admin/
├── AdminDataTable.tsx       → Universelle Tabelle mit Sort, Filter, Pagination, Search
├── AdminFormModal.tsx       → Modal für Create/Edit-Formulare
├── ArchiveDialog.tsx        → Bestätigungs-Dialog mit Begründungs-Pflichtfeld
├── DeleteDialog.tsx         → Hard-Delete Bestätigung (+ Admin-Session-Token)
├── AdminSessionBanner.tsx   → "Session läuft in X ab" Banner
├── AuditBadge.tsx           → "Zuletzt geändert von [Admin] am [Datum]"
├── StatusBadge.tsx          → Aktiv/Inaktiv/Archiviert Chips
├── KPICard.tsx              → KPI-Karte (Zahl + Trend + Icon)
├── GrowthChart.tsx          → Recharts LineChart für Wachstum
└── JsonImportZone.tsx       → Drag & Drop + JSON-Validierung
```

**AdminDataTable Features:**
- Server-side Pagination (default: 25 Einträge/Seite)
- Column sorting (klick auf Header)
- Globale Suche (debounced)
- Column-spezifische Filter (Dropdown für Enums, Range für Nummern)
- Bulk-Select (Checkboxen für Massenoperationen)
- Exportbar als CSV
- Keyboard-Navigation (Tab zwischen Zeilen, Enter → Detail)

---

### Seiten im Detail

#### `/admin` – Dashboard

```
┌─────────────────────────────────────────────────────┐
│ 📊 Admin Dashboard                    [letzte 30 Tage▾]│
├──────────┬──────────┬──────────┬──────────────────────┤
│ 👥 247   │ ✅ 198   │ ⭐ 12    │ 📚 37 Module         │
│ User     │ Verifiz. │ Premium  │ 1 Studiengang        │
├──────────┴──────────┴──────────┴──────────────────────┤
│ Registrierungen (letzte 30 Tage)   [Line Chart]       │
│ ████████████████▄▄▄▄▄▄▄▄▄▃▃▃▃▃▅▅▅▅▅▅▅▅▅▅▅▅          │
├─────────────────────────────────────────────────────┤
│ Top 5 Module                    Aktivste User heute  │
│ BIN-100  247 Stud. Ø 2.3       Max M.     43 Aktionen│
│ BIN-101  244 Stud. Ø 2.1       Anna K.    31 Aktionen│
│ BIN-209  201 Stud. 3 Sub-M.    ...                   │
├─────────────────────────────────────────────────────┤
│ 🕐 Letzte Audit-Einträge                            │
│ [UPDATE] Module BIN-209 Gewichtung → 1.5  vor 2h    │
│ [CREATE] User max.mueller@stud... registriert  vor 3h │
└─────────────────────────────────────────────────────┘
```

#### `/admin/users` – User-Tabelle

Spalten: Matrikelnr. | Name | E-Mail | Studiengang | ECTS | GPA | Registriert | Status | Aktionen

Filter: `Alle / Aktiv / Deaktiviert / Unverified / Premium`  
Suche: Name, E-Mail, Matrikelnummer

Quick-Actions per Zeile:
- 👁 Detail ansehen
- ✅/❌ Aktivieren/Deaktivieren (sofort, kein Dialog)
- ⭐ Premium toggeln
- 🗑 Löschen (Dialog + Admin-Session-Token)

#### `/admin/users/[id]` – User-Detail

```
┌─────────────────────────────────────────────────────┐
│ 👤 Max Mustermann                     [Bearbeiten]  │
├────────────────────┬────────────────────────────────┤
│ E-Mail             │ max.mustermann@stud.hs-han...  │
│ Matrikelnummer     │ 1234567                        │
│ Registriert        │ 12.05.2026 14:23               │
│ Letzter Login      │ 09.05.2026 09:11               │
│ Studiengang        │ BIN – PO 19 WiSe               │
│ Start-Semester     │ WiSe 2024/25 (4. Semester)    │
├────────────────────┼────────────────────────────────┤
│ is_active          │ [Toggle: ✅ Aktiv]             │
│ is_premium         │ [Toggle: ❌ Kein Premium]      │
│ is_verified        │ [Toggle: ✅ Verifiziert]        │
│ is_admin           │ ❌ (read-only)                 │
├────────────────────┴────────────────────────────────┤
│ Admin-Notizen (intern)                               │
│ [Textarea ...]                          [Speichern] │
├─────────────────────────────────────────────────────┤
│ Studienplan-Zusammenfassung                          │
│ 23 Module | 12 Bestanden | Ø GPA 2.1 | 72 ECTS     │
├─────────────────────────────────────────────────────┤
│ Aktionen                                             │
│ [Passwort-Reset-Mail senden] [Account löschen 🗑]   │
└─────────────────────────────────────────────────────┘
```

#### `/admin/exam-regulations/[id]` – PO + Modulkatalog

```
┌─────────────────────────────────────────────────────┐
│ 📋 PO 19 WiSe – Angewandte Informatik  BIN         │
│ 247 Studierende | 37 Module (34 aktiv, 0 archiviert)│
├─────────────────────────────────────────────────────┤
│ [+ Modul hinzufügen] [📥 JSON-Import] [📋 Export]  │
├────┬──────────────────┬──────┬──────┬─────┬────────┤
│ #  │ Name             │ ECTS │ Typ  │ PA  │Aktionen│
├────┼──────────────────┼──────┼──────┼─────┼────────┤
│ 1  │ BIN-100 Prog 1   │ 6    │ PFL. │ PX  │ ✏ 🗄  │
│ 2  │ BIN-101 Mathe 1  │ 6    │ PFL. │ PX  │ ✏ 🗄  │
│ …  │ …                │ …    │ …    │ …   │ …      │
│ 37 │ BIN-210 BA+Ko    │ 12   │ PFL. │BAA+K│ ✏ 🗄  │
└────┴──────────────────┴──────┴──────┴─────┴────────┘
```

#### `/admin/modules/[id]` – Modul bearbeiten

Vollständiges Formular mit allen Feldern:

| Feld | Input-Typ | Validierung |
|---|---|---|
| Name | Text | required, max 200 |
| Kürzel | Text | unique per ExamReg |
| ECTS | Number | 1–30 |
| Semester-Empfehlung | Number | 1–12 |
| Modul-Typ | Select: PFLICHT/WAHLPFLICHT/ERGAENZEND | required |
| Ist benotet | Toggle | — |
| Max. Versuche | Number | 1–5 |
| Gewichtung | Number (0.1 steps) | 0.1–3.0 |
| Has Prerequisites | Toggle | — |
| Prüfungsart | Select: PX/EA/R/BAA+Ko/null | nullable |
| SWS | Number | nullable |

Darunter: **Voraussetzungs-Editor**
- Liste aller bestehenden Prerequisites für dieses Modul
- `[+ Voraussetzung hinzufügen]` → Inline-Form

**Audit-Sidebar** (rechts):
```
Zuletzt geändert
von Yusef B. am 09.05.2026
Änderung: gewichtung 1.0 → 1.5
Begründung: PO BIN Anlage B2

Erstellt
von System (Migration 0011)
am 07.05.2026
```

#### `/admin/import` – JSON-Bulk-Import

```
┌─────────────────────────────────────────────────────┐
│ 📥 Bulk-Import                                       │
├─────────────────────────────────────────────────────┤
│ Prüfungsordnung:  [Dropdown: PO 19 WiSe – BIN ▾]   │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │  Datei hierher ziehen oder klicken              │ │
│ │         📄 .json                                │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ [Oder JSON direkt eingeben]                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ {                                               │ │
│ │   "modules": [...]                              │ │
│ │ }                                               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ [Validieren]  →  Vorschau  →  [Import ausführen]    │
│                                                      │
│ ── PDF-Import (Sprint 7) ──────────────────────────  │
│ 📄 PDF hochladen und automatisch analysieren        │
│ [Datei wählen]  ⚠️ Noch nicht verfügbar (coming soon)│
└─────────────────────────────────────────────────────┘
```

Import-Flow:
1. JSON validieren (Client-side Schema-Check)
2. Vorschau anzeigen (was wird angelegt, was existiert bereits)
3. Bestätigen → POST /admin/modules/import/json
4. Ergebnis: "37 erstellt, 0 übersprungen, 0 Fehler" + Audit-Log-Link

#### `/admin/audit-log` – Audit-Trail

```
┌─────────────────────────────────────────────────────┐
│ 📋 Audit-Log            [Entity▾] [Aktion▾] [Datum▾]│
├────────────────────────────────────────────────────-┤
│ 🕐 09.05.2026 14:23  Yusef B.                       │
│ UPDATE Module "BIN-209 – Ergänzende Fächer"         │
│ gewichtung: 1.0 → 1.5                               │
│ Begründung: PO BIN 2019 Anlage B2                   │
├─────────────────────────────────────────────────────┤
│ 🕐 09.05.2026 13:15  Yusef B.                       │
│ ARCHIVE Module "BIN-OLD – Altes Modul"              │
│ Begründung: Modul wird seit WiSe 2025 nicht...      │
│ [Details anzeigen ▸]                                │
└─────────────────────────────────────────────────────┘
```

---

## Implementierungs-Phasen

### Phase 1 – Backend Fundament ✅ (2026-05-09)
- [x] Migration 0015: `is_admin`, `last_login_at`, `admin_notes` auf users (kein Email-Seed im Code)
- [x] Migration 0016: `admin_audit_logs` Tabelle (3 Indizes: admin_id, entity, created DESC)
- [x] Migration 0017: Soft-Delete-Felder auf modules/programs/exam_regulations
- [x] `app/models/admin_audit_log.py` – SQLAlchemy Model
- [x] `app/core/admin_auth.py` – `get_admin_user`, `get_verified_admin`, Admin-Session via Redis (15 Min)
- [x] `app/core/audit.py` – `AuditLogger` Klasse als FastAPI Dependency (flush() in gleicher Transaktion)
- [x] `app/core/security.py` – `create_access_token` mit `is_admin` JWT-Claim
- [x] `app/routers/admin/auth.py` – `POST /admin/auth/session`, `DELETE /admin/auth/session`, `GET /admin/auth/me`
- [x] `app/routers/auth.py` – Login setzt `last_login_at` + übergibt `is_admin` an JWT
- [x] Seed: Admin-Flag manuell setzen (kein Email-Seed im Code — Anleitung in ANTIGRAVITY.md)
- [x] Backend-Tests: 15/15 grün — Zugriffskontrolle, Session-Flow, mock_admin_user + admin_client Fixtures

### Phase 2 – User-Management Backend ✅ (2026-05-09)
- [x] `app/schemas/admin/user.py` – AdminUserListItem, AdminUserListResponse, AdminUserDetailResponse, AdminUserPatch, DeleteUserRequest
- [x] `app/routers/admin/users.py` – GET List (paginated + search + filter), GET Detail, PATCH, POST reset-password, DELETE (cascade)
- [x] `last_login_at` wird bei jedem Login gesetzt (bereits in Phase 1 erledigt)
- [x] Audit-Logging für PATCH (UPDATE), reset-password (RESET_PASSWORD), DELETE (DELETE) via AuditLogger
- [x] Tests: 10 neue Tests — Paginated Liste, Detail, 404, PATCH+Audit, DELETE-Guards, 25/25 grün

### Phase 3 – PO-Verwaltung Backend ✅ (2026-05-09)
- [x] `app/schemas/admin/po.py` – alle PO-Schemas (University/Faculty/Program/ExamReg/Module/Prerequisite)
- [x] `app/routers/admin/universities.py` – CRUD + DELETE-Schutz (409 wenn Fakultäten vorhanden)
- [x] `app/routers/admin/faculties.py` – CRUD + DELETE-Schutz (409 wenn Programme vorhanden)
- [x] `app/routers/admin/programs.py` – CRUD + Archive/Restore [Admin-Token + Begründung]
- [x] `app/routers/admin/exam_regulations.py` – CRUD + Archive/Restore [Admin-Token + Begründung]
- [x] `app/routers/admin/modules.py`:
  - CRUD mit allen Feldern (name, kuerzel, ects, semester_empfehlung, modul_typ, ist_benotet, …)
  - `POST /archive` – Soft Delete [Admin-Token + Begründung PFLICHT]
  - `POST /restore` – Wiederherstellen [Admin-Token]
  - `POST /import/json` – Bulk-Import bis 500 Module, Duplikat-Erkennung per kuerzel
  - `POST /import/pdf` – 501 Placeholder
  - Import-Routes vor `/{id}` definiert (verhindert UUID-Parse-Konflikt)
- [x] `app/routers/admin/prerequisites.py` – CRUD (Hard Delete erlaubt per ADR-020)
- [x] `app/routers/admin/__init__.py` – alle Phase-3-Router registriert
- [x] Öffentliche Endpunkte (`/faculties/{id}/programs`, `/programs/{id}/exam-regulations`, `/exam-regulations/{id}/modules`) filtern jetzt auf `is_archived = false`
- [x] Tests: 22 neue Tests — Archive/Restore Flow, JSON-Import, Duplikat-Erkennung, 501, 409, 99/99 grün

### Phase 4 – Analytics Backend ✅ (2026-05-09)
- [x] `app/schemas/admin/analytics.py` – AdminStatsResponse, GrowthResponse, ModuleStatsResponse, UserStatsResponse, SystemInfoResponse, SystemHealthResponse
- [x] `app/routers/admin/analytics.py`:
  - `GET /stats` – KPIs (User-Counts, Module-Counts, DB-Größe via pg_database_size)
  - `GET /stats/growth?period=7d|30d|90d|1y` – Tages-Aggregation der Registrierungen
  - `GET /stats/modules?limit=N` – Top-Module (nach Studierendenzahl, Ø-Note, Bestehensquote)
  - `GET /stats/users` – Segmentierung nach Programm, Aktivität, Premium
- [x] `app/routers/admin/system.py` – `GET /system` (DB-Version, -Größe, Counts) + `GET /system/health` (DB + Redis Ping)
- [x] Tests: 12 neue Tests — KPI-Shape, Growth-Period-Validation, Module-Stats, User-Segmentation, System-Health, 111/111 grün

### Phase 5 – Frontend Fundament ✅ (2026-05-09)
- [x] `middleware.ts` – `/admin/*` Guard: kein Token → /login, is_admin=false → /dashboard; Edge-safe JWT-Decode via atob()
- [x] `app/api/admin/[...path]/route.ts` – Catch-all Proxy: leitet alle Methoden an Backend weiter, forwarded X-Admin-Token Header
- [x] `hooks/useAdminSession.ts` – sessionStorage-basierter Admin-Session-Hook: TTL-Countdown, Expiry-Warning < 2 Min, saveSession/clearSession
- [x] `components/admin/AdminSidebar.tsx` – dunkle Sidebar (zinc-950), roter ADMIN-Badge, 9 Nav-Links, Session-Timer-Chip, Live-Countdown
- [x] `components/admin/AdminSessionBanner.tsx` – Banner wenn Session < 2 Min oder nicht aktiv, "Verlängern"-Link
- [x] `app/[locale]/admin/layout.tsx` – AdminLayout: fetchAdminName() via GET /admin/me, AdminSidebar + AdminSessionBanner, kein Dashboard-Frame
- [x] `app/[locale]/admin/page.tsx` – Dashboard-Placeholder mit 4 Quick-Nav-Cards
- [x] `app/[locale]/admin/login/page.tsx` – Admin-Re-Auth: POST /api/admin/auth/session → saveSession() → redirect /admin; dunkles Design

### Phase 6 – Dashboard + Analytics Frontend ✅ (2026-05-09)
- [x] `components/admin/KPICard.tsx` — label/value/sub/icon/trend-Indikatoren, Skeleton, `className` Prop
- [x] `components/admin/GrowthChart.tsx` — Recharts `ResponsiveContainer + LineChart`, CSS-Vars-Theming, i18n, h-40 sm:h-48
- [x] `app/[locale]/admin/page.tsx` — 4 primäre KPI-Cards + 3 sekundäre + GrowthChart (30d) + DB-Größe + Quick-Nav; p-4 sm:p-6; vollständig i18n

### Phase 7 – Mobile/i18n + Reusable Admin-Komponenten ✅ (2026-05-10)
**Bug-Fix:**
- [x] `hooks/useAdminSession.ts` — Cross-Instance-Sync via `window.dispatchEvent("sn-admin-session-change")`, damit Sidebar/Banner nach Login sofort aktualisiert werden

**Mobile:**
- [x] `components/admin/AdminMobileHeader.tsx` — Sticky Top-Bar + Hamburger → Slide-Drawer (CSS translate-x), Backdrop, Body-Scroll-Lock, schließt bei Route-Wechsel
- [x] `app/[locale]/admin/layout.tsx` — `<AdminMobileHeader>` eingebaut
- [x] Vollständige i18n aller Admin-Strings: `admin.nav`, `admin.sidebar`, `admin.sessionBanner`, `admin.login`, `admin.dashboard`, `admin.table`, `admin.status`, `admin.archiveDialog`, `admin.deleteDialog`, `admin.formModal`, `admin.auditBadge`

**Reusable Komponenten:**
- [x] `components/admin/AdminDataTable.tsx` — Generisch `<T>`, Column-Sort (SortState), debounced Search (350ms), server-side Pagination, `hideOnMobile` pro Spalte, 5-Zeilen-Skeleton
- [x] `components/admin/AdminFormModal.tsx` — Bottom-Sheet auf Mobile / zentriertes Modal auf Desktop, Escape + Backdrop schließt, Body-Scroll-Lock, save/create Varianten
- [x] `components/admin/ArchiveDialog.tsx` — Pflicht-Begründung (Textarea), Admin-Session-Prüfung, amber Danger-Styling, i18n
- [x] `components/admin/DeleteDialog.tsx` — Tippe Bestätigungswort (i18n: "LÖSCHEN"/"DELETE"), Admin-Session-Prüfung, rotes Danger-Styling
- [x] `components/admin/StatusBadge.tsx` — 6 Varianten (active/inactive/archived/verified/unverified/premium), dark-mode-aware
- [x] `components/admin/AuditBadge.tsx` — created/modified Varianten, locale-aware Datum + Uhrzeit

**Hinweis:** Bulk-Select und CSV-Export wurden bewusst weggelassen (kein Use-Case in Phase 8).

### Phase 8 – User-Management Frontend ✅ (2026-05-10)
- [x] `types/admin.ts` — `AdminUserListItem`, `AdminUserListResponse`, `AdminUserDetail` (extends List + university/birth_date/admin_notes/gpa), `AdminUserPatch`
- [x] `lib/adminFetch.ts` — `adminGet<T>(path)` + `adminMutate<T>(path, method, {body?, adminToken?})` — Content-Type + x-admin-token, 204-safe
- [x] `hooks/admin/useAdminUsers.ts` — TanStack Query, page/search/filter, staleTime 30s, placeholderData
- [x] `hooks/admin/useAdminUser.ts` — TanStack Query single-user, enabled-Guard
- [x] `app/[locale]/admin/users/page.tsx` — 7-spaltige Tabelle (User, Matrikel, Status, Programm, Fortschritt, Letzter Login, Registriert), 5 Filter-Tabs, debounced Search, Row-Click → Detail
- [x] `app/[locale]/admin/users/[id]/page.tsx` — Persönliche Daten, Studienplan, Toggle-Switches (PATCH), Admin-Notes, Danger Zone (Passwort-Reset + DeleteDialog)

### Phase 9 – PO-Verwaltung Frontend (2–3 Tage) ✅
- [x] `app/[locale]/admin/universities/page.tsx` + `[id]/page.tsx` — Liste + Detail mit Fakultäten-Editor
- [x] `app/[locale]/admin/programs/page.tsx` + `[id]/page.tsx` — Liste/Filter + Detail mit PO-Tabelle + Archivierung
- [x] `app/[locale]/admin/exam-regulations/[id]/page.tsx` — PO-Hub: Modulkatalog, JSON-Import, Modul anlegen, PO archivieren
- [x] `app/[locale]/admin/modules/page.tsx` — globale Modul-Übersicht mit Filter-Tabs + Live-Suche
- [x] `app/[locale]/admin/modules/[id]/page.tsx` — Edit + Voraussetzungs-Editor (add/delete, TYPE-conditional fields)
- [x] `types/admin.ts` — AdminFaculty, AdminUniversity(Detail), AdminProgram(Detail), AdminExamReg(Detail), AdminModule(Detail), AdminPrerequisite
- [x] `hooks/admin/useAdminUniversities.ts`, `useAdminPrograms.ts`, `useAdminModules.ts`
- [x] i18n (DE+EN): admin.common, admin.universities, admin.programs, admin.examRegs, admin.modules, admin.prerequisites
- **Ausgelassen:** `modules/new/page.tsx` (Erstellen inline in ER-Detail), `prerequisites/page.tsx` (aus Modul-Detail heraus)

### Phase 10 – Import + Audit-Log Frontend (1 Tag)
- [ ] `components/admin/JsonImportZone.tsx` – Drag & Drop + JSON-Validierung + Vorschau
- [ ] `app/[locale]/admin/import/page.tsx`
- [ ] `app/[locale]/admin/audit-log/page.tsx` – Timeline-View mit Filtern
- [ ] `app/[locale]/admin/system/page.tsx`

### Phase 11 – Admin-Link im User-Dashboard (0.5 Tage) ✅
- [x] `AppSidebar.tsx`: Admin-Link ganz unten (nur wenn `is_admin` im JWT)
- [x] `MobileNav.tsx`: gleicher Admin-Link

### Phase 12 – Tests + Härtung (1 Tag)
- [ ] Backend-Tests: alle Admin-Endpunkte (401/403-Schutz, Audit-Log-Einträge)
- [ ] TypeScript-Check: keine Fehler
- [ ] Middleware-Test: Non-Admin → 403
- [ ] Admin-Session-Expiry-Test
- [ ] JSON-Import mit ungültigen Daten → korrekte Fehlermeldungen

---

## Technische Entscheidungen (ADRs)

### ADR-019: Admin-Session via Redis
**Problem:** Admin-Re-Auth-Tokens müssen server-seitig invalidierbar sein (bei Logout oder Expiry).  
**Entscheidung:** Kurzlebige Admin-Session-Tokens werden in Redis gespeichert (15 Min TTL). Bei Admin-Re-Auth (`POST /admin/auth/session`) → UUID-Token generiert, in Redis gesetzt, im Response zurückgegeben. Destruktive Endpoints prüfen `X-Admin-Token` Header gegen Redis.  
**Alternativen:** JWT-Claim für Admin-Session (nicht server-seitig invalidierbar), DB-Tabelle (zu langsam).

### ADR-020: Soft Delete statt Hard Delete
**Problem:** Module und Programme dürfen nicht gelöscht werden, wenn Studierende sie in ihrem Plan haben (Datenverlust, Inkonsistenz).  
**Entscheidung:** `is_archived` Flag. Archivierte Einträge sind für Studierende unsichtbar, Admin kann sie sehen und wiederherstellen. Begründungspflicht bei Archivierung wird im Audit-Log gespeichert.  
**Ausnahme:** `module_prerequisites` können hart gelöscht werden (nur Metadaten, keine Student-Daten).

### ADR-021: JWT mit is_admin Claim
**Problem:** Frontend-Middleware muss schnell wissen ob ein User Admin ist, ohne DB-Abfrage.  
**Entscheidung:** `is_admin: bool` wird beim Login in den JWT-Payload eingebettet. Middleware liest den Claim aus dem Cookie-JWT.  
**Sicherheit:** Admin-Flag-Änderung im Backend → nächster Login generiert neuen JWT mit korrektem Claim. Kein Session-Hijacking möglich da Token httpOnly.

### ADR-022: AdminDataTable als Server-side Paginated Component
**Problem:** User- und Modul-Listen können wachsen. Client-side Pagination auf 500+ Einträgen ist langsam.  
**Entscheidung:** Alle Admin-Listen sind server-seitig paginiert (default: 25/Seite). AdminDataTable nimmt `data`, `total`, `page`, `onPageChange` als Props. Suche/Filter werden als Query-Parameter an das Backend weitergegeben.

---

## Nicht in Sprint 5 (bewusst zurückgestellt)

| Feature | Warum nicht jetzt | Sprint |
|---|---|---|
| PDF-Parser für PO-Import | Komplex, braucht ML/NLP oder PDF-Parsing-Service | Sprint 7 |
| Multi-Admin (Rollen) | Nur 1 Admin nötig | Sprint 7+ |
| Admin-2FA (TOTP) | Overkill für Solo-Admin in Dev | Sprint 6 |
| E-Mail-Templates Admin | Sprint 6 (Email-System) | Sprint 6 |
| Massenoperationen auf Usern | Kein Use-Case jetzt | Sprint 7+ |
| Admin-API-Rate-Limiting | Sprint 6 (Security Audit) | Sprint 6 |

---

## Abhängigkeiten & Voraussetzungen

- ✅ Sprint 4 abgeschlossen (module_prerequisites, pruefungsart, alle Migrationen bis 0014)
- ✅ Redis im Docker-Compose vorhanden (für Admin-Session-Tokens)
- ✅ Resend E-Mail-Integration vorhanden (für Passwort-Reset-Mail)
- Recharts installieren: `npm install recharts` (für Analytics-Charts)

---

## Erfolgskriterien Sprint 5

- [ ] Admin kann sich per `/admin/login` re-authentifizieren
- [ ] Admin kann alle User sehen, aktivieren/deaktivieren, Premium setzen
- [ ] Admin kann Module anlegen, bearbeiten und archivieren (mit Begründung)
- [ ] Admin kann einen neuen Studiengang per JSON-Import anlegen
- [ ] Jede Mutation erscheint im Audit-Log mit old/new Werten
- [ ] Non-Admins erhalten 403 auf allen /admin-Routes (Middleware + Backend)
- [ ] Admin-Session läuft nach 15 Minuten ab, destruktive Operationen erfordern Token
- [ ] Dashboard zeigt KPIs + Wachstums-Chart
- [ ] Alle Backend-Tests grün, TypeScript-Check sauber
