# Tagesplaner für Obsidian

Version **1.8.0** · Aufgabenplanung mit Projekten, Wochen-/Monatskalender, Papierkorb, kompakten Karten, Vorlagen, Serienaufgaben und Erinnerungen.

## Installation und Update über BRAT

In Obsidian **BRAT → Add Beta plugin** öffnen und `Janosch3000/Daily-Planner` hinzufügen. Anschließend unter Community-Plugins den **Tagesplaner** aktivieren. Über das Dashboard-Symbol links oder den Befehl **Tagesplaner öffnen** starten.

Für Updates in BRAT nach Plugin-Updates suchen und den Tagesplaner erneut aktivieren oder Obsidian neu starten. Eine Neuinstallation ist nicht erforderlich; vorhandene Daten werden übernommen.

## Kompakte Aufgabenkarten

Die Karte zeigt den Titel, direkt darunter kleine Angaben zu Priorität, Status und Projekt sowie gegebenenfalls Termin und Serie. Beschreibung und alle Unteraufgaben einschließlich Abschlusszustand und eigener Termine bleiben sichtbar. Waiting zeigt zusätzlich Person und Nachfragedatum. Die farbigen Rahmen werden beim Überfahren mit der Maus weiß.

Auf der Karte gibt es keine Auswahlfelder und keine Eingabeformulare. **Bearbeiten** öffnet den Dialog für Titel, Beschreibung, Priorität, Status, Projekt, Termine, Unteraufgaben und Arbeitsverlauf. Auch Unteraufgaben werden dort abgehakt. Unter **Was wurde gemacht?** stehen die bisherigen Einträge; ein neuer Arbeitsschritt wird beim Speichern angehängt.

Zum Verschieben die Karte am Titel ziehen: im Statusboard wird nur der Status geändert, im Prioritätenboard nur die Priorität. Beide Boards bearbeiten dieselbe Aufgabe. Done-Aufgaben erscheinen nicht im Prioritätenboard; nach dem Zurückverschieben erscheinen sie wieder.

Status: **ToDo**, **In Progress**, **Waiting**, **Done**. Prioritäten: **low**, **mid**, **high**, **immediately**. Innerhalb jeder Statusspalte stehen höhere Prioritäten oben; bei gleicher Priorität kommt der frühere Termin zuerst, Aufgaben ohne Termin folgen danach. Der frühere Status „Anpassungen Planner“ wird zu ToDo und die gleichnamige Priorität zu low.

## Papierkorb

**Löschen** auf einer Karte oder im Bearbeitungsdialog verschiebt die gespeicherte Aufgabe in den **Papierkorb**. Sie verschwindet aus Boards, Kalender, Projektfortschritt, Dashboard, Erinnerungen und normalem Archiv. Projekt, Beschreibung, Termine, Unteraufgaben und Arbeitsverlauf bleiben erhalten.

Der Papierkorb zeigt alle gelöschten Aufgaben unabhängig von Projektfiltern, auch bei ausgeblendeten Projekten. **Wiederherstellen** bringt die Aufgabe mit ihren vorherigen Werten zurück. Archivierte Aufgaben bleiben archiviert; Aufgaben ausgeblendeter Projekte bleiben nur dort sichtbar. Bei wiederhergestellten Done-Aufgaben gilt das ursprüngliche Abschlussdatum für die automatische Archivierung.

**Endgültig löschen** öffnet eine Bestätigung. Erst danach werden Aufgabe und Inhalte dauerhaft entfernt. Der Papierkorb leert sich nicht automatisch.

Das Löschen eines einzelnen Serienvorkommens beendet die Serie nicht. Künftige Vorkommen werden weiter erzeugt; unter **Kalender → Wiederholungen** lässt sich die Serie pausieren. Gelöschte Vorkommen werden nicht erneut erzeugt. Nach endgültiger Löschung bleibt dafür nur der technische Schlüssel aus Serien-ID und Vorkommensdatum erhalten, ohne Aufgabeninhalt.

## Projekte und Sichtbarkeit

Aufgaben und Vorlagen lassen sich einem Projekt oder **Kein Projekt** zuordnen. Unter **Projekte** ein bestimmtes Projekt, alle Projekte oder Aufgaben ohne Projekt wählen. Status-/Prioritätenboards, Fortschritt und Projektarchiv stehen dort zur Verfügung. **Projekt entfernen** löscht keine Aufgaben: Aufgaben, Vorlagen und künftige Serienvorgaben verlieren nur die Projektzuordnung.

Unter **Projekt bearbeiten → Sichtbarkeit** gibt es drei unabhängige Optionen:

- **Nur in Projektansicht anzeigen**: Aufgaben aus allgemeinen Boards, Kalender und allgemeinem Archiv ausblenden. Die Projektansicht bleibt vollständig verfügbar. Ein Projektfilter im allgemeinen Board hebt die Ausnahme nicht auf.
- **Im Dashboard berücksichtigen**: Zählwerte, Verteilungen, Abschlüsse, Fälligkeiten und Arbeitsverlauf dieses Projekts ein- oder ausschließen.
- **Erinnerungen für dieses Projekt aktivieren**: Hinweise für Aufgaben-, Unteraufgaben- und Nachfragetermine aktivieren oder abschalten.

Neue Projekte sind überall sichtbar und werden bei Dashboard und Erinnerungen berücksichtigt. Die bisherige Ausnahme für „Anpassungen Planer“ wird automatisch übernommen: nur Projektansicht, nicht im Dashboard, Erinnerungen aktiv. Danach ist die Einstellung unabhängig vom Namen und frei änderbar. Beim Umbenennen bleibt sie erhalten.

## Wochen- und Monatskalender

Der Hauptreiter **Kalender** ersetzt **Heute**. **Woche** zeigt Montag bis Sonntag, **Monat** einen vollständigen Monatskalender mit angrenzenden Tagen. Mit den Pfeilen den Zeitraum wechseln, mit **Heute** zurückspringen oder das Datum direkt wählen. Auf schmalen Flächen lässt sich das Raster horizontal scrollen.

Einträge zeigen offene Aufgabentermine, offene Unteraufgabentermine und Nachfragen bei Waiting. Die Terminart steht am Eintrag; dieselbe Aufgabe kann mehrere Termine haben. Done, Archiv, Papierkorb und Projekte mit „Nur in Projektansicht anzeigen“ erscheinen nicht im allgemeinen Kalender.

Ein Klick öffnet den Bearbeitungsdialog. Beim Ziehen auf einen anderen Tag wird nur der jeweilige Termin geändert: Hauptfälligkeit, Unteraufgabentermin oder Nachfragedatum. Alle anderen Termine bleiben erhalten. Alternativ lassen sich Termine im Dialog ändern.

Unter dem Kalender bleiben **Überfällig** und **Ohne Termin** unabhängig vom gewählten Zeitraum zugänglich. Suche und Status-/Prioritäts-/Projektfilter gelten für Kalender und Zusatzlisten gemeinsam. Erledigte Unteraufgaben erzeugen keine offenen Termine.

## Waiting und Erinnerungen

Waiting unterstützt eine Person oder ein Team und ein Nachfragedatum. Die Angaben bleiben bei Statuswechseln erhalten; Nachfragen werden nur bei Waiting als offene Termine behandelt.

Unter **Kalender → Erinnerungen** Hinweise aktivieren oder abschalten und 0, 1, 3 oder 7 Tage Vorlauf wählen. Standardmäßig sind sie mit einem Tag Vorlauf aktiv. Aufgaben, Unteraufgaben und Nachfragen sowie die Projekteinstellung werden berücksichtigt. Automatische Hinweise erscheinen pro Fälligkeit höchstens einmal am Kalendertag, auch nach Neustarts. **Jetzt prüfen** darf erneut erinnern.

Die Prüfung läuft beim Laden beziehungsweise Öffnen und minütlich, solange das Plugin geladen ist. Bei geschlossenem Obsidian oder deaktiviertem Plugin gibt es keine Hintergrund- oder Systembenachrichtigungen. Erinnerungen ausgeblendeter Projekte können unabhängig aktiv bleiben; diese Aufgaben findest du in der Projektansicht.

## Vorlagen und Serien

**+ Vorlage** neben **+ Aufgabe** öffnet die Vorlagenbearbeitung. Vorlagen enthalten einen Namen, optionalen Aufgabentitel, Beschreibung, Startstatus, Priorität, optionales Projekt, Unteraufgaben, relative Termine und Wiederholungsregeln. Unteraufgaben direkt eingeben; Enter ergänzt eine Zeile, ohne die Vorlage vorzeitig zu speichern.

Unter **+ Aufgabe → Aufgabe nach Vorlage erstellen** eine Vorlage wählen. Es entsteht eine unabhängige Aufgabe, die sofort im Bearbeitungsdialog geöffnet wird. Alle Werte bleiben anpassbar. Abbrechen im anschließend geöffneten Dialog behält die bereits erstellte Aufgabe; bei Bedarf lässt sie sich löschen. Vorlagen können unter **Vorlagenverwaltung** umbenannt, bearbeitet und gelöscht werden. Erstellte Aufgaben bleiben davon unberührt.

Serien sind täglich, wöchentlich oder monatlich mit Intervallen von 1 bis 365 möglich und benötigen einen Haupttermin. Neue Vorkommen erhalten eigene IDs, offene Unteraufgaben und einen leeren Arbeitsverlauf. Relative Termine werden übernommen. Monatliche Serien berücksichtigen kurze Monate und behalten den ursprünglichen Monatstag für spätere Monate.

Dialogänderungen einer Serienaufgabe aktualisieren die Vorgaben künftiger Vorkommen. Das Verschieben eines einzelnen Kalendereintrags ändert nur dieses Vorkommen und verschiebt nicht den Serienkalender. Unter **Kalender → Wiederholungen** lassen sich Serien auch nach Archivierung oder Löschung ihrer Ursprungsaufgabe verwalten. Pausieren stoppt die Erzeugung; Fortsetzen überspringt die pausierte Zeit. **Keine Wiederholung** im Aufgabendialog pausiert die zugehörige Serie.

Versäumte aktive Vorkommen werden nachgeholt, mit höchstens 100 Schritten pro Wartungslauf. Aufgaben und Serienfortschritt werden gemeinsam gespeichert; fehlgeschlagene Vorgänge können erneut versucht werden.

## Suche, Archiv und Daten

Suchtext und Filter nach Status, Priorität, Termin und Projekt kombinieren. Gesucht wird in Titel, Beschreibung, Unteraufgaben, Arbeitsverlauf, wartender Person und Projektname. Mehrere Wörter müssen alle vorkommen. Terminfilter berücksichtigen Haupttermine, offene Unteraufgaben und aktive Nachfragen. **Filter zurücksetzen** entfernt die Einschränkungen.

Done-Aufgaben wandern nach 24 verstrichenen Stunden ins **Archiv**, mit Unteraufgaben und Verlauf. **Wieder öffnen** setzt sie auf ToDo. Der Papierkorb ist getrennt; gelöschte Aufgaben werden nicht automatisch archiviert. Historische Done-Aufgaben ohne Abschlussdatum erhalten beim ersten Laden einen geschätzten Abschlusszeitpunkt und werden nicht rückwirkend in Abschlussstatistiken eingerechnet.

Alle persönlichen Daten liegen lokal in `<Vault>/.obsidian/plugins/tagesplaner/data.json`. Persönliche Aufgaben gehören nicht ins öffentliche Repository. Vor einem Downgrade diese Datei sichern: Ältere Versionen berücksichtigen Papierkorb und Projekteinstellungen nicht.

## Release 1.8.0 erstellen

Auf GitHub ein Release mit Tag **1.8.0**, Ziel **main** und Titel **Tagesplaner 1.8.0** erstellen. Diese drei Dateien einzeln als Assets anhängen:

- `main.js`
- `manifest.json`
- `styles.css`

Ein ZIP allein und automatisch erzeugte Quellcodearchive reichen für BRAT nicht aus. `versions.json` bleibt im Repository. Ein zusätzlicher Build ist nicht nötig; `main.js` ist die direkt ladbare CommonJS-Datei ohne zusätzliche Laufzeitabhängigkeiten.
