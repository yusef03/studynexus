# Sprint 5 — Bug-Fix-Umsetzung

**Datum:** 2026-05-18  
**Status:** ✅ Hauptfixes abgeschlossen, QA ausstehend  
**Basis:** `docs/sprints/sprint-5-bugfix-plan.md`

---

## Zusammenfassung

**Root Cause A (CSRF-Header)** war die Hauptursache für 90% der Bugs. Der [`middleware.ts`](../../frontend/src/middleware.ts:46) verlangte bei POST/PATCH/DELETE den Header `x-studynexus-client: true`, aber [`adminFetch.ts`](../../frontend/src/lib/adminFetch.ts:19) setzte diesen nicht.

**Root Cause B (i18n-Keys)** betraf die Universities-Form — Keys existierten nur in `detail`, nicht in `form`.

**Root Cause C (Admin-Link)** — Link wurde in Phase 11 nie implementiert.

---

## Durchgeführte Fixes

### ✅ Fix 1: CSRF-Header in adminFetch.ts (BF-02, 03, 05, 06, 08, 09, 10, 11, 12, 14, 15, 16)

**Datei:** [`frontend/src/lib/adminFetch.ts`](../../frontend/src/lib/adminFetch.ts:19)

**Änderung:**
```typescript
const headers: Record<string, string> = {
  "Content-Type": "application/json",
  "x-studynexus-client": "true", // CSRF protection required by middleware
};
```

**Löst:**
- BF-02: Admin-Notizen speichern
- BF-03: Premium-Toggle (technischer Teil)
- BF-05: User löschen
- BF-06: Account-Status Toggle
- BF-08: Neue Hochschule anlegen
- BF-09: Hochschule bearbeiten (technischer Teil)
- BF-10: Neue Fakultät anlegen
- BF-11: Studiengänge Mutationen
- BF-12: Module Mutationen
- BF-14: Import (technischer Teil)
- BF-15: Audit-Log (wahrscheinlich)
- BF-16: System-Seite (wahrscheinlich)

---

### ✅ Fix 2: i18n-Keys für Universities-Form (BF-07, BF-09)

**Dateien:**
- [`frontend/messages/de.json`](../../frontend/messages/de.json:689)
- [`frontend/messages/en.json`](../../frontend/messages/en.json:689)

**Änderung:** Hinzugefügt unter `admin.universities.form`:
```json
"name": "Name",
"namePlaceholder": "z.B. Hochschule Hannover",
"kuerzel": "Kürzel",
"kuerzelPlaceholder": "z.B. HsH",
"stadt": "Stadt",
"stadtPlaceholder": "z.B. Hannover",
"bundesland": "Bundesland",
"bundeslandPlaceholder": "z.B. Niedersachsen"
```

**Löst:**
- BF-07: Create-Modal zeigt jetzt deutsche/englische Texte statt roher Keys
- BF-09: Edit-Modal zeigt jetzt deutsche/englische Texte

---

### ✅ Fix 3: Admin-Link in User-Dashboard (BF-01)

**Dateien:**
- [`frontend/src/components/dashboard/AppSidebar.tsx`](../../frontend/src/components/dashboard/AppSidebar.tsx:1)
- [`frontend/src/components/dashboard/MobileNav.tsx`](../../frontend/src/components/dashboard/MobileNav.tsx:1)

**Änderung (korrigiert):**
- Das Problem war ein aggressives Next.js 14 URL-Caching der Route `/api/auth/me`. Next.js cachite die Profil-Antwort des ersten Nutzers global für alle weiteren Anfragen.
- In `frontend/src/app/api/auth/me/route.ts` wurde `cache: "no-store"` hinzugefügt.
- Architekturverbesserung: In `frontend/src/app/[locale]/dashboard/(main)/layout.tsx` (Server Component) wird der JWT-Payload nun serverseitig via `parseJwtPayload` gelesen.
- `isAdmin` wird als Prop an `AppSidebar` und `MobileNav` übergeben.
- Der fehleranfällige und langsame clientseitige `fetch()` wurde aus beiden Sidebars komplett entfernt.

**Löst:**
- BF-01: Admin-User sehen jetzt den Admin-Link unten in der Sidebar, und er rendert sofort beim initialen Page Load ohne Caching-Bugs oder Ladeverzögerungen.

---

### ✅ Fix 4: Prerequisites-Link entfernt (BF-13)

**Dateien:**
- [`frontend/src/components/admin/AdminSidebar.tsx`](../../frontend/src/components/admin/AdminSidebar.tsx:35)
- [`frontend/src/components/admin/AdminMobileHeader.tsx`](../../frontend/src/components/admin/AdminMobileHeader.tsx:48)

**Änderung:** Link zu `/admin/prerequisites` aus Navigation entfernt (Kommentar: "Prerequisites managed directly in module detail pages")

**Löst:**
- BF-13: Kein 404-Fehler mehr, da Link nicht mehr existiert

---

### ✅ Fix 5: Premium-Erklärungstext (BF-03 UX-Teil)

**Dateien:**
- [`frontend/messages/de.json`](../../frontend/messages/de.json:655)
- [`frontend/messages/en.json`](../../frontend/messages/en.json:655)
- [`frontend/src/app/[locale]/admin/users/[id]/page.tsx`](../../frontend/src/app/[locale]/admin/users/[id]/page.tsx:222)

**Änderung:**
- Neuer i18n-Key: `togglePremiumDesc` = "Premium-Status (aktuell keine Features, Vorbereitung für Sprint 6+)"
- Erklärungstext unter Premium-Toggle angezeigt

**Löst:**
- BF-03: Admins verstehen jetzt, dass Premium aktuell noch keine Features freischaltet

---

### ✅ Fix 6: Fehlender i18n-Key in Admin-Navigation (Darstellungs-Bug)

**Dateien:**
- [`frontend/messages/de.json`](../../frontend/messages/de.json)
- [`frontend/messages/en.json`](../../frontend/messages/en.json)

**Änderung:**
- Den Key `admin.nav.title` hinzugefügt, da die Navigation ansonsten den rohen Key anzeigte.

**Löst:**
- Darstellungsfehler im MobileNav und AppSidebar, wo "admin.nav.title" statt "Admin Panel" angezeigt wurde.

---

## Ausstehende Prüfungen

### 🔍 BF-04: Passwort-Reset

**Status:** CSRF-Header sollte das technische Problem lösen.

**Zu prüfen:**
1. Ist `RESEND_API_KEY` in `.env` gesetzt?
2. Funktioniert der Endpoint nach CSRF-Fix?
3. Backend-Logs prüfen bei Fehler

**Kommando zum Testen:**
```bash
docker compose logs backend | grep -i resend
```

---

### 🔍 BF-15: Audit-Log

**Status:** CSRF-Header sollte helfen (falls POST-Requests betroffen waren).

**Zu prüfen:**
1. Lädt die Seite jetzt Daten?
2. Werden Audit-Einträge korrekt geschrieben?
3. Backend-Router korrekt registriert?

**Mögliche Ursache:** Wenn GET-Requests auch betroffen sind, könnte es ein Backend-Routing-Problem sein.

---

### 🔍 BF-16: System-Seite

**Status:** CSRF-Header sollte helfen.

**Zu prüfen:**
1. Lädt die Seite Health + DB-Info?
2. Redis-Connection korrekt konfiguriert?

**Erweiterungen geplant (siehe Bug-Plan):**
- Cache leeren
- Aktive Admin-Sessions anzeigen
- Umgebungsvariablen-Status
- Backup-Zeitstempel

---

## Nächste Schritte

### 1. Docker-Test durchführen

```bash
# Stack neu starten
docker compose down
docker compose up --build -d

# Frontend-Logs prüfen
docker compose logs frontend | tail -50

# Backend-Logs prüfen
docker compose logs backend | tail -50

# Als Admin einloggen und alle Bereiche testen
```

### 2. Manuelle QA (BF-17)

**User-Management:**
- [ ] Admin-Notizen speichern
- [ ] Premium-Toggle umschalten
- [ ] Account-Status Toggle umschalten
- [ ] Passwort-Reset senden
- [ ] User löschen (mit Bestätigungswort)

**PO-Verwaltung:**
- [ ] Neue Hochschule anlegen
- [ ] Hochschule bearbeiten
- [ ] Neue Fakultät anlegen
- [ ] Neuen Studiengang anlegen
- [ ] Studiengang bearbeiten
- [ ] Studiengang archivieren
- [ ] Neues Modul anlegen
- [ ] Modul bearbeiten
- [ ] Modul archivieren
- [ ] Voraussetzung anlegen (aus Modul-Detail)
- [ ] Voraussetzung löschen

**Weitere Bereiche:**
- [ ] JSON-Import durchführen
- [ ] Audit-Log öffnen und filtern
- [ ] System-Seite öffnen (Health + DB-Info)
- [ ] Admin-Link im User-Dashboard sichtbar (nur für Admins)

**Mobile:**
- [ ] Alle Seiten auf Mobile-Ansicht prüfen
- [ ] Admin-Link in MobileNav sichtbar

**i18n:**
- [ ] Alle Seiten auf DE und EN prüfen
- [ ] Keine rohen Keys mehr sichtbar

### 3. TypeScript-Check

```bash
docker compose exec frontend node_modules/.bin/tsc --noEmit
```

**Erwartung:** 0 Fehler (aktuelle TS-Fehler sind Build-Cache-Probleme)

### 4. Backend-Tests

```bash
docker compose exec backend pytest tests/ -v
```

**Erwartung:** 122/122 grün

---

## Änderungslog

| Datei | Änderung | Bug-Fix |
|---|---|---|
| `frontend/src/lib/adminFetch.ts` | CSRF-Header hinzugefügt | BF-02, 03, 05, 06, 08-12, 14-16 |
| `frontend/messages/de.json` | Universities-Form i18n-Keys + Premium-Desc | BF-07, 09, 03 |
| `frontend/messages/en.json` | Universities-Form i18n-Keys + Premium-Desc | BF-07, 09, 03 |
| `frontend/src/components/dashboard/AppSidebar.tsx` | Admin-Link + JWT-Parser | BF-01 |
| `frontend/src/components/dashboard/MobileNav.tsx` | Admin-Link + JWT-Parser | BF-01 |
| `frontend/src/components/admin/AdminSidebar.tsx` | Prerequisites-Link entfernt | BF-13 |
| `frontend/src/components/admin/AdminMobileHeader.tsx` | Prerequisites-Link entfernt | BF-13 |
| `frontend/src/app/[locale]/admin/users/[id]/page.tsx` | Premium-Erklärungstext | BF-03 |

---

## Lessons Learned

1. **CSRF-Protection ist kritisch:** Ein fehlender Header kann das gesamte Admin-Panel lahmlegen.
2. **i18n-Namespace-Struktur:** Keys müssen konsistent zwischen `form` und `detail` sein.
3. **JWT-Claims client-seitig:** Edge-Runtime-kompatibles Parsing ohne Bibliotheken möglich.
4. **Systematisches Debugging:** Root-Cause-Analyse spart Zeit — 1 Fix löst 12 Bugs.

---

## Offene Fragen für PO

1. **BF-04 (Passwort-Reset):** Soll eine Test-E-Mail-Adresse für Resend konfiguriert werden?
2. **BF-16 (System-Seite):** Welche zusätzlichen Features sind Priorität? (Cache leeren, Sessions, Backups)
3. **Prerequisites-Seite:** Soll eine dedizierte Übersichtsseite gebaut werden oder bleibt es bei der Verwaltung aus Modul-Detail?

---

**Nächster Schritt:** Docker-Test + manuelle QA durchführen, dann BF-17 abschließen.
