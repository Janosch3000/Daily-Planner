# Tagesplaner für Obsidian

Visuelles Kanban-Plugin für Aufgaben im Vault.

## Funktionen
- Aufgaben anlegen mit optionalem Fälligkeitsdatum
- Status: Offen, In Bearbeitung, Warten auf Person, Delayed, Fertig
- Karten per Drag-and-drop oder Status-Auswahl verschieben
- Aufgaben lokal in den Plugin-Daten speichern

## Installation mit BRAT
1. Repository: https://github.com/Janosch3000/Daily-Planner. Die Dateien `manifest.json`, `main.js` und `styles.css` liegen im Stammverzeichnis.
2. In Obsidian **Einstellungen → BRAT → Add Beta plugin** wählen und Repository `Janosch3000/Daily-Planner` eintragen.
3. Danach in **Community-Plugins → Installierte Plugins** Tagesplaner aktivieren.

## Lokal testen
Kopiere den Ordner in `<Vault>/.obsidian/plugins/tagesplaner/`, aktiviere das Plugin unter Community-Plugins und lade Obsidian neu.

## Entwicklung
Die ausgelieferten Dateien sind `main.js`, `styles.css` und `manifest.json`. Für Plugin-Code-Änderungen `version` in `manifest.json` erhöhen.

Noch nicht enthalten: Full-Calendar-Integration und automatisches Verschieben unerledigter Aufgaben.