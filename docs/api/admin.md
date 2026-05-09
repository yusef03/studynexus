# Admin API – StudyNexus

*Sprint 5 — Implementiert ab 2026-05-09*  
*Alle Endpunkte unter `/api/v1/admin/`*

---

## Sicherheits-Architektur (2-Layer)

```
Layer 1 — is_admin (JWT-Claim)
  → Lesende Endpunkte (GET /admin/*)
  → Nicht-destruktive Mutationen (PATCH is_active, admin_notes, ...)
  → FastAPI Dependency: get_admin_user

Layer 2 — Admin-Session-Token (Redis, 15 Min)
  → Destruktive Operationen (Archive, Delete, Reset-Password, JSON-Import)
  → Header: X-Admin-Token: <uuid>
  → FastAPI Dependency: get_verified_admin
```

### Admin-Flag setzen (einmalig, manuell)

Kein E-Mail-Seed im Code — Admin-Flag wird **manuell** in der DB gesetzt, damit keine persönlichen Daten im Repository stehen:

```bash
docker compose exec db psql -U studynexus -d studynexus \
  -c "UPDATE users SET is_admin=true WHERE email='<deine-email>@stud.hs-hannover.de';"
```

Danach: neu einloggen → JWT enthält `is_admin=true` → `/admin`-Route zugänglich.

---

## Frontend-Proxy

Alle Admin-Requests laufen über den Next.js Catch-all-Proxy:

```
Browser → /api/admin/* → Next.js Route → BACKEND/api/v1/admin/*
```

Die Proxy-Route (`app/api/admin/[...path]/route.ts`) leitet automatisch weiter:
- `Authorization: Bearer <access_token>` (aus httpOnly Cookie)
- `X-Admin-Token: <token>` (wenn vom Frontend gesendet)

---

## Endpunkte

### Admin Auth

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `POST` | `/admin/auth/session` | is_admin | Passwort bestätigen → Admin-Session-Token (15 Min, Redis) |
| `DELETE` | `/admin/auth/session` | Admin-Token | Session invalidieren |
| `GET` | `/admin/me` | is_admin | Eigenes Admin-Profil (id, email, full_name) |

**Request `POST /admin/auth/session`:**
```json
{ "password": "••••••••" }
```

**Response:**
```json
{ "admin_token": "uuid-string", "expires_in": 900 }
```

---

### Analytics & KPIs

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/admin/stats` | is_admin | 13 KPI-Felder (User-Counts, Module-Stats, DB-Größe) |
| `GET` | `/admin/stats/growth` | is_admin | Tages-Zeitreihe Registrierungen (`?period=7d\|30d\|90d\|1y`) |
| `GET` | `/admin/stats/modules` | is_admin | Modul-Rangliste (beliebteste, Ø-Note, Bestehensquote) |
| `GET` | `/admin/stats/users` | is_admin | User-Segmentierung nach Programm, Aktivität, Premium |
| `GET` | `/admin/system` | is_admin | DB-Version, DB-Größe, Service-Counts |
| `GET` | `/admin/system/health` | is_admin | Health-Check: DB + Redis Ping |

**Response `GET /admin/stats`:**
```json
{
  "total_users": 247,
  "verified_users": 198,
  "active_users_30d": 89,
  "premium_users": 12,
  "total_student_modules": 3421,
  "passed_modules_today": 7,
  "new_registrations_today": 3,
  "new_registrations_week": 14,
  "total_universities": 1,
  "total_programs": 1,
  "total_modules": 37,
  "db_size_mb": 42.7,
  "last_updated": "2026-05-10T14:23:00Z"
}
```

**Response `GET /admin/stats/growth?period=30d`:**
```json
{
  "period": "30d",
  "total": 58,
  "data": [
    { "date": "2026-04-11", "count": 2 },
    { "date": "2026-04-12", "count": 0 },
    ...
  ]
}
```

---

### User Management

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/admin/users` | is_admin | Paginierte Nutzerliste mit Filtern |
| `GET` | `/admin/users/{id}` | is_admin | Nutzer-Detail mit Studienplan-Zusammenfassung |
| `PATCH` | `/admin/users/{id}` | is_admin | is_active / is_premium / is_verified / admin_notes |
| `POST` | `/admin/users/{id}/reset-password` | Admin-Token | Reset-E-Mail senden |
| `DELETE` | `/admin/users/{id}` | Admin-Token | Nutzer + alle Daten löschen (Begründung Pflicht) |

**Query-Parameter `GET /admin/users`:**

| Parameter | Typ | Beschreibung |
|---|---|---|
| `page` | int | Seite (default: 1) |
| `page_size` | int | Einträge/Seite (default: 25) |
| `search` | string | Freitext-Suche (Name, E-Mail, Matrikel) |
| `is_active` | bool | Filter nach is_active |
| `is_premium` | bool | Filter nach is_premium |
| `is_verified` | bool | Filter nach is_verified |

**Response `GET /admin/users`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "email": "max@stud.hs-hannover.de",
      "full_name": "Max Mustermann",
      "matrikelnummer": "1234567",
      "is_active": true,
      "is_premium": false,
      "is_verified": true,
      "is_admin": false,
      "preferred_language": "de",
      "created_at": "2026-04-20T10:00:00Z",
      "last_login_at": "2026-05-09T09:11:00Z",
      "program_name": "Angewandte Informatik",
      "start_semester": "WiSe 2024/25",
      "total_modules": 23,
      "passed_modules": 12,
      "erreichte_ects": 72
    }
  ],
  "total": 247,
  "page": 1,
  "page_size": 25,
  "total_pages": 10
}
```

**Response `GET /admin/users/{id}`** (zusätzliche Felder gegenüber List):
```json
{
  "university": "Hochschule Hannover",
  "birth_date": "2002-03-15T00:00:00Z",
  "admin_notes": "Interne Notizen des Admins...",
  "gpa": 2.1
}
```

**Request `PATCH /admin/users/{id}`** (alle Felder optional):
```json
{
  "is_active": false,
  "is_premium": true,
  "is_verified": true,
  "admin_notes": "Notiz vom Admin"
}
```

**Request `DELETE /admin/users/{id}`:**
```json
{ "reason": "Auf Nutzerwunsch — DSGVO Art. 17" }
```
Response: `204 No Content`

---

### Hochschulen (Universities)

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/admin/universities` | is_admin | Liste aller Hochschulen |
| `POST` | `/admin/universities` | Admin-Token | Neue Hochschule anlegen |
| `GET` | `/admin/universities/{id}` | is_admin | Detail + Fakultätenliste |
| `PATCH` | `/admin/universities/{id}` | Admin-Token | Bearbeiten |
| `DELETE` | `/admin/universities/{id}` | Admin-Token | Löschen (nur wenn keine Fakultäten — 409 sonst) |

---

### Fakultäten (Faculties)

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/admin/faculties` | is_admin | Liste (filter: `university_id`) |
| `POST` | `/admin/faculties` | Admin-Token | Anlegen |
| `PATCH` | `/admin/faculties/{id}` | Admin-Token | Bearbeiten |
| `DELETE` | `/admin/faculties/{id}` | Admin-Token | Löschen (nur wenn keine Programme — 409 sonst) |

---

### Studiengänge (Programs)

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/admin/programs` | is_admin | Liste (filter: `faculty_id`, `include_archived`) |
| `POST` | `/admin/programs` | Admin-Token | Anlegen |
| `GET` | `/admin/programs/{id}` | is_admin | Detail + Prüfungsordnungen + Studierendenzahl |
| `PATCH` | `/admin/programs/{id}` | Admin-Token | Bearbeiten |
| `POST` | `/admin/programs/{id}/archive` | Admin-Token | Soft Delete (Begründung Pflicht) |
| `POST` | `/admin/programs/{id}/restore` | Admin-Token | Wiederherstellen |

---

### Prüfungsordnungen (Exam Regulations)

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/admin/exam-regulations` | is_admin | Liste (filter: `program_id`, `include_archived`) |
| `POST` | `/admin/exam-regulations` | Admin-Token | Anlegen |
| `GET` | `/admin/exam-regulations/{id}` | is_admin | Detail + Modulanzahl |
| `PATCH` | `/admin/exam-regulations/{id}` | Admin-Token | Bearbeiten |
| `POST` | `/admin/exam-regulations/{id}/archive` | Admin-Token | Soft Delete (Begründung Pflicht) |
| `POST` | `/admin/exam-regulations/{id}/restore` | Admin-Token | Wiederherstellen |

---

### Module

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/admin/modules` | is_admin | Liste (filter: `exam_reg_id`, `modul_typ`, `is_archived`, `search`) |
| `POST` | `/admin/modules` | Admin-Token | Einzelnes Modul anlegen |
| `GET` | `/admin/modules/{id}` | is_admin | Detail + StudentModule-Count + Voraussetzungen |
| `PATCH` | `/admin/modules/{id}` | Admin-Token | Alle Felder bearbeitbar |
| `POST` | `/admin/modules/{id}/archive` | Admin-Token | Soft Delete (Begründung Pflicht) |
| `POST` | `/admin/modules/{id}/restore` | Admin-Token | Wiederherstellen |
| `POST` | `/admin/modules/import/json` | Admin-Token | JSON-Bulk-Import (bis 500 Module) |
| `POST` | `/admin/modules/import/pdf` | Admin-Token | PDF-Parser (501 Not Implemented — Sprint 7) |

**JSON-Import Request:**
```json
{
  "exam_regulation_id": "uuid",
  "modules": [
    {
      "name": "Programmieren 1",
      "kuerzel": "BIN-100",
      "ects": 6,
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

**JSON-Import Response:**
```json
{
  "created": 37,
  "skipped": 0,
  "errors": [],
  "audit_log_id": "uuid"
}
```

---

### Voraussetzungen (Prerequisites)

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/admin/prerequisites` | is_admin | Liste (filter: `module_id`, `prerequisite_type`) |
| `POST` | `/admin/prerequisites` | Admin-Token | Neue Voraussetzung anlegen |
| `GET` | `/admin/prerequisites/{id}` | is_admin | Detail |
| `PATCH` | `/admin/prerequisites/{id}` | Admin-Token | Bearbeiten |
| `DELETE` | `/admin/prerequisites/{id}` | Admin-Token | Hard Delete (erlaubt — kein Studentdaten-Bezug) |

---

### Audit Log

| Methode | Pfad | Auth | Beschreibung |
|---|---|---|---|
| `GET` | `/admin/audit-log` | is_admin | Paginiert (filter: `admin_id`, `entity_type`, `action`, `date_from`, `date_to`) |
| `GET` | `/admin/audit-log/{id}` | is_admin | Einzelner Eintrag mit vollständigem old/new JSON |

**Response Eintrag:**
```json
{
  "id": "uuid",
  "admin_id": "uuid",
  "admin_name": "Yusef B.",
  "action": "UPDATE",
  "entity_type": "Module",
  "entity_id": "uuid",
  "entity_label": "BIN-209 – Ergänzende Fächer",
  "old_value": { "gewichtung": 1.0 },
  "new_value": { "gewichtung": 1.5 },
  "reason": "PO BIN 2019 Anlage B2",
  "ip_address": "127.0.0.1",
  "created_at": "2026-05-09T14:23:00Z"
}
```

---

## Fehlerbehandlung

| Code | Bedeutung |
|---|---|
| `401` | Nicht authentifiziert oder Admin-Token abgelaufen |
| `403` | Authentifiziert, aber kein `is_admin`-Flag |
| `404` | Entität nicht gefunden |
| `409` | Konflikt (z.B. Löschen einer Hochschule mit Fakultäten) |
| `422` | Validierungsfehler (z.B. fehlende Begründung) |

---

## Audit-Logging

Jede mutierendes Admin-Request erzeugt automatisch einen Audit-Log-Eintrag:

| Aktion | Wann |
|---|---|
| `CREATE` | POST (Anlegen) |
| `UPDATE` | PATCH (Bearbeiten) |
| `ARCHIVE` | POST /archive |
| `RESTORE` | POST /restore |
| `DELETE` | DELETE |
| `RESET_PASSWORD` | POST /reset-password |
| `LOGIN` | POST /auth/session (erfolgreiche Re-Auth) |
| `IMPORT` | POST /import/json |

Die `AuditLogger`-Klasse (`app/core/audit.py`) wird als FastAPI-Dependency injiziert und speichert `old_value` + `new_value` als JSONB, `reason` bei Archivierung/Löschung Pflicht.
