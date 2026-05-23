# API Spezifikationen

Diese Dateien dokumentieren das Verhalten und die Schnittstellen unserer FastAPI-Routen (`/api/v1/...`).

## 📚 Endpunkt-Katalog

* **[auth.md](auth.md)**: Login, Registrierung, JWT-Handling und E-Mail-Verifizierung.
* **[me.md](me.md)**: Profil-Verwaltung des aktuell eingeloggten Nutzers (`/api/v1/me`).
* **[study-plan.md](study-plan.md)**: Verwaltung von Hochschulen, Studiengängen, POs und Modulen (`/api/v1/...`).
* **[mission.md](mission.md)**: Tasks und Events für das Mission Control Dashboard (`/api/v1/mission`).
* **[stats.md](stats.md)**: Abruf von ECTS, GPA und PO-Meilensteinen (`/api/v1/me/stats`).
* **[health.md](health.md)**: System-Status Endpunkte (`/api/v1/health`).
* **[admin.md](admin.md)**: Alle geschützten Routen für das Admin-Panel (`/api/v1/admin/...`).

> **Wichtig:** Achte darauf, dass diese Markdown-Dateien aktualisiert werden, sobald sich Request/Response-Schemas in FastAPI ändern.
