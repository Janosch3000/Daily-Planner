# Änderungen

## 1.5.2

- Der Aufgabenrahmen wird beim Darüberfahren mit der Maus reinweiß (#ffffff), mit einem dezenten weißen Schein.
- Der normale Rahmen behält die jeweilige Status- oder Prioritätsfarbe.

Release-Assets: `main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.5.2**, Zielbranch: **main**.

## 1.5.1

- Aufgaben haben bereits im normalen Zustand einen dezenten Rahmen in der jeweiligen Status- oder Prioritätsfarbe.
- Bei Hover und Tastaturfokus wird die Umrandung heller und durch einen leichten Farbschein hervorgehoben.
- Archivierte Aufgaben verwenden die Done-Farbe.

Release-Assets: `main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.5.1**, Zielbranch: **main**.

## 1.5.0

- Neue Aufgaben aus einer Vorlage öffnen sich sofort im Bearbeitungsdialog. Anpassungen werden auf genau dieser Aufgabe gespeichert.
- Gesamtaufwand und Stundenanzeigen aus Aufgaben, Vorlagen und Karten entfernt.
- Wochenkapazität und stundenbasierte Auslastung aus dem Dashboard entfernt; stattdessen Prioritätenverteilung der offenen Aufgaben.
- Neues Layout mit ruhigeren Flächen, übersichtlicheren Karten und stärker hervorgehobenen Symbolen.
- Statussymbole: leeres Kästchen für ToDo, Baustellenabsperrung für In Progress, Uhr für Waiting und Kästchen mit Haken für Done.
- Prioritätssymbole: low ↓, mid →, high ↑, immediately ⇈. Die Symbolfarben sind kräftiger als die Hintergrundfarben.
- Bestehende Aufgaben, Vorlagen, Unteraufgaben und Arbeitsverläufe bleiben verfügbar. Die Done-/Prioritäten-Regel bleibt erhalten.

Release-Assets: `main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.5.0**, Zielbranch: **main**.

## 1.4.1

- Unteraufgaben lassen sich direkt in der Vorlage vordefinieren; eine erste Eingabezeile steht sofort bereit.
- Enter ergänzt die nächste Unteraufgabe und sendet das Formular nicht versehentlich ab.
- Vorhandene Eingabefelder werden beim Hinzufügen und Entfernen anderer Zeilen beibehalten; Fokus und Texte bleiben stabil.
- Noch ausstehende Eingabewerte werden vor Listenänderungen und beim Speichern übernommen.
- Vorgegebene Unteraufgaben bleiben beim Speichern und erneuten Öffnen erhalten und werden vollständig in neue Aufgaben kopiert.
- Leere Zeilen werden beim Speichern ausgelassen. Speicherfehler lassen sämtliche Eingaben für einen erneuten Versuch stehen.

Release-Assets: `main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.4.1**, Zielbranch: **main**.

## 1.4.0

- **+ Vorlage** steht zentral neben **+ Aufgabe** und öffnet einen taskähnlichen Vorlageneditor mit **Vorlage speichern**.
- Der Vorlagenknopf wurde von den einzelnen Aufgabenkarten entfernt.
- Unten im Aufgabendialog steht neben **Aufgabe erstellen** der Knopf **Aufgabe nach Vorlage erstellen**. Die anschließende Auswahl erstellt die Aufgabe direkt aus der angeklickten Vorlage.
- Vorlagen bleiben in der **Vorlagenverwaltung** benennbar, bearbeitbar und löschbar.
- **Status** und **Prioritäten** sind getrennte Unterreiter unter der gemeinsamen Gruppe **Aufgaben**. Beide verwenden dieselben Aufgaben und bewahren ihre Scrollposition und Textentwürfe.
- Bestehende Aufgaben und Vorlagen bleiben erhalten. Done-Aufgaben bleiben aus den Prioritäten ausgeblendet und erscheinen beim Wiederöffnen dort erneut.

Release-Assets: `main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.4.0**, Zielbranch: **main**.

## 1.3.0

- Neuer Vorlagenbereich: Aufgabenvorlagen erstellen, bearbeiten und nach Bestätigung löschen.
- Vorlagen enthalten Titel, Beschreibung, Priorität, Startstatus, Aufwand, Unteraufgaben und eine optionale relative Fälligkeit.
- Neue Aufgaben über die Vorlagenauswahl im Erstelldialog oder direkt aus dem Vorlagenbereich anlegen.
- Alle übernommenen Angaben bleiben vor und nach der Erstellung anpassbar. Aufgaben und Vorlagen sind unabhängige Kopien.
- Vorhandene Aufgaben über **Als Vorlage** übernehmen; erledigte Häkchen und Arbeitsverlauf werden nicht kopiert.
- Unteraufgaben lassen sich nun auch im Erstell- und Bearbeitungsdialog hinzufügen, umbenennen, abhaken und entfernen.
- Vorlagenänderungen und das Löschen einer Vorlage lassen bestehende Aufgaben unverändert.
- Bestehende Aufgaben und die Done-/Prioritäten-Regel aus 1.2.1 bleiben erhalten.

Release-Assets: `main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.3.0**, Zielbranch: **main**.

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
