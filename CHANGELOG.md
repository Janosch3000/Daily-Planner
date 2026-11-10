# Änderungen

## 1.2.1

- Aufgaben in Done werden sofort aus allen Prioritätsspalten ausgeblendet.
- Beim Wechsel von Done nach ToDo, In Progress oder Waiting erscheinen sie automatisch wieder in ihrer bisherigen Prioritätsspalte.
- Priorität, Beschreibung, Unteraufgaben und Arbeitsverlauf bleiben erhalten. Die Archivierung nach 24 Stunden läuft weiter.

Release-Assets: `main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.2.1**, Zielbranch: **main**.

## 1.2.0

- Beschreibungen direkt auf den Aufgabenkarten nachträglich ergänzen, ändern und leeren; auch über den Bearbeitungsdialog.
- Prioritätstags: **low**, **mid**, **high**, **immediately**. Bestehende Aufgaben ohne Priorität erhalten mid.
- Zweites, dezent farbiges Prioritätenboard direkt unter den Statuskategorien.
- Beide Boards bearbeiten dieselben Aufgaben und bieten dieselben Funktionen einschließlich Unteraufgaben und Arbeitsverlauf.
- Auswahlfeld, farbiger Tag und Prioritätsspalte bleiben synchron. Verschieben im Prioritätenboard ändert nur die Priorität, Verschieben im Statusboard nur den Status.
- Textentwürfe sind zwischen beiden Darstellungen synchronisiert. Mehrfaches schnelles Speichern desselben Arbeitsschritts oder derselben Unteraufgabe wird innerhalb der Ansicht abgefangen.
- Scrollpositionen bleiben beim Speichern, Verschieben und Wechseln zwischen den Ansichten erhalten.
- Archivierung und Dashboard rechnen mit eindeutigen Aufgaben, unabhängig von ihrer Darstellung in zwei Boards.

Release-Assets: `main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.2.0**, Zielbranch: **main**.

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
