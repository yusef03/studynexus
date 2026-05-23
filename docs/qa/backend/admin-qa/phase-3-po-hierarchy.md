# Phase 3: PO-Hierarchie (`universities.py`, `faculties.py`, `programs.py`, `exam_regulations.py`)

## 1. Übersicht
**Fokus-Bereiche:** 
- `app/routers/admin/universities.py`
- `app/routers/admin/faculties.py`
- `app/routers/admin/programs.py`
- `app/routers/admin/exam_regulations.py`
**Testdatei:** `tests/test_admin_po.py`
**Ziele:** Gewährleistung der 100% Testabdeckung für die vier Ebenen der PO-Hierarchie. Validierung der Soft-Delete-Mechanismen (Archive/Restore), Absicherung des Audit-Loggings mit Begründungspflicht und Validierung kaskadierender Referenzen (Hierarchie).

## 2. Test Coverage Report
Alle Datenbankinteraktionen wurden via Dependency Injection (`get_db`) gemockt, um Seiteneffekte auszuschließen.

```text
--------- coverage: platform darwin, python 3.11.15-final-0 ----------
Name                                    Stmts   Miss  Cover   Missing
---------------------------------------------------------------------
app/routers/admin/exam_regulations.py      83      0   100%
app/routers/admin/faculties.py             56      0   100%
app/routers/admin/programs.py              89      0   100%
app/routers/admin/universities.py          57      0   100%
---------------------------------------------------------------------
TOTAL                                     285      0   100%
```
**Ergebnis:** 100% Test-Coverage für das gesamte PO-Hierarchie Backend.

## 3. Abgedeckte Endpunkte & Edge Cases

### `Universities` und `Faculties` (Kein Soft-Delete)
- **CREATE/GET/PATCH**: Alle Standard-Operationen wurden erfolgreich validiert inkl. Audit-Logs für CREATE und UPDATE. 404-Handling für unbekannte Knoten-IDs funktioniert zuverlässig.
- **Hierarchie-Validierung (`CREATE Fakultät`)**: Verhindert die Anlage, falls die zugehörige `university_id` nicht existiert (`404`).
- **DELETE (Hard Delete)**: 
  - Verhindert das Löschen einer Uni, wenn Fakultäten verknüpft sind (`409 Conflict`).
  - Verhindert das Löschen einer Fakultät, wenn Studiengänge (Programs) verknüpft sind (`409 Conflict`).
  - Destruktive Endpunkte erfordern durchgängig `X-Admin-Token` (`401 Unauthorized` ohne Token).

### `Programs` und `Exam Regulations (PO)` (Soft-Delete)
- **GET (List)**: Standardmäßig werden nur aktive (nicht-archivierte) Einträge zurückgegeben. Das Filtern nach Parent-IDs (z.B. `faculty_id`) und das Inkludieren archivierter Einträge via `?include_archived=true` funktioniert.
- **GET (Detail)**:
  - `Programs`: Die Anzahl verknüpfter Studenten über die entsprechenden Prüfungsordnungen (`student_count`) wird korrekt aggregiert, selbst bei 0 Studenten.
  - `Exam Regulations`: Die aggregierte Zählung aktiver (nicht-archivierter) Module (`module_count`) liefert korrekte Werte.
- **ARCHIVE (Soft Delete)**:
  - Pflichtparameter `reason` (Begründung) via Payload wird eingefordert.
  - Der AuditLogger registriert die Aktion `ARCHIVE` zusammen mit der Begründung.
  - Setzt intern das Flag `is_archived = True`, das Datum `archived_at` und die Admin-Referenz `archived_by`.
  - Blockiert Archivierungs-Aufrufe bei bereits archivierten Einträgen (`400 Bad Request`).
- **RESTORE**:
  - Reversiert die Archivierung. Setzt die Archivierungsfelder auf `None` bzw. `False`.
  - Verhindert den Restore bei nicht-archivierten Einträgen (`400 Bad Request`).
  - Wird als `RESTORE` im Audit-Log dokumentiert.
- **Hierarchie-Validierung (`CREATE`)**: Wie auch bei den Fakultäten greifen `404 Not Found` Fehler, wenn Parent-Knoten (Fakultät bzw. Studiengang) nicht existieren.

## 4. Gefixte Bugs & Anpassungen
- **Pydantic Validation Bugs in Tests:** Bei den initialen Tests schlugen Mock-Antworten fehl, weil boolesche Flags (`is_archived`) und Datumsfelder (`gueltig_ab` auf `ExamRegulation`) durch `MagicMock` Platzhalter ersetzt wurden, die von Pydantic abgelehnt wurden. 
  **Fix:** Ich habe saubere Helper-Funktionen implementiert (`_make_uni`, `_make_fac`, `_make_program`, `_make_er` und `_mock_refresh`), die korrekte Pydantic-konforme Datentypen (`bool`, `datetime`, `date`) zurückliefern.
- **Coverage-Lücken geschlossen:** Zuvor fehlten zahlreiche Abzweigungen – insbesondere die 404/400-Pfade bei Updates und Soft-Deletes. Diese wurden durch explizite Fehler-Tests abgedeckt (z.B. Archivieren von nicht-existenten oder bereits archivierten Datensätzen).

## 5. Status
**Phase 3 ist komplett abgeschlossen.** Das PO-Hierarchie Backend ist vollständig getestet, inkludiert das Audit-Logging und sichert referenzielle Integrität sowie Soft-Deletes einwandfrei ab.
