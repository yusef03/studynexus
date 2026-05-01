# Nichtfunktionale Anforderungen (NFAs) – StudyNexus

## Übersicht

Nichtfunktionale Anforderungen beschreiben WIE das System arbeitet,
nicht WAS es tut. Alle NFAs sind messbar und testbar definiert.

---

## NFA-01: Datenschutz (Privacy)

**Kategorie:** Rechtlich / Compliance
**Priorität:** Kritisch

**Anforderung:**
Das System muss vollständig DSGVO-konform betrieben werden.

**Messbare Kriterien:**
- Noten und ECTS-Daten sind ausschließlich für den jeweiligen Nutzer sichtbar
- Modul-Evaluationen sind hochschulöffentlich, aber vollständig anonymisiert
- Nutzer kann jederzeit alle eigenen Daten exportieren (Recht auf Datenportabilität)
- Nutzer kann Account und alle Daten vollständig löschen (Recht auf Vergessenwerden)
- Datenschutzerklärung ist vor Registrierung einsehbar und muss aktiv akzeptiert werden

**Test:** Penetrationstest zeigt, dass Nutzer A niemals auf Noten von Nutzer B zugreifen kann

---

## NFA-02: Sicherheit (Security)

**Kategorie:** Informationssicherheit
**Priorität:** Kritisch

**Anforderung:**
Alle sensiblen Daten müssen verschlüsselt gespeichert und übertragen werden.

**Messbare Kriterien:**
- Datenverschlüsselung at rest: AES-256
- Datenverschlüsselung in transit: TLS 1.3 (kein TLS 1.2 oder älter)
- Passwörter werden ausschließlich als bcrypt-Hash (cost factor >= 12) gespeichert
- JWT-Tokens laufen nach 7 Tagen ab (Development); in Produktion kürzer konfigurierbar via `ACCESS_TOKEN_EXPIRE_MINUTES`
- Rate Limiting: maximal 10 Login-Versuche pro Minute pro IP
- Alle API-Endpunkte erfordern Authentifizierung (außer Login/Register/Verify)

**Test:** OWASP Top 10 Security Audit zeigt keine kritischen Schwachstellen

---

## NFA-03: Portierbarkeit (Portability)

**Kategorie:** Technisch
**Priorität:** Hoch

**Anforderung:**
Das System muss als Mobile-First Progressive Web App auf allen Endgeräten laufen.

**Messbare Kriterien:**
- Google Lighthouse PWA Score >= 90 auf Mobile
- Google Lighthouse Performance Score >= 80 auf Mobile
- Vollständig nutzbar auf: Chrome, Firefox, Safari, Edge (aktuelle Version)
- Responsive Design: getestet auf 375px (iPhone SE) bis 2560px (Desktop)
- App ist installierbar als PWA auf iOS und Android

**Test:** Lighthouse-Audit in Chrome DevTools auf echtem Mobilgerät

---

## NFA-04: Zuverlässigkeit (Reliability)

**Kategorie:** Betrieb
**Priorität:** Hoch

**Anforderung:**
Das System muss offlinefähig sein und eine hohe Verfügbarkeit bieten.

**Messbare Kriterien:**
- Read-Only offline in V1. Offline writes (grades, kanban) require conflict resolution and are deferred to V2.
- System-Verfügbarkeit: >= 99.5% Uptime pro Monat (max. 3.6h Ausfall/Monat)
- Fehlermeldungen sind immer verständlich auf Deutsch und Englisch

**Test:** Offline-Modus in Chrome DevTools aktivieren – Kernfunktionen müssen weiter funktionieren

---

## NFA-08: CSRF Protection

**Kategorie:** Sicherheit
**Priorität:** Hoch
**Status:** ✅ Implementiert (Sprint 3B)

**Anforderung:**
Das System muss vor Cross-Site Request Forgery geschützt sein.

**Implementierung:**
- Next.js Middleware validiert `x-studynexus-client: true` Custom Header auf allen mutierenden Requests (POST, PUT, DELETE, PATCH)
- Origin/Host Header-Prüfung gegen CSRF-Angriffe von fremden Domains
- httpOnly Cookies verhindern JavaScript-Zugriff auf den JWT-Token

---

## NFA-05: Performance (Effizienz)

**Kategorie:** Technisch
**Priorität:** Mittel

**Anforderung:**
Das System muss auch bei vielen gleichzeitigen Nutzern schnell reagieren.

**Messbare Kriterien:**
- Erste sichtbare Seite lädt in unter 2 Sekunden (LCP <= 2.5s)
- API-Antwortzeiten unter 500ms für 95% aller Anfragen
- Skill-Tree mit bis zu 50 Modulen rendert in unter 1 Sekunde
- Datenbankabfragen unter 100ms (mit korrekten Indizes)

**Test:** Lasttest mit 500 gleichzeitigen Nutzern via k6 oder Locust

---

## NFA-06: Wartbarkeit (Maintainability)

**Kategorie:** Entwicklung
**Priorität:** Mittel

**Anforderung:**
Der Code muss verständlich, testbar und erweiterbar sein.

**Messbare Kriterien:**
- Testabdeckung (Code Coverage) >= 80% für Backend
- Alle API-Endpunkte sind in docs/api/ dokumentiert
- Keine Funktion länger als 50 Zeilen (Single Responsibility)
- Jede Architekturentscheidung ist in docs/architecture/ dokumentiert (ADR-Format)
- CLAUDE.md wird nach jeder Session aktualisiert

**Test:** pytest --cov zeigt >= 80% Coverage

---

## NFA-07: Internationalisierung (i18n)

**Kategorie:** Usability
**Priorität:** Mittel
**Status:** ✅ Vollständig implementiert (Sprint 3.7)

**Anforderung:**
Das System muss von Beginn an mehrsprachig sein.

**Messbare Kriterien:**
- Vollständige Unterstützung für Deutsch und Englisch
- Sprachumschaltung ohne Seitenreload möglich
- Alle Fehlermeldungen, Labels und UI-Texte übersetzt
- Datumsformate passen sich der Sprache an (DE: 18.04.2026 / EN: Apr 18, 2026)

**Implementierung:**
- `next-intl` mit `messages/de.json` und `messages/en.json`
- `useTranslations()` Hook in allen Komponenten
- `useLocale()` + `date-fns` Locale für dynamische Datumsformatierung
- Sprachwechsel via Next.js Locale-Routing (URL-Prefix `/de/` bzw. `/en/`)

**Test:** Alle UI-Texte in beiden Sprachen vorhanden, kein hardcodierter deutscher/englischer Text im Code ✅
