# Sprint 5 — Bug-Fix-Plan (Admin Panel)

**Erstellt:** 2026-05-10  
**Status:** 📋 Geplant — wird diese Woche abgearbeitet  
**Basis:** Manuelle QA-Session nach Phase 12 (alle Bugs vom PO gemeldet)

> **Wichtig:** Dieser Plan beschreibt ausschließlich was kaputt ist und warum es vermutlich kaputt ist.
> Es wird hier NICHTS gefixt. Die Fixes folgen Punkt für Punkt in dieser Woche.

---

## Übersicht der gemeldeten Fehler

| # | Bereich | Fehler | Priorität |
|---|---|---|---|
| BF-01 | Dashboard | Admin-Link für Admin-User nicht sichtbar | 🔴 Hoch |
| BF-02 | User-Detail | Admin-Notizen speichern → "Fehler beim Speichern" | 🔴 Hoch |
| BF-03 | User-Detail | Premium-Toggle → Error, unklar was Premium bedeutet | 🟡 Mittel |
| BF-04 | User-Detail | Passwort-Reset → "Fehler beim Senden der Reset-E-Mail" | 🔴 Hoch |
| BF-05 | User-Detail | User löschen → Wort eingeben → nichts passiert | 🔴 Hoch |
| BF-06 | User-Detail | Account-Status Toggle (aktiv/inaktiv) → kein Effekt | 🔴 Hoch |
| BF-07 | Hochschulen | Create-Modal zeigt rohe i18n-Keys statt Text | 🔴 Hoch |
| BF-08 | Hochschulen | Neue Hochschule anlegen → Error, nichts passiert | 🔴 Hoch |
| BF-09 | Hochschulen | Hochschule bearbeiten → i18n-Keys + Speichern tut nichts | 🔴 Hoch |
| BF-10 | Hochschulen | Neue Fakultät anlegen → nichts passiert | 🔴 Hoch |
| BF-11 | Studiengänge | Alle Mutationen (Anlegen/Bearbeiten/Archivieren) broken | 🔴 Hoch |
| BF-12 | Module | Alle Mutationen (Bearbeiten/Anlegen/Archivieren/Voraussetzungen) broken | 🔴 Hoch |
| BF-13 | Prerequisites | `/admin/prerequisites` → 404 Fehler | 🟡 Mittel |
| BF-14 | Import | `/admin/import` unklare Bedienung + wahrscheinlich broken | 🟡 Mittel |
| BF-15 | Audit-Log | "Fehler beim Laden des Audit-Logs", keine Einträge | 🔴 Hoch |
| BF-16 | System | "Fehler beim Laden" bei Health/DB-Info, zu wenig Funktionalität | 🟡 Mittel |
| BF-17 | Komplett | Abschluss-QA: alle Bereiche nochmal gezielt auf übersehene Bugs prüfen | 🔵 QA |

---

## BF-01 — Admin-Link im User-Dashboard nicht sichtbar

**Bereich:** `/dashboard` → `AppSidebar.tsx` / `MobileNav.tsx`  
**Symptom:** Als eingeloggter Admin-User sieht man unten in der Dashboard-Sidebar keinen "Admin"-Link mehr.  
**Erwartetes Verhalten:** Nur für Admins (`is_admin=true` im JWT) soll ein Admin-Link unten in der Sidebar sichtbar sein.

**Vermutliche Ursachen:**
- Der JWT-Claim `is_admin` wird im Client nicht korrekt ausgelesen (falsche Session-Property)
- Das `session?.user?.is_admin` Feld existiert nicht in der Next-Auth Session-Typdefinition
- Der Admin-Link wurde in Phase 11 hinzugefügt, aber das Bedingungsfeld (`is_admin`) stimmt nicht mit dem JWT-Payload-Feld überein
- Mögliches Linting/Build-Cache-Problem nach dem git filter-repo Rewrite

**Zu überprüfen:**
- Was steht genau in `AppSidebar.tsx` als Bedingung für den Admin-Link?
- Welche Properties hat `session.user` laut den Next-Auth Typen?
- Gibt es einen JWT-Callback in `authOptions` der `is_admin` in die Session überträgt?
- Ist `NEXTAUTH_SECRET` korrekt gesetzt?

---

## BF-02 — Admin-Notizen speichern → "Fehler beim Speichern"

**Bereich:** `/admin/users/[id]` → Admin-Notes-Sektion  
**Symptom:** Admin gibt Text in das Admin-Notizen-Textarea ein, klickt "Speichern" → Fehlermeldung erscheint.  
**Erwartetes Verhalten:** `PATCH /api/v1/admin/users/{id}` mit `{ admin_notes: "..." }` → 200 OK, Seite invalidiert.

**Vermutliche Ursachen:**
- Der `/api/admin/[...path]` Proxy forwarded PATCH-Requests nicht korrekt (HTTP-Methoden-Routing-Bug)
- `adminMutate` setzt keinen `Content-Type: application/json` Header korrekt
- Backend gibt 422 zurück weil Schema-Validierung fehlschlägt (falscher Feldname oder Typ)
- Admin-Session-Token fehlt oder ist nicht korrekt gesetzt beim PATCH-Call (aber PATCH sollte kein Admin-Token brauchen)
- CORS-/CSRF-Problem zwischen Next.js Proxy und Backend

**Zu überprüfen:**
- Was genau antwortet das Backend (Status-Code + Body) bei diesem Request?
- Sendet der Proxy den `Authorization: Bearer` Header korrekt weiter?
- Hat `adminMutate` einen Bug beim Serialisieren des Body?

---

## BF-03 — Premium-Toggle → Error + Premium-Konzept unklar

**Bereich:** `/admin/users/[id]` → is_premium Toggle  
**Symptom A (technisch):** Toggle-Click gibt Error  
**Symptom B (UX):** Was "Premium" bedeutet ist im UI nirgendwo erklärt  
**Erwartetes Verhalten:** Toggle ändert `is_premium` via PATCH, sichtbarer Effekt im UI

**Vermutliche Ursachen (technisch):** Gleiche wie BF-02 (PATCH-Proxy-Bug)

**Premium-Konzept:** `is_premium` ist ein Datenbank-Flag ohne derzeit implementierten Feature-Gate. Es ist als Vorbereitung für zukünftige Premium-Features (Sprint 6+) gedacht. Im Admin-Panel sollte erklärt werden, dass Premium aktuell noch keine konkreten Features freischaltet — aber Admins können es setzen für zukünftige Erweiterungen.

**Zu erledigen:**
- Technischen Bug fixen (PATCH-Proxy)
- Erklärungstext für Premium im UI hinzufügen ("Vorbereitung für Sprint 6 Premium-Features")

---

## BF-04 — Passwort-Reset → "Fehler beim Senden der Reset-E-Mail"

**Bereich:** `/admin/users/[id]` → Danger Zone → Passwort-Reset  
**Symptom:** Button klicken → Fehlermeldung  
**Erwartetes Verhalten:** `POST /api/v1/admin/users/{id}/reset-password` mit Admin-Token → Backend schickt Reset-Mail via Resend API

**Vermutliche Ursachen:**
- `RESEND_API_KEY` ist in der Docker-Umgebung nicht gesetzt / falsch konfiguriert
- Backend-Endpunkt gibt 500 zurück weil Resend-Call fehlschlägt
- Admin-Session-Token fehlt im Request-Header (Endpoint braucht `get_verified_admin`)
- Proxy forwarded `X-Admin-Token` nicht korrekt für POST-Requests
- Der Reset-Token-Mechanismus ist noch nicht vollständig implementiert (Backend-Lücke)

**Zu überprüfen:**
- Backend-Logs beim Aufruf dieses Endpoints
- Ist `RESEND_API_KEY` in `.env` gesetzt?
- Antwortet der `/reset-password` Endpoint überhaupt oder ist es ein Proxy-Problem?

---

## BF-05 — User löschen → "LÖSCHEN" eingeben → nichts passiert

**Bereich:** `/admin/users/[id]` → Danger Zone → Löschen-Button → DeleteDialog  
**Symptom:** DeleteDialog öffnet sich, Admin tippt "LÖSCHEN", klickt Bestätigen → kein sichtbarer Effekt, kein Fehler  
**Erwartetes Verhalten:** `DELETE /api/v1/admin/users/{id}` mit Admin-Token + Reason → 204 → Redirect zu `/admin/users`

**Vermutliche Ursachen:**
- `DELETE`-Method wird vom Catch-all Proxy nicht korrekt behandelt (häufiges Next.js Problem: DELETE Requests mit Body)
- Der Redirect nach erfolgreichem Delete passiert nicht
- Der Admin-Token wird nicht korrekt in den DELETE-Request eingebettet
- `DeleteDialog` signalisiert Completion falsch → `onConfirm` Callback wird nicht aufgerufen
- Body bei DELETE-Request wird von `adminMutate` nicht mitgeschickt (manche HTTP-Clients strippen Body bei DELETE)

**Zu überprüfen:**
- Wird der DELETE-Request überhaupt gesendet (Browser Network Tab)?
- Antwortet das Backend bei diesem DELETE korrekt (204)?
- Wie ist `adminMutate` für DELETE implementiert — sendet es den Body?

---

## BF-06 — Account-Status Toggle (aktiv/inaktiv) → kein Effekt

**Bereich:** `/admin/users/[id]` → Status-Sektion → is_active Toggle  
**Symptom:** Toggle wird geklickt, wechselt vielleicht visuell kurz, kehrt dann in den alten Zustand zurück. Keine Server-Reaktion.  
**Erwartetes Verhalten:** `PATCH /api/v1/admin/users/{id}` mit `{ is_active: !current }` → 200 → UI zeigt neuen Status

**Vermutliche Ursachen:** Gleiche wie BF-02 — PATCH-Proxy-Bug ist wahrscheinlich der zentrale Fehler der BF-02, BF-03, BF-06 alle erklärt. Wenn PATCH kaputt ist, funktioniert kein Toggle.

**Hinweis:** BF-02, BF-03, BF-06 haben vermutlich eine gemeinsame Root Cause im Proxy-Routing oder in `adminMutate`. Ein Fix sollte alle drei lösen.

---

## BF-07 — Create-Modal Hochschulen zeigt rohe i18n-Keys

**Bereich:** `/admin/universities` → "+ Hochschule anlegen" Modal  
**Symptom:** Statt "Name", "Kürzel", "Stadt" etc. stehen die rohen Keys im Modal:
```
admin.universities.form.name
admin.universities.form.namePlaceholder
admin.universities.form.kuerzel
...
```
**Erwartetes Verhalten:** Alle Felder zeigen den übersetzten deutschen/englischen Text.

**Vermutliche Ursachen:**
- Die i18n-Keys `admin.universities.form.*` existieren in `messages/de.json` / `messages/en.json` nicht oder unter einem anderen Namespace
- Der `useTranslations("admin.universities")` Call gibt einen Namespace zurück der die `form.*` Sub-Keys nicht enthält
- Die i18n-Keys wurden in Phase 9 unter einem leicht anderen Namen gespeichert als im Frontend verwendet
- Möglicher Tippfehler im Namespace-Pfad in der Komponente

**Zu überprüfen:**
- Existieren `admin.universities.form.name` etc. in `messages/de.json`?
- Welchen `useTranslations`-Namespace verwendet `universities/page.tsx`?
- Werden die Keys exakt so aufgerufen wie sie in de.json deklariert sind?

---

## BF-08 — Neue Hochschule anlegen → Error

**Bereich:** `/admin/universities` → Create-Form Submit  
**Symptom:** Alle Felder ausgefüllt, "Erstellen" geklickt → Error-Meldung oder nichts passiert  
**Erwartetes Verhalten:** `POST /api/v1/admin/universities` → 201 → Liste aktualisiert

**Vermutliche Ursachen:**
- POST-Requests via Catch-all Proxy funktionieren nicht (Proxy-Bug)
- Fehlende oder falsche `Content-Type: application/json` Header
- Request-Body wird nicht korrekt serialisiert
- CSRF-Check schlägt fehl (fehlender `x-studynexus-client` Header im Admin-Proxy)

**Hinweis:** BF-08, BF-09, BF-10, BF-11, BF-12 könnten alle dieselbe Root Cause haben: der `/api/admin/[...path]` Proxy verarbeitet POST/PATCH/DELETE mit Body nicht korrekt.

---

## BF-09 — Hochschule bearbeiten → i18n-Keys + Speichern tut nichts

**Bereich:** `/admin/universities/[id]` → "Bearbeiten"-Button → Edit-Modal  
**Symptom A:** Modal zeigt rohe i18n-Keys (gleiche Ursache wie BF-07)  
**Symptom B:** Felder ausfüllen, "Speichern" klicken → kein Effekt  
**Erwartetes Verhalten:** `PATCH /api/v1/admin/universities/{id}` → 200 → Detail-Seite aktualisiert

**Vermutliche Ursachen:**
- i18n-Keys fehlen (gleiche Root Cause wie BF-07)
- PATCH-Proxy-Bug (gleiche Root Cause wie BF-02/BF-06)

---

## BF-10 — Neue Fakultät anlegen → nichts passiert

**Bereich:** `/admin/universities/[id]` → "Fakultät hinzufügen"  
**Symptom:** Form ausfüllen, Submit → nichts passiert, Fakultät erscheint nicht  
**Erwartetes Verhalten:** `POST /api/v1/admin/faculties` → 201 → Fakultätsliste aktualisiert

**Vermutliche Ursachen:** POST-Proxy-Bug (gleiche Root Cause wie BF-08)

---

## BF-11 — Studiengänge: alle Mutationen broken

**Bereich:** `/admin/programs` + `/admin/programs/[id]`  
**Symptom:** Anlegen, Bearbeiten, Archivieren funktionieren alle nicht  
**Spezifische Probleme:**
- Create-Modal: wahrscheinlich i18n-Keys broken (gleiche Root Cause wie BF-07)
- POST zum Anlegen: Proxy-Bug (BF-08)
- PATCH zum Bearbeiten: Proxy-Bug (BF-02/BF-06)
- Archive-Button: vermutlich Admin-Token-Forwarding defekt für POST-Requests mit Token

**Zu überprüfen:**
- Werden Archive/Restore (`POST /programs/{id}/archive`) korrekt gesendet?
- Forwarded der Proxy den `X-Admin-Token`-Header für POST-Requests?

---

## BF-12 — Module: alle Mutationen broken

**Bereich:** `/admin/modules` + `/admin/modules/[id]`  
**Symptom:** Bearbeiten, Anlegen, Archivieren, Voraussetzungen anlegen/löschen — alles broken  

**Vermutliche Ursachen:**
- Kombination aus i18n-Bug (BF-07) + Proxy-Bug (BF-08/BF-06)
- DELETE für Voraussetzungen: gleicher DELETE-mit-Body-Bug wie BF-05

**Besonderes Problem:** Voraussetzungen anlegen hat TYPE-konditionelle Felder. Wenn das Form-Submit kaputt ist, sieht man nie ob die Logik korrekt wäre.

---

## BF-13 — `/admin/prerequisites` → 404 Fehler

**Bereich:** Admin-Sidebar → "Voraussetzungen" Link → `/admin/prerequisites`  
**Symptom:** Seite gibt 404 zurück (Next.js 404-Seite oder Backend-404)  
**Erwartetes Verhalten:** Seite sollte existieren oder der Link sollte nicht in der Sidebar sein

**Vermutliche Ursachen:**
- Die Seite `/admin/prerequisites/page.tsx` wurde in Phase 9 bewusst weggelassen ("Ausgelassen: prerequisites/page.tsx — Verwalten direkt aus Modul-Detail")
- Der Sidebar-Link zur Seite wurde aber trotzdem behalten oder ist in der Navigation vorhanden
- Entweder: Seite muss noch gebaut werden ODER Sidebar-Link muss entfernt werden

**Entscheidung nötig:** Soll eine `/admin/prerequisites`-Übersichtsseite gebaut werden, oder soll der Sidebar-Link einfach entfernt werden (da Prerequisites direkt aus `/admin/modules/[id]` verwaltet werden)?

---

## BF-14 — `/admin/import` unklare Bedienung + vermutlich broken

**Bereich:** `/admin/import`  
**Symptom:** Unklar wie die Seite zu bedienen ist. Wahrscheinlich funktioniert der Import auch nicht.

**Import-Flow (wie er sein soll):**
1. UUID der Ziel-Prüfungsordnung (ExamRegulation) eingeben
2. JSON-Array einfügen (Modul-Definitionen)
3. "Validieren" klicken → Vorschau erscheint
4. "Import ausführen" klicken → Module werden angelegt

**UX-Probleme:**
- Es ist nicht klar, wo man die UUID einer PO herbekommt (kein Dropdown, kein Suchfeld)
- Kein Hinweis wie das JSON-Format aussehen muss
- Kein Link zur Dokumentation des Formats

**Technische Probleme (vermutet):**
- POST-Proxy-Bug (gleiche Root Cause wie BF-08) → Import-Request schlägt fehl
- Admin-Session-Token wird für den Import evtl. nicht korrekt mitgeschickt

**Verbesserungen die geplant werden:**
- Erklärungstext / Beispiel-JSON direkt auf der Seite
- Link zu den Prüfungsordnungen um die richtige UUID zu finden
- Konkreter Error-Text statt generischem Fehler

---

## BF-15 — Audit-Log: "Fehler beim Laden", keine Einträge

**Bereich:** `/admin/audit-log`  
**Symptom A:** "Fehler beim Laden des Audit-Logs" — Seite kann keine Daten laden  
**Symptom B:** Keine Einträge für User-Logins oder Admin-Aktionen

**Vermutliche Ursachen (technisch):**
- GET-Request an `/api/admin/audit-log` schlägt fehl — Proxy-Bug (GET funktioniert normalerweise, muss geprüft werden)
- Backend-Endpunkt `/api/v1/admin/audit-log` ist zwar implementiert, aber NICHT korrekt im Router registriert
- CORS / Auth-Problem beim GET-Proxy-Call

**Vermutliche Ursachen (keine Daten):**
- `AuditLogger.log()` wird in den Routern aufgerufen, aber die DB-Session macht kein `flush()` / `commit()` zum richtigen Zeitpunkt
- `admin_id` in Audit-Einträgen ist NULL weil der User-Lookup fehlschlägt
- Die `admin_audit_logs`-Tabelle ist tatsächlich leer weil keine der Mutationen je committed wurde (Zusammenhang mit BF-08 — wenn POST kaputt ist, werden auch keine Audit-Einträge geschrieben)

**Login-Logging:** User-Logins sollten ebenfalls geloggt werden (`action="LOGIN"`). Muss geprüft werden ob `auth.py router` bei Login `AuditLogger.log()` aufruft.

---

## BF-16 — System-Seite: Fehler beim Laden + zu wenig Funktionalität

**Bereich:** `/admin/system`  
**Symptom A:** "Fehler beim Laden" bei Dienst-Health oder Datenbank-Info  
**Symptom B:** Die Seite zeigt nur statische Infos, ist nicht wirklich nützlich für Admin-Arbeit

**Vermutliche Ursachen (technisch):**
- GET `/api/admin/system` oder `/api/admin/system/health` schlägt fehl (Proxy-Bug oder Backend-Fehler)
- Redis-Connection in der Docker-Umgebung nicht korrekt konfiguriert → Health-Check gibt Fehler

**Was die System-Seite alles können sollte (Erweiterungsplan):**
- Aktuelle Datenbank-Verbindungsinfo (Host, Version, Größe)
- Redis-Status (connected/disconnected, Schlüssel-Anzahl, Memory)
- Backend-Version / Commit-Hash
- Umgebungsvariablen-Status (welche sind gesetzt, welche fehlen — ohne Werte anzuzeigen)
- Aktive Admin-Sessions (Anzahl, evtl. alle revoken)
- Neueste Alembic-Migration-Version
- Letzter Backup-Zeitstempel (Placeholder für Sprint 6)
- Direkt-Links zu wichtigen Backend-Ressourcen (API-Docs, DB-Admin)
- "Cache leeren" / "Redis flush" für Admins (mit Bestätigung)

---

## BF-17 — Abschluss-QA: Vollständige Bug-Analyse nach allen Fixes

**Typ:** Qualitätssicherungs-Schritt (kein konkreter Bug)  
**Wann:** Nach Abschluss aller BF-01 bis BF-16

**Was zu prüfen ist:**

**Allgemeine Prüfung:**
- [ ] Alle Admin-Seiten öffnen und auf Konsolenfehlern prüfen (Browser DevTools)
- [ ] Alle GET-Requests verifizieren (Daten laden korrekt)
- [ ] Alle POST-Requests verifizieren (Create funktioniert)
- [ ] Alle PATCH-Requests verifizieren (Edit funktioniert)
- [ ] Alle DELETE-Requests verifizieren (Delete funktioniert)
- [ ] Admin-Session-Flow komplett durchspielen (Login → Timer → Expiry → Re-Auth)
- [ ] Mobile Ansicht auf allen Seiten prüfen

**Spezifische Pfade:**
- [ ] Kompletter PO-Import-Flow von Anfang bis Ende
- [ ] Neuen Studiengang komplett anlegen (Hochschule → Fakultät → Studiengang → PO → Module)
- [ ] User komplett verwalten (Ansehen → Bearbeiten → Status ändern → Löschen)
- [ ] Audit-Log prüfen: erscheinen alle Mutationen als Einträge?
- [ ] System-Health: DB + Redis als "ok" angezeigt?
- [ ] i18n: Alle Seiten auf DE und EN prüfen

**Neue potenzielle Bugs:**
- [ ] Gibt es Seiten die für eingeloggte Nicht-Admins zugänglich sind?
- [ ] Gibt es Seiten die ohne Admin-Session destruktive Ops erlauben?
- [ ] Gibt es Race Conditions beim gleichzeitigen Invalidieren von Query-Caches?
- [ ] Gibt es 404-Seiten die besser sein könnten?
- [ ] Gibt es leere Zustände die keinen Hilfetext haben?

---

## Root-Cause-Hypothesen (Zusammenfassung)

Viele der oben genannten Bugs könnten auf 2–3 Root Causes zurückgeführt werden:

### Hypothese A: Proxy-Bug (wahrscheinlichste Root Cause für BF-02, BF-05, BF-06, BF-08, BF-09, BF-10, BF-11, BF-12)

Der Catch-all Proxy `/api/admin/[...path]/route.ts` hat möglicherweise:
- Ein Problem mit POST/PATCH/DELETE und Body-Forwarding
- Einen fehlenden oder falschen `Content-Type`-Header
- Einen fehlenden CSRF-Header (`x-studynexus-client`)
- Kein korrektes Forwarding des `X-Admin-Token` Headers für alle Methoden

### Hypothese B: i18n-Namespace-Bug (Root Cause für BF-07, BF-09, teile von BF-11/BF-12)

Die i18n-Keys wurden in Phase 9 möglicherweise unter einem anderen Pfad gespeichert als die Komponenten sie erwarten. Zum Beispiel:
- Gespeichert: `admin.universities.form.name`
- Verwendet: `t("form.name")` mit `useTranslations("admin.universities")`
- → Würde funktionieren. Aber wenn der Namespace falsch ist, bricht alles.

### Hypothese C: Fehlende Umgebungsvariablen (Root Cause für BF-04, BF-15, BF-16)

- `RESEND_API_KEY` nicht gesetzt → Passwort-Reset-Mail schlägt fehl
- Redis-Config falsch → Health-Check schlägt fehl
- Backend-URL in Proxy falsch → alle API-Calls fehlschlagen

---

## Reihenfolge der Fixes (empfohlen)

1. **Zuerst: Proxy debuggen (BF-08 als Testfall)** → Löst wahrscheinlich BF-02/05/06/08/09/10/11/12
2. **Dann: i18n-Keys prüfen (BF-07)** → Löst wahrscheinlich BF-09/11/12 teilweise
3. **Dann: Admin-Link (BF-01)** → Kleinste isolierte Änderung
4. **Dann: Passwort-Reset (BF-04)** → Hängt von Umgebungsvariablen ab
5. **Dann: Prerequisites-Seite (BF-13)** → Entscheidung: bauen oder Link entfernen
6. **Dann: Import-UX (BF-14)** → UI-Verbesserungen + Proxy-Fix sollte es lösen
7. **Dann: Audit-Log (BF-15)** → Analyse ob Logging korrekt geschieht
8. **Dann: System-Erweiterung (BF-16)** → Neues Feature
9. **Abschluss: Vollständige QA (BF-17)**
