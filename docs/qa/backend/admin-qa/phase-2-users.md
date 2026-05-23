# Phase 2: User Management (`users.py`)

## 1. Übersicht
**Fokus-Bereich:** FastAPI Router `app/routers/admin/users.py`
**Testdatei:** `tests/test_admin_users.py`
**Ziele:** Überprüfung der 100% Test Coverage für die User Management API (GET paginated list, GET detail, PATCH updates, POST password-reset, DELETE cascade removal). Validation der Security-Guards und Audit-Logging Integration.

## 2. Test Coverage Report
Die Test Coverage wurde mit `pytest` isoliert und mit vollständigem Dependency Mocking gemessen.

```text
--------- coverage: platform darwin, python 3.11.15-final-0 ----------
Name                         Stmts   Miss  Cover   Missing
----------------------------------------------------------
app/routers/admin/users.py     135      0   100%
----------------------------------------------------------
TOTAL                          135      0   100%
```
**Ergebnis:** 100% Test-Coverage für den `users.py` Router erreicht.

## 3. Abgedeckte Endpunkte & Edge Cases

### `GET /admin/users` (List)
- **[Erfolg]**: Paginierte Liste wird korrekt generiert.
- **[Erfolg]**: Filtern nach Suchbegriffen (Email, Name, Matrikelnummer) und Booleans (`is_active`, `is_premium`, `is_verified`) funktioniert.
- **[Fehler - 403]**: Non-Admin Requests werden über die Dependency sicher blockiert.

### `GET /admin/users/{id}` (Detail)
- **[Erfolg]**: Detailliertes Profil inklusive komplexer Berechnungen für Program Name, Start Semester, GPA und ECTS wird erfolgreich aggregiert.
- **[Fehler - 404]**: Wird der User nicht gefunden, greift das saubere Error-Handling (`404 Not Found`).
- **[Edge Cases]**: Abfangen leerer `UserProgram` oder `StudentModule` Ergebnisse (GPA Calculation Fallback).

### `PATCH /admin/users/{id}` (Update)
- **[Erfolg]**: Felder (`is_active`, `is_premium`, `is_verified`, `admin_notes`) werden geupdatet.
- **[Erfolg]**: **AuditLogger** (`audit.log`) wird korrekt mit Action `UPDATE` aufgerufen, alte Werte werden gespeichert.
- **[Fehler - 404]**: Unbekannte IDs liefern `404`.

### `POST /admin/users/{id}/reset-password` (Passwort-Reset)
- **[Erfolg]**: Es wird ein sicheres, zufälliges Passwort generiert, in der DB gehasht gespeichert, im Audit-Log vermerkt und per Background-Task an den User gemailt.
- **[Fehler - 401]**: Der Endpunkt verlangt zwingend den `X-Admin-Token` (get_verified_admin Dependency).
- **[Fehler - 404]**: Unbekannter User liefert `404`.

### `DELETE /admin/users/{id}` (Hard Delete)
- **[Erfolg - 204]**: Hard-Delete inklusive Löschung verknüpfter `StudentModule` und `UserProgram` Einträge (Cascade), dokumentiert im Audit-Log inkl. Deletion-Reason.
- **[Fehler - 403]**: Löschen von Admin-Accounts via API wird aktiv verboten.
- **[Fehler - 401]**: Destruktive Route verlangt gültigen `X-Admin-Token` im Header.

## 4. Gefixte Bugs & Anpassungen
- **Fehlende Coverage:** Für den `reset_password` Endpunkt sowie für die 404-Fälle bei `PATCH` und `DELETE` fehlten zuvor isolierte Tests, was das Risiko für Regressionen mit sich brachte.
- **Mocking DI DB:** Die Pytest-Tests nutzen nun komplett saubere Dependency Injections (Mocking von `get_db`), um die Endpunkte ohne Datenbank sicher zu validieren. Es wurden alle Verzweigungen des Routers angesteuert (insbes. Zeilen 64 & 89 für leere Aggregate).

## 5. Status
**Phase 2 ist komplett abgeschlossen.** Das User-Management-Backend ist fehlerfrei und testgesichert.
