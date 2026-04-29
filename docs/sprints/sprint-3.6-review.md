# StudyNexus - Sprint 3.6 (Phase 7) Review & Use Cases

In diesem Sprint haben wir extrem viele "Quality of Life" und "User Experience" Verbesserungen vorgenommen. Das Ziel war es, aus der MVP (Minimum Viable Product) eine professionelle, responsive und moderne Applikation zu formen.

Hier ist eine detaillierte Zusammenfassung aller neuen Use Cases und wie du sie testest.

---

## 📱 Use Case 1: Mobile Drag & Drop
**Wo?** `Kanban Board (/dashboard/kanban)`

**Was ist neu?**
Auf dem iPhone/Android kannst du jetzt Tasks und Abgaben genau wie am Desktop durch langes Drücken verschieben. Vorher ging das nur über Klicks in das Task-Modal. 

**Wie teste ich das?**
1. Öffne StudyNexus auf deinem Handy.
2. Gehe in den Kanban-Bereich.
3. Lege den Finger für einen kurzen Moment auf eine Task-Karte.
4. Ziehe die Karte sanft in eine andere Spalte (z.B. von "To Do" nach "In Progress").
5. Lasse los – die Karte "snappt" ein und wird sofort im Backend gespeichert.

---

## 🎯 Use Case 2: Visual Study Plan (Studienplan Builder)
**Wo?** `Studienplan (/dashboard/study-plan)`

**Was ist neu?**
Du hast einen neuen Tab im Menü (sowohl Mobile als auch Desktop) namens "Studienplan". Dort hast du ein horizontales Kanban-ähnliches Board, das alle Semester repräsentiert (Semester 1, Semester 2, etc. bis "Ungeplant").

**Wie teste ich das?**
1. Klicke in der Seitenleiste auf "Studienplan" (Icon mit der kleinen Karte).
2. Du siehst deine Module aufgereiht in Spalten nach Semester.
3. Jede Spalte summiert oben rechts automatisch die ECTS-Punkte.
4. Nimm ein Modul aus "Ungeplant" (oder einem anderen Semester) und ziehe es in z.B. "Semester 3".
5. Das Modul bleibt dort, das Backend wird geupdatet und die ECTS-Zahl passt sich in Echtzeit an.

---

## 🪪 Use Case 3: Digitaler Studentenausweis (ID Card)
**Wo?** `ID Card (/dashboard/profile)`

**Was ist neu?**
Wir haben das Konzept des "Profils" auf das nächste Level gehoben. Anstatt eines langweiligen Formulars siehst du nun eine hochmoderne, im "Glassmorphismus"-Stil designte ID-Card.

**Wie teste ich das?**
1. Klicke im Menü auf "ID Card".
2. Die Karte wird gerendert: Oben rechts schimmert das Layout, in der Mitte ist dein Profilbild (oder ein moderner Placeholder).
3. Du siehst deinen Namen, deine Matrikelnummer, Geburtsdatum und deine Hochschule.
4. Unten gibt es einen simulierten Barcode basierend auf deiner UUID.
5. Klicke unten auf "Profil in den Einstellungen bearbeiten", um direkt in die Settings zu springen.

---

## ⚙️ Use Case 4: Einstellungsbereich
**Wo?** `Einstellungen (/dashboard/settings)`

**Was ist neu?**
Eine saubere Übersicht über deine App-Einstellungen, aufgeteilt in logische Tabs.

**Wie teste ich das?**
1. Klicke im Menü auf "Einstellungen".
2. Du findest eine zweigeteilte Ansicht (Sidebar und Content).
3. Klicke auf **Persönliche Daten**: Hier kannst du deinen Namen, Hochschule, Geburtsdatum usw. eintragen (Hinweis: Die UI ist bereit, die API-Integration für das Speichern erfolgt mit dem nächsten Community-Update).
4. Klicke auf **Konto & Sicherheit**: Hier siehst du deine E-Mail und kannst das Passwort verwalten.
5. Klicke auf **Erscheinungsbild**: Verwalte hier Sprache und Theme.

---

## ✨ Use Case 5: Globale UI & Ergonomie
**Überall in der App**

- **Dashboard Greeting:** Wenn du dich einloggst, steht auf dem Dashboard nun "Willkommen, [Dein Name] 👋" anstatt eines generischen Textes.
- **Smart Timeline Fix:** Der kleine Punkt links in der Timeline auf dem Dashboard ist nicht mehr halb abgeschnitten, er hat jetzt ausreichend Abstand zum Rand.
- **Global Quick Add:** Der schwebende `+` Button unten rechts existiert jetzt **überall**, auch auf dem großen Desktop-Bildschirm. Ein Klick öffnet das Radial-Menü (Termin, Aufgabe, Abgabe).
- **Logo Size:** Das StudyNexus-Logo in den Menüs wurde vergrößert und ist jetzt viel präsenter.

---

## Git Commit Info
Sobald du das alles getestet hast, kannst du folgende Befehle im Terminal ausführen:

```bash
git add .
git commit -m "feat: implement sprint 3.6 - mobile UX polish, ID card, settings and visual study plan"
```
