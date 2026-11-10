# Tagesplaner für Obsidian

Version **1.4.1** · Synchronisierte Status- und Prioritätenboards mit Aufgabenvorlagen, bearbeitbaren Beschreibungen, Dashboard, Unteraufgaben, Arbeitsverlauf und Archiv.

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

## Aufgabenvorlagen

### Vorlage erstellen

Oben neben **+ Aufgabe** steht **+ Vorlage**. Der Knopf öffnet einen taskähnlichen Editor mit:

- einem eindeutigen **Namen der Vorlage** und einem optionalen Aufgabentitel;
- Priorität, Startstatus (ToDo, In Progress oder Waiting), Beschreibung und Aufwand;
- Unteraufgaben, die für neue Aufgaben jeweils offen beginnen;
- einer optionalen relativen Fälligkeit in Kalendertagen nach Erstellung: 0 = heute, 2 = zwei Tage später. Leer bedeutet ohne Fälligkeit; möglich sind 0 bis 3650 Tage.

Unter **Unteraufgaben** steht direkt eine Eingabezeile bereit. Den Titel der ersten vorgegebenen Unteraufgabe eingeben. **Enter** ergänzt die nächste Zeile; alternativ **+ Unteraufgabe** verwenden. Bereits eingegebene Titel können direkt geändert und über **×** entfernt werden. Eine vorhandene leere Zeile wird weiterverwendet, statt weitere leere Zeilen anzulegen.

Enter in einem Eingabefeld speichert das Formular nicht versehentlich. Erst **Vorlage speichern** legt die Vorlage mit allen ausgefüllten Unteraufgaben ab. Leere Zeilen werden nicht gespeichert. Beim erneuten Bearbeiten erscheinen die gespeicherten Unteraufgaben wieder als editierbare Eingabezeilen. Neue Aufgaben aus dieser Vorlage erhalten sämtliche vorgegebenen Unteraufgaben als eigene, offene Kopien.

Alles eingeben und anschließend **Vorlage speichern** wählen. Dadurch entsteht eine Vorlage, noch keine Aufgabe. Auf den einzelnen Aufgabenkarten gibt es keinen Vorlagenknopf.

### Aufgabe nach Vorlage erstellen

1. Oben **+ Aufgabe** öffnen.
2. Unten neben **Aufgabe erstellen** auf **Aufgabe nach Vorlage erstellen** klicken.
3. In der durchsuchbaren Auswahl den gewünschten Vorlagennamen anklicken. Das erstellt die Aufgabe direkt mit den gespeicherten Vorgaben und schließt die Dialoge.

Hat die Vorlage keinen Aufgabentitel, wird ihr Vorlagenname als Titel verwendet. Die relative Fälligkeit wird am Tag der Erstellung in ein konkretes Datum umgerechnet. Angefangene Eingaben im normalen Aufgabendialog werden nicht mit den Vorlagenwerten vermischt. Abbrechen in der Auswahl kehrt zum unveränderten Entwurf zurück.

Nach der Erstellung bleiben Titel, Priorität, Beschreibung, Fälligkeit, Aufwand und Unteraufgaben über die üblichen Bearbeitungsmöglichkeiten anpassbar. Jede Aufgabe ist eine unabhängige Kopie mit eigenen IDs, ohne Arbeitsverlauf oder erledigte Häkchen aus anderen Aufgaben. Änderungen an der Aufgabe ändern die Vorlage nicht.

### Benennen und verwalten

Im Reiter **Vorlagenverwaltung** werden alle Vorlagen unter ihrem Namen angezeigt. **Umbenennen** öffnet den Editor mit dem Feld **Name der Vorlage**. **Bearbeiten** passt auch die übrigen Vorgaben an. **Löschen** entfernt die Vorlage nach einer Bestätigung. Bereits erstellte Aufgaben bleiben bei Änderungen und beim Löschen der Vorlage unverändert. Doppelte Namen sind nicht erlaubt.

Vorlagen werden lokal zusammen mit den Aufgaben in data.json gespeichert. Bestehende Aufgaben und Vorlagen bleiben beim Update erhalten.

## Aufgaben: Status und Prioritäten

Unter dem gemeinsamen Hauptreiter **Aufgaben** stehen die zwei zusammengefassten Unterreiter **Status** und **Prioritäten**. Sie wechseln zwischen dem Statusboard und dem Prioritätenboard; Dashboard, Vorlagenverwaltung und Archiv bleiben eigenständige Hauptreiter. Die Prioritäten heißen **low**, **mid**, **high** und **immediately**, mit dezenten Farbtönen Grün, Blau, Bernstein und Rosé.

Eine Aufgabe besitzt einen Status und eine Priorität. Beide Übersichten zeigen dieselbe gespeicherte Aufgabe, keine unabhängigen Kopien. Änderungen an Titel, Beschreibung, Fälligkeit, Aufwand, Status, Priorität, Unteraufgaben und Arbeitsverlauf erscheinen in beiden Übersichten.

- Im Erstell-/Bearbeitungsdialog und im Prioritätsfeld auf jeder Karte die Priorität auswählen.
- Alternativ den Kartentitel in eine Prioritätsspalte ziehen. Das ändert nur die Priorität; Status und vorhandener Archivtimer bleiben erhalten.
- Das Ziehen in eine Statusspalte ändert nur den Status; die Priorität bleibt erhalten.
- Die farbigen Tags und die Position in der Prioritätenübersicht stimmen immer mit der gespeicherten Priorität überein.
- Neue Aufgaben und bestehende Aufgaben ohne Priorität beginnen mit **mid**.
- Im Statusboard erscheinen alle nicht archivierten Aufgaben. Die Prioritätenübersicht zeigt nur Aufgaben in ToDo, In Progress oder Waiting. Beim Wechsel zu Done verschwindet eine Aufgabe sofort aus der Prioritätenübersicht, bleibt aber bis zur Archivierung in der Done-Spalte. Beim Zurückverschieben aus Done erscheint sie wieder in ihrer bisherigen Prioritätsspalte. Auch das Wiederherstellen aus dem Archiv bringt sie mit derselben Priorität zurück.
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

Vorhandene Aufgaben und Vorlagen aus früheren Versionen werden automatisch übernommen. Fehlende Prioritäten werden auf mid gesetzt. Die bisherigen Kategorien werden zugeordnet: Offen → ToDo, In Bearbeitung → In Progress, Warten auf Person und Delayed → Waiting, Fertig → Done. Vorhandene Abschlussdaten und Archivtimer bleiben dabei erhalten. Titel, Status, Fälligkeitsdatum und Beschreibung bleiben erhalten. Neue Felder werden ergänzt.

Alte Aufgaben im Status Done besitzen noch kein gespeichertes Abschlussdatum. Für sie beginnt der Archivtimer beim ersten Laden von Version 1.4.1. Sie werden als vor dem Update erledigt gekennzeichnet und nicht rückwirkend in 7-/30-Tage-Statistiken eingerechnet.

Alle Daten liegen lokal in `<Vault>/.obsidian/plugins/tagesplaner/data.json`; das Archiv ist Teil dieser Datei. Persönliche Aufgaben gehören nicht ins öffentliche GitHub-Repository. Vor einem späteren Downgrade auf eine ältere Plugin-Version die Datei sichern: Ältere Versionen kennen die neuen Kategorien beziehungsweise das neue Datenformat nicht.

## Release 1.4.1 erstellen

Repository: https://github.com/Janosch3000/Daily-Planner

1. Ein neues Release mit neuem Tag **1.4.1**, Ziel **main**, Titel **Tagesplaner 1.4.1** erstellen.
2. Die aktuellen Dateien **main.js**, **manifest.json** und **styles.css** aus dieser Version als drei einzelne Assets anhängen.
3. Die Notizen aus `CHANGELOG.md` verwenden und das Release veröffentlichen. Nicht als Pre-release markieren, wenn BRAT es regulär als neueste Version beziehen soll.

Die Dateien liegen direkt im Repository-Stammverzeichnis. `versions.json` dokumentiert die erforderliche Obsidian-Version und bleibt ebenfalls im Stammverzeichnis. Für die Installation über BRAT reicht das automatisch erzeugte Source-code-ZIP allein nicht; die drei einzelnen Release-Assets müssen vorhanden sein.

Die Plugin-ID `tagesplaner` bleibt unverändert, damit BRAT vorhandene Installationen aktualisiert.

## Grenzen dieser Version

Die Full-Calendar-Anbindung, die tägliche Übertragung unerledigter Aufgaben und eine Zeiterfassung sind nicht Bestandteil von 1.4.1. Das Archiv arbeitet mit abgeschlossenen Aufgaben und läuft, während das Plugin in Obsidian geladen ist.
