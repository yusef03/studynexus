# Sprint 6 Backlog

Basierend auf dem Deep Audit des Admin Panels (Ende Sprint 5) wurden folgende High, Medium und Feature-Issues zur Abarbeitung in Sprint 6 zurückgestellt.

## 🟡 High Priority (Hoch)

### 1. E-Mail-Verifiziert Toggle → Read-Only umbauen
- **Problem:** Der `is_verified` Toggle in der User-Detail-Ansicht erlaubt das manuelle An- und Ausschalten. Ausschalten könnte den Nutzer versehentlich aussperren.
- **Ziel:** Den interaktiven Toggle durch einen reinen Status-Anzeiger (Badge/Chip) ersetzen (Grün = Verifiziert, Grau = Nicht verifiziert).

### 2. Delete-Error wird still geschluckt (Frontend)
- **Problem:** In mehreren `handleDelete`/`handleToggle` Funktionen fehlt Fehler-Feedback (leere catch-Blocks).
- **Ziel:** Globales Error-Toast-System implementieren oder lokale Error-States mit visueller Rückmeldung ergänzen (wie bei Bug 2 umgesetzt, aber globaler).

### 3. PDF-Import (Modulhandbücher)
- **Problem:** Der PDF-Import ist aktuell ein Stub (`501 Not Implemented`). 
- **Ziel:** Implementierung einer echten PDF-Parsing-Lösung (z.B. Tabellenextraktion), ggf. mit LLM-Unterstützung für unstrukturierte PDFs.

---

## 🟢 Medium Priority (Verbesserungen & Datenintegrität)

### 4. JSON-Import — Prerequisite-Import
- **Problem:** Der Bulk-Import erstellt nur Module. Voraussetzungs-Beziehungen müssen manuell angelegt werden.
- **Ziel:** Schema um ein optionales `prerequisites`-Array erweitern, das im Backend verarbeitet wird.

### 5. JSON-Import — Dry-Run Modus
- **Problem:** Es gibt keine Preview für Bulk-Imports.
- **Ziel:** Einen Query-Parameter `?dry_run=true` einbauen, der Validierungen testet, ohne `db.commit()` auszuführen.

### 6. JSON-Import — Bulk-Undo (Import-History)
- **Problem:** Keine Möglichkeit, einen fehlerhaften Import mit einem Klick rückgängig zu machen.
- **Ziel:** Tracking von Import-IDs im Audit Log, um alle in einem Schwung erstellten Module wieder archivieren zu können.

### 7. Multi-Hochschule (Architektur-Entscheidung)
- **Problem:** `User.university` ist ein einfacher String. `SetupForm` nimmt hardcoded die erste Hochschule.
- **Ziel:** Strategische Entscheidung, ob das System "HsH-only" bleibt oder ob eine DB-Migration zu einer vollwertigen Mandantenfähigkeit (`university_id UUID FK`) nötig wird.

---

## 🚀 Feature-Erweiterungen (Admin UX)

- **Breadcrumb Navigation:** Klare Hierarchie anzeigen (Hochschule → Fakultät → Studiengang → PO → Module).
- **Batch-Operationen:** Mehrere Module oder Nutzer gleichzeitig archivieren/wiederherstellen.
- **Admin Activity Dashboard:** Visualisierung des Audit-Logs im Dashboard (Wer hat wann was geändert?).
- **Cascading Delete Warnings:** Vor dem Löschen einer Hochschule/Fakultät genau auflisten, wie viele abhängige Daten betroffen wären.
- **Orphan Detection:** Dashboard-Widget für "verwaiste" Daten (Module ohne PO, POs ohne Studiengang).
- **Consistency Checks:** Automatisierte Warnungen, wenn die Summe der ECTS in einem Studiengang nicht den PO-Vorgaben entspricht.
