# Sprint 3.7 / Rework-Plan: Dashboard, Mobile UX & System-Logik



## 🛠️ Phase 1: Fundament & Registrierung (Datenintegrität)
Das Problem aktuell: Das Profil/Settings-Menü hat leere Platzhalter, weil die Daten bei der Registrierung nie abgefragt wurden.
*   **Registrierung anpassen:** Die Felder `Matrikelnummer`, `Geburtsdatum` und `Hochschule` werden im Backend (`UserCreate`) und im Frontend (`RegisterForm`) zu **Pflichtfeldern** gemacht.
*   **Server-Fetch Fix (Login-Redirect & Greeting Bug):** Der Bug, dass beim Klick auf die ID-Card das Login-Fenster kommt und die Begrüßung ("Willkommen [Name]") fehlt, liegt an einem serverseitigen Fetch-Problem mit dem Auth-Cookie. Das wird repariert, sodass die echten Daten verlässlich ins Frontend geladen werden.
*   **Header Navigation:** Oben rechts im Dashboard wird ein Profilbild/Avatar und ein Einstellungs-Zahnrad hinzugefügt.

## ⚙️ Phase 2: Settings & ID-Card (Echte Daten & Funktionen)
*   **ID-Card:** Sobald Phase 1 läuft, rendert die ID-Card automatisch deine *echten* Daten in einem hochmodernen Design (wird nochmal poliert).
*   **Settings - Persönliche Daten:** Die Felder (Name, Matrikelnummer, Hochschule, Geburtsdatum) werden mit den echten Daten aus der Datenbank gefüllt und auf `disabled` (nur lesen) gesetzt, da sie bei der Registrierung festgelegt wurden.
*   **Settings - Konto & Sicherheit:** 
    *   Die echte E-Mail-Adresse wird angezeigt.
    *   Implementierung einer **echten Passwort-Ändern Logik**: Man muss das `Alte Passwort` eingeben, um ein `Neues Passwort` zu setzen. Dazu baue ich einen neuen sicheren Backend-Endpunkt.
*   **Settings - Erscheinungsbild:** Der Sprachwechsel (Deutsch <-> Englisch) wird funktional gemacht (über Next.js Routing/Cookies).

## 📱 Phase 3: Mobile Kanban Rework
Der HTML5 Drag-and-Drop Polyfill auf dem Handy ist unbrauchbar. Wir verwerfen das.
*   **Die Lösung für Mobile:** Wir bauen für das Smartphone eine ergonomische "Tap-to-Move" Logik (oder integrieren professionelles `@dnd-kit` mit Touch-Sensoren).
*   **Darstellung:** Wenn das aktuelle mobile Kanban-Layout unübersichtlich ist, optimieren wir die Karten-Darstellung, sodass man auf kleinen Bildschirmen sofort den Status sieht und Karten elegant per Knopfdruck oder sauberem Wisch in die nächste Spalte verschieben kann.

## 🪣 Phase 4: Studienplan Builder (Das Bucket-System)
Deine Vision ist ein strategisches Makro-Management. Der aktuelle Entwurf war zu starr.
*   **Dynamische Semester-Container:** Du bist nicht auf 6 Semester beschränkt. Wir bauen einen Button `+ Neues Semester hinzufügen`, um z.B. Semester 7 oder 8 (die "Buckets") dynamisch zu erstellen.
*   **Flexibles Verteilen:** Alle Module starten im "Ungeplant" Bucket. Du ziehst sie in deine eigenen Semester-Buckets. Das System merkt sich deine individuelle Struktur. Das gibt dir die visuelle Freiheit für dein individuelles Lerntempo.

## ➕ Phase 5: Kontext-Sensitiver Quick Add Button
*   Der `+` Button unten rechts wird intelligent gemacht.
*   Er wird **nur noch** auf Seiten angezeigt, wo er Sinn ergibt (z.B. `/dashboard`, `/dashboard/kanban`, `/dashboard/schedule`).
*   In der ID-Card oder den Einstellungen wird er unsichtbar, um die UI nicht zu überladen.

---

