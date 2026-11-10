# Tagesplaner für Obsidian

Version **1.2.0** · Synchronisierte Status- und Prioritätenboards mit bearbeitbaren Beschreibungen, Dashboard, Unteraufgaben, Arbeitsverlauf und Archiv.

## Installation über BRAT

1. In Obsidian **BRAT → Add Beta plugin** öffnen.
2. `Janosch3000/Daily-Planner` hinzufügen.
3. Unter **Community-Plugins** den Tagesplaner aktivieren.
4. Über das Dashboard-Symbol in der linken Leiste oder den Befehl **Tagesplaner öffnen** starten.

Für Updates in BRAT nach Plugin-Updates suchen. Danach den Tagesplaner deaktivieren und erneut aktivieren oder Obsidian neu starten. Das Plugin muss vorher nicht deinstalliert werden.

## Aufgaben und Unteraufgaben

- **+ Aufgabe** öffnet einen Obsidian-Dialog für Titel, Fälligkeitsdatum, optionalen Gesamtaufwand in Stunden und Beschreibung.
- **Bearbeiten** ändert diese Angaben später. Über **Beschreibung bearbeiten** direkt auf jeder Karte lässt sich eine Beschreibung außerdem jederzeit ergänzen, ändern oder leeren; mit **Beschreibung speichern** übernehmen. Das funktioniert im Statusboard und in der Prioritätenübersicht identisch.
- Kategorien in dieser Reihenfolge: **ToDo**, **In Progress**, **Waiting**, **Done**.
- Zum Verschieben den Kartentitel ziehen oder die Status-Auswahl verwenden. Die Status-Auswahl funktioniert auch ohne Maus.
- Innerhalb einer Karte neue Unteraufgaben eingeben und mit **+** oder Enter hinzufügen. Häkchen speichern den Fortschritt, **×** entfernt eine Unteraufgabe.
- Der übergeordnete Status wird bewusst manuell gesetzt. Erledigte Unteraufgaben setzen die Hauptaufgabe nicht automatisch auf Done.
- Unten in jeder Karte steht **Was wurde gemacht?**. Einträge mit **Eintrag speichern** ablegen; sie bleiben mit Datum und Uhrzeit im Arbeitsverlauf erhalten.
- Noch nicht gespeicherte Texte für Unteraufgaben und Arbeitsschritte bleiben beim Wechsel zwischen den Ansichten innerhalb derselben geöffneten Planner-Ansicht erhalten. Vor dem Schließen oder Neustart speichern.

## Prioritäten und zweite Übersicht

Unter dem Statusboard steht eine zweite Übersicht mit den vier Prioritäten **low**, **mid**, **high** und **immediately**. Jede Spalte hat einen dezenten Farbton: Grün, Blau, Bernstein beziehungsweise Rosé.

Eine Aufgabe besitzt einen Status und eine Priorität. Beide Übersichten zeigen dieselbe gespeicherte Aufgabe, keine unabhängigen Kopien. Änderungen an Titel, Beschreibung, Fälligkeit, Aufwand, Status, Priorität, Unteraufgaben und Arbeitsverlauf erscheinen in beiden Übersichten.

- Im Erstell-/Bearbeitungsdialog und im Prioritätsfeld auf jeder Karte die Priorität auswählen.
- Alternativ den Kartentitel in eine Prioritätsspalte ziehen. Das ändert nur die Priorität; Status und vorhandener Archivtimer bleiben erhalten.
- Das Ziehen in eine Statusspalte ändert nur den Status; die Priorität bleibt erhalten.
- Die farbigen Tags und die Position in der Prioritätenübersicht stimmen immer mit der gespeicherten Priorität überein.
- Neue Aufgaben und bestehende Aufgaben ohne Priorität beginnen mit **mid**.
- Nicht archivierte Aufgaben erscheinen genau einmal pro Übersicht. Nach der Archivierung verschwinden sie aus beiden Boards; im Archiv bleibt die Priorität sichtbar.
- Textentwürfe für Beschreibungen, Unteraufgaben und Arbeitsschritte werden innerhalb der geöffneten Ansicht zwischen beiden Darstellungen synchronisiert. Erst Speichern legt sie dauerhaft ab. Scrollpositionen bleiben bei Änderungen erhalten.

## Archiv

Aufgaben wechseln **24 Stunden nach dem Setzen auf Done** automatisch ins Archiv. Das Plugin prüft jede Minute, beim Laden und beim Öffnen der Ansicht. War Obsidian geschlossen, wird die Archivierung beim nächsten Start nachgeholt.

Das Archiv ist nach Titel, Beschreibung, Unteraufgaben und Arbeitsverlauf durchsuchbar. Es werden keine Aufgaben durch die automatische Archivierung gelöscht. **Wieder öffnen** verschiebt eine Aufgabe nach ToDo; Unteraufgaben und Arbeitsverlauf bleiben erhalten. Bei erneutem Abschluss beginnen die 24 Stunden von vorn.

## Dashboard

- Offene Aufgaben, Aufgaben in Bearbeitung, heutige Fälligkeiten und überfällige Aufgaben.
- Erledigte Aufgaben in den letzten 7 beziehungsweise 30 Kalendertagen, einschließlich heute und einschließlich Archiv.
- Aufgaben in Waiting sowie erledigte Unteraufgaben im Verhältnis zur Gesamtzahl.
- Verteilung auf die Kategorien und Abschlussdiagramm der letzten 7 Tage.
- Bevorstehende Fälligkeiten, zuletzt abgeschlossene Aufgaben und letzte dokumentierte Arbeitsschritte.
- Geschätzte Auslastung anhand der Wochenkapazität (anfänglich 40 Stunden; im Dashboard einstellbar).

Für den geplanten Aufwand bis Sonntag zählen alle offenen Aufgaben mit Fälligkeit bis Sonntag einschließlich überfälliger Aufgaben sowie undatierte Aufgaben in Bearbeitung. Für jede Aufgabe wird der optionale Gesamtaufwand anteilig um erledigte Unteraufgaben reduziert; ohne Unteraufgaben gilt der ganze Aufwand als offen. Unteraufgaben werden dabei gleich gewichtet. Aufgaben ohne Aufwandsschätzung tragen keine Stunden zur Auslastung bei; ihre Anzahl wird angezeigt. Das ist eine Planungsschätzung, keine Zeiterfassung und keine Messung tatsächlich geleisteter Stunden.

Erneut geöffnete Aufgaben zählen bis zu ihrem nächsten Abschluss nicht als erledigt. Die Statistik verwendet den letzten Abschluss der aktuell fertigen Aufgaben und zählt dieselbe Aufgabe nicht mehrfach.

## Bestehende Daten

Vorhandene Daten aus 1.0.0, 1.1.0 und 1.1.1 werden automatisch übernommen. Fehlende Prioritäten werden auf mid gesetzt. Die bisherigen Kategorien werden zugeordnet: Offen → ToDo, In Bearbeitung → In Progress, Warten auf Person und Delayed → Waiting, Fertig → Done. Vorhandene Abschlussdaten und Archivtimer bleiben dabei erhalten. Titel, Status, Fälligkeitsdatum und Beschreibung bleiben erhalten. Neue Felder werden ergänzt.

Alte Aufgaben im Status Done besitzen noch kein gespeichertes Abschlussdatum. Für sie beginnt der Archivtimer beim ersten Laden von Version 1.2.0. Sie werden als vor dem Update erledigt gekennzeichnet und nicht rückwirkend in 7-/30-Tage-Statistiken eingerechnet.

Alle Daten liegen lokal in `<Vault>/.obsidian/plugins/tagesplaner/data.json`; das Archiv ist Teil dieser Datei. Persönliche Aufgaben gehören nicht ins öffentliche GitHub-Repository. Vor einem späteren Downgrade auf eine ältere Plugin-Version die Datei sichern: Ältere Versionen kennen die neuen Kategorien beziehungsweise das neue Datenformat nicht.

## Release 1.2.0 erstellen

Repository: https://github.com/Janosch3000/Daily-Planner

1. Ein neues Release mit neuem Tag **1.2.0**, Ziel **main**, Titel **Tagesplaner 1.2.0** erstellen.
2. Die aktuellen Dateien **main.js**, **manifest.json** und **styles.css** aus dieser Version als drei einzelne Assets anhängen.
3. Die Notizen aus `CHANGELOG.md` verwenden und das Release veröffentlichen. Nicht als Pre-release markieren, wenn BRAT es regulär als neueste Version beziehen soll.

Die Dateien liegen direkt im Repository-Stammverzeichnis. `versions.json` dokumentiert die erforderliche Obsidian-Version und bleibt ebenfalls im Stammverzeichnis. Für die Installation über BRAT reicht das automatisch erzeugte Source-code-ZIP allein nicht; die drei einzelnen Release-Assets müssen vorhanden sein.

Die Plugin-ID `tagesplaner` bleibt unverändert, damit BRAT vorhandene Installationen aktualisiert.

## Grenzen dieser Version

Die Full-Calendar-Anbindung, die tägliche Übertragung unerledigter Aufgaben und eine Zeiterfassung sind nicht Bestandteil von 1.2.0. Das Archiv arbeitet mit abgeschlossenen Aufgaben und läuft, während das Plugin in Obsidian geladen ist.
