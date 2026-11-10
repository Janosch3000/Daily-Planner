# Änderungen

## 1.1.1

- Die Kategorien heißen jetzt **ToDo**, **In Progress**, **Waiting** und **Done**, in dieser Reihenfolge.
- Bestehende Aufgaben werden automatisch zugeordnet: Offen → ToDo, In Bearbeitung → In Progress, Warten auf Person / Delayed → Waiting und Fertig → Done.
- Arbeitsverlauf, Unteraufgaben, Abschlussdaten und vorhandene Archivtimer bleiben erhalten.
- Dashboard, Drag-and-drop, Status-Auswahl und Archivierung verwenden die vier neuen Kategorien.

Release-Assets: `main.js`, `manifest.json` und `styles.css`. Neuer Tag: **1.1.1**, Zielbranch: **main**.

## 1.1.0

- Fertige Aufgaben werden nach 24 Stunden automatisch archiviert; geschlossene Obsidian-Zeiten werden beim nächsten Start berücksichtigt.
- Durchsuchbares Archiv mit Wiederherstellen nach Offen. Unteraufgaben und Arbeitsverlauf bleiben erhalten.
- Unteraufgaben mit Checkboxen, Fortschrittsanzeige und Entfernen direkt in jeder Aufgabenkarte.
- Arbeitsverlauf unter „Was wurde gemacht?“ mit mehreren Einträgen, Datum und Uhrzeit.
- Aufgaben nachträglich bearbeiten und optionalen Gesamtaufwand in Stunden erfassen.
- Dezente, unterschiedliche Farben für die fünf Kategorien, passend zu hellen und dunklen Obsidian-Themes.
- Dashboard mit offenen und überfälligen Aufgaben, heutigen Fälligkeiten, Abschlüssen der letzten 7/30 Tage, Wochenkapazität, geschätzter Auslastung, Statusverteilung, Abschlussdiagramm, anstehenden Aufgaben und Arbeitsverlauf.
- Bestehende Aufgaben aus 1.0.0 werden automatisch übernommen. Bei alten fertigen Aufgaben ohne Abschlussdatum startet der Archivtimer beim Update.
- Schreibvorgänge werden nacheinander verarbeitet; bei Speicherfehlern wird die Änderung zurückgenommen und kann erneut versucht werden.

### Release-Assets

`main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.1.0**, Zielbranch: **main**.

Full-Calendar-Anbindung und tägliche Übertragung unerledigter Aufgaben sind noch nicht enthalten.
