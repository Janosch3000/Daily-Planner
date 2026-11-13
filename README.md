# Tagesplaner für Obsidian

Version **1.7.1** · Aufgaben- und Projektplanung mit Suche, Heute-Ansicht, wiederkehrenden Aufgaben, Erinnerungen, Unteraufgabenterminen, Vorlagen und Archiv.

## Installation über BRAT

1. In Obsidian **BRAT → Add Beta plugin** öffnen.
2. `Janosch3000/Daily-Planner` hinzufügen.
3. Unter **Community-Plugins** den Tagesplaner aktivieren.
4. Über das Dashboard-Symbol in der linken Leiste oder den Befehl **Tagesplaner öffnen** starten.

Für Updates in BRAT nach Plugin-Updates suchen. Danach den Tagesplaner deaktivieren und erneut aktivieren oder Obsidian neu starten. Das Plugin muss vorher nicht deinstalliert werden.

## Suche und Filter

Über den Aufgabenboards lassen sich Suchtext und Filter für Status, Priorität, Fälligkeit und Projekt kombinieren. Die Suche berücksichtigt Titel, Beschreibung, Unteraufgaben, Arbeitsverlauf, die wartende Person und Projektnamen. Mehrere Suchwörter müssen alle vorkommen, dürfen aber in unterschiedlichen Feldern stehen. Groß- und Kleinschreibung spielt keine Rolle.

Terminfilter: heute, überfällig, nächste 7 Tage oder ohne Termin. Neben der Hauptfälligkeit werden offene Unteraufgabentermine und bei Waiting das Nachfragedatum berücksichtigt. **Filter zurücksetzen** hebt die Einschränkungen auf. Die Eingaben bleiben beim Wechsel zwischen den Aufgabenansichten erhalten.

## Heute und Erinnerungen

Der neue Hauptreiter **Heute** zeigt Aufgaben, deren eigene Fälligkeit, offene Unteraufgabe oder Nachfrage heute oder früher fällig ist. Überfällige Einträge stehen zuerst. Jede Aufgabe erscheint nur einmal, mit einer Liste der Gründe für ihre Anzeige. Erledigte Aufgaben und bereits abgehakte Unteraufgaben erzeugen keine offenen Fälligkeiten.

Unter **Heute → Erinnerungen** lassen sich die Obsidian-Hinweise aktivieren oder abschalten und ein Vorlauf von 0, 1, 3 oder 7 Tagen einstellen. Anfangs sind sie mit einem Tag Vorlauf aktiv. Automatische Erinnerungen erscheinen beim Laden beziehungsweise Öffnen des Planners und bei neuen Fälligkeiten während der minütlichen Prüfung. Jede Fälligkeit wird höchstens einmal pro Kalendertag automatisch gemeldet; dieser Zustand bleibt auch nach einem Neustart erhalten. **Jetzt prüfen** darf ausdrücklich erneut erinnern.

Die Hinweise berücksichtigen Aufgaben, Unteraufgaben und Nachfragen. Vorab gemeldete zukünftige Termine lassen sich über die Aufgabenfilter finden; die Heute-Ansicht bleibt auf heute und überfällige Einträge beschränkt. Es handelt sich um Hinweise innerhalb von Obsidian. Bei geschlossenem Obsidian oder deaktiviertem Plugin gibt es keine Hintergrund- oder Systembenachrichtigungen.

## Unteraufgaben mit eigenen Terminen

Unteraufgaben haben ein eigenes optionales Datum, unabhängig von der Hauptaufgabe. Es lässt sich im Erstell-/Bearbeitungsdialog und direkt neben der Unteraufgabe auf der Karte setzen, ändern oder leeren. Fällige offene Unteraufgaben erscheinen über ihre Hauptaufgabe unter Heute und in den Erinnerungen. Das Abhaken einer Unteraufgabe beendet nur deren offene Fälligkeit.

In Vorlagen wird für jede Unteraufgabe statt eines festen Datums ein optionaler Abstand in Tagen ab Erstellung gespeichert. Beim Verwenden der Vorlage wird daraus ein konkreter Termin. Alle Daten bleiben anschließend frei änderbar.

## Warten auf jemanden

Im Status **Waiting** bietet der Aufgabendialog die Felder **Warten auf · Person oder Team** und **Nachfragen am**. Beide sind optional. Die Person und das Datum werden auf der Karte angezeigt und sind über **Bearbeiten** anpassbar. Nachfragen erscheinen am entsprechenden Tag unter Heute und werden bei aktivierten Erinnerungen berücksichtigt. Ein Statuswechsel aus Waiting beendet die aktive Nachfrage, bewahrt aber die Angaben für einen späteren Wechsel zurück.

Vorlagen können eine wartende Person und eine relative Nachfragefrist in Tagen enthalten.

## Projekte

Im Hauptreiter **Projekte** ein Projekt auswählen. Alternativ **Alle Projekte** oder **Kein Projekt** wählen. Die Projektansicht zeigt die zugehörigen Aufgaben als Status- oder Prioritätenboard, einen Fortschrittsbalken sowie offene und erledigte Aufgaben. Erledigte Aufgaben im Archiv zählen beim Projektfortschritt weiter mit; sie können im ausklappbaren Archivbereich des Projekts gelesen und wieder geöffnet werden.

- **+ Projekt** erstellt ein Projekt mit Namen und optionaler Beschreibung. Doppelte Namen sind nicht erlaubt.
- **Projekt bearbeiten** benennt es um oder ändert die Beschreibung.
- Im Aufgabendialog ein Projekt auswählen oder **Kein Projekt** verwenden. Eine Zuordnung ist nie Pflicht. Bei Bedarf direkt im Dialog ein Projekt anlegen; die übrigen Eingaben bleiben erhalten.
- Eine neue Aufgabe, die über **+ Aufgabe** in einem ausgewählten Projekt begonnen wird, erhält dieses Projekt als Vorschlag.
- Vorlagen können eine Projektvorgabe enthalten. Eine explizite Projektvorgabe der Vorlage hat Vorrang. Hat sie keine, wird beim Erstellen aus der Projektansicht das dort ausgewählte Projekt vorgeschlagen und übernommen.
- **Projekt entfernen** erfordert eine Bestätigung. Aufgaben werden nicht gelöscht; sie wechseln zu Kein Projekt. Vorlagen und künftige Serienaufgaben verlieren nur die Projektzuordnung.

Bereits vorhandene Aufgaben aus älteren Versionen beginnen ohne Projekt. Die Projektzuordnung bleibt beim Archivieren und Wiederöffnen erhalten.

## Wiederkehrende Aufgaben

Im Aufgabendialog **Wiederholung** auf täglich, wöchentlich oder monatlich setzen. **Alle …** bestimmt das Intervall, beispielsweise alle 2 Wochen. Eine wiederkehrende Aufgabe braucht ein Fälligkeitsdatum; beim Aktivieren wird ohne vorhandenes Datum zunächst heute vorgeschlagen. Die erste Aufgabe wird beim Speichern angelegt. Nachfolgende Aufgaben entstehen automatisch an ihren jeweiligen Fälligkeitstagen, unabhängig davon, ob die vorige bereits erledigt ist.

Monatliche Wiederholungen behalten ihren ursprünglichen Monatstag. Eine Serie vom 31. Januar fällt im Februar auf den letzten Tag und im März wieder auf den 31. Wochen- und Tagesintervalle arbeiten mit Kalendertagen. Vorlagen können bereits eine Wiederholung vorgeben; die Serie beginnt erst, wenn daraus eine Aufgabe erstellt wird.

Jede Folgeaufgabe erhält eigene IDs, einen leeren Arbeitsverlauf und wieder offene Unteraufgaben. Projekt, Priorität und die Vorgaben werden übernommen. Unteraufgabentermine und Nachfragen behalten ihren relativen Abstand zur jeweiligen Hauptfälligkeit. Eine Folgeaufgabe startet nie in Done.

Wenn Obsidian geschlossen war, werden verpasste Serientermine beim nächsten Laden nachgeholt. Pro automatischem Durchlauf werden höchstens 100 Termine verarbeitet; größere Rückstände folgen in weiteren minütlichen Durchläufen. Serien-ID und Termindatum verhindern doppelte Vorkommen. Die Speicherung von Folgeaufgaben und nächstem Serientermin erfolgt gemeinsam; bei Schreibfehlern wird beides zurückgenommen.

Im Bearbeitungsdialog einer Serienaufgabe gelten Änderungen an Vorgaben und Wiederholung für künftige Aufgaben der Serie, nicht rückwirkend für bereits angelegte Aufgaben. Änderungen direkt auf einer Karte betreffen die jeweilige Aufgabe. Eine Änderung nur des Datums einer vorhandenen Aufgabe verschiebt nicht automatisch den übrigen Kalender der Serie. **Keine Wiederholung** pausiert die Serie.

Unter **Heute → Wiederholungen** lassen sich alle Serien auch dann noch pausieren, fortsetzen oder auf einen neuen nächsten Termin setzen, wenn die ursprüngliche Aufgabe bereits im Archiv liegt. Beim Fortsetzen wird die bewusst pausierte Zeit übersprungen; normale Offline-Zeiten einer aktiven Serie werden weiterhin nachgeholt. Bestehende Aufgaben werden durch das Pausieren nicht gelöscht.

## Aufgaben und Unteraufgaben

- **+ Aufgabe** öffnet einen Obsidian-Dialog für Titel, Priorität, Status, optionales Projekt, Fälligkeitsdatum, Wiederholung, Beschreibung und Unteraufgaben.
- **Bearbeiten** ändert diese Angaben später. Über **Beschreibung bearbeiten** direkt auf jeder Karte lässt sich eine Beschreibung außerdem jederzeit ergänzen, ändern oder leeren; mit **Beschreibung speichern** übernehmen. Das funktioniert im Statusboard und in der Prioritätenübersicht identisch.
- Kategorien in dieser Reihenfolge: **ToDo**, **In Progress**, **Waiting**, **Done**. Innerhalb jeder Statusspalte stehen Aufgaben nach Priorität: **immediately → high → mid → low**. Bei gleicher Priorität kommt das frühere Fälligkeitsdatum zuerst; Aufgaben ohne Datum folgen danach.
- Zum Verschieben den Kartentitel ziehen oder die Status-Auswahl verwenden. Die Status-Auswahl funktioniert auch ohne Maus.
- Innerhalb einer Karte neue Unteraufgaben eingeben und mit **+** oder Enter hinzufügen. Häkchen speichern den Fortschritt, **×** entfernt eine Unteraufgabe.
- Der übergeordnete Status wird bewusst manuell gesetzt. Erledigte Unteraufgaben setzen die Hauptaufgabe nicht automatisch auf Done.
- Unten in jeder Karte steht **Was wurde gemacht?**. Einträge mit **Eintrag speichern** ablegen; sie bleiben mit Datum und Uhrzeit im Arbeitsverlauf erhalten.
- Noch nicht gespeicherte Texte für Unteraufgaben und Arbeitsschritte bleiben beim Wechsel zwischen den Ansichten innerhalb derselben geöffneten Planner-Ansicht erhalten. Vor dem Schließen oder Neustart speichern.

## Aufgabenvorlagen

### Vorlage erstellen

Oben neben **+ Aufgabe** steht **+ Vorlage**. Der Knopf öffnet einen taskähnlichen Editor mit:

- einem eindeutigen **Namen der Vorlage** und einem optionalen Aufgabentitel;
- Priorität, Startstatus (ToDo, In Progress, Waiting), Projekt, Wiederholung und Beschreibung;
- Unteraufgaben, die für neue Aufgaben jeweils offen beginnen;
- einer optionalen relativen Fälligkeit in Kalendertagen nach Erstellung: 0 = heute, 2 = zwei Tage später. Leer bedeutet ohne Fälligkeit; möglich sind 0 bis 3650 Tage.

Unter **Unteraufgaben** steht direkt eine Eingabezeile bereit. Den Titel der ersten vorgegebenen Unteraufgabe eingeben. **Enter** ergänzt die nächste Zeile; alternativ **+ Unteraufgabe** verwenden. Bereits eingegebene Titel können direkt geändert und über **×** entfernt werden. Eine vorhandene leere Zeile wird weiterverwendet, statt weitere leere Zeilen anzulegen.

Enter in einem Eingabefeld speichert das Formular nicht versehentlich. Erst **Vorlage speichern** legt die Vorlage mit allen ausgefüllten Unteraufgaben ab. Leere Zeilen werden nicht gespeichert. Beim erneuten Bearbeiten erscheinen die gespeicherten Unteraufgaben wieder als editierbare Eingabezeilen. Neue Aufgaben aus dieser Vorlage erhalten sämtliche vorgegebenen Unteraufgaben als eigene, offene Kopien.

Alles eingeben und anschließend **Vorlage speichern** wählen. Dadurch entsteht eine Vorlage, noch keine Aufgabe. Auf den einzelnen Aufgabenkarten gibt es keinen Vorlagenknopf.

### Aufgabe nach Vorlage erstellen

1. Oben **+ Aufgabe** öffnen.
2. Unten neben **Aufgabe erstellen** auf **Aufgabe nach Vorlage erstellen** klicken.
3. In der durchsuchbaren Auswahl den gewünschten Vorlagennamen anklicken. Das erstellt die Aufgabe mit den gespeicherten Vorgaben und öffnet genau diese Aufgabe sofort im Bearbeitungsdialog. Dort kannst du die übernommenen Werte anpassen und mit Änderungen speichern übernehmen.

Hat die Vorlage keinen Aufgabentitel, wird ihr Vorlagenname als Titel verwendet. Die relative Fälligkeit wird am Tag der Erstellung in ein konkretes Datum umgerechnet. Angefangene Eingaben im normalen Aufgabendialog werden nicht mit den Vorlagenwerten vermischt. Abbrechen in der Auswahl kehrt zum unveränderten Entwurf zurück.

Die Aufgabe ist beim Öffnen des Bearbeitungsdialogs bereits angelegt. Abbrechen verwirft nur die ungespeicherten Anpassungen; die erstellte Aufgabe bleibt bestehen. Nach der Erstellung bleiben Titel, Priorität, Beschreibung, Fälligkeit und Unteraufgaben über die üblichen Bearbeitungsmöglichkeiten anpassbar. Jede Aufgabe ist eine unabhängige Kopie mit eigenen IDs, ohne Arbeitsverlauf oder erledigte Häkchen aus anderen Aufgaben. Änderungen an der Aufgabe ändern die Vorlage nicht.

### Benennen und verwalten

Im Reiter **Vorlagenverwaltung** werden alle Vorlagen unter ihrem Namen angezeigt. **Umbenennen** öffnet den Editor mit dem Feld **Name der Vorlage**. **Bearbeiten** passt auch die übrigen Vorgaben an. **Löschen** entfernt die Vorlage nach einer Bestätigung. Bereits erstellte Aufgaben bleiben bei Änderungen und beim Löschen der Vorlage unverändert. Doppelte Namen sind nicht erlaubt.

Vorlagen werden lokal zusammen mit den Aufgaben in data.json gespeichert. Bestehende Aufgaben und Vorlagen bleiben beim Update erhalten.

## Aufgaben: Status und Prioritäten

Unter dem gemeinsamen Hauptreiter **Aufgaben** stehen die zwei zusammengefassten Unterreiter **Status** und **Prioritäten**. Sie wechseln zwischen dem Statusboard und dem Prioritätenboard; Dashboard, Vorlagenverwaltung und Archiv bleiben eigenständige Hauptreiter. Die Prioritäten heißen **low**, **mid**, **high**, **immediately**, mit dezenten Farbtönen Grün, Blau, Bernstein und Rosé.

Eine Aufgabe besitzt einen Status und eine Priorität. Beide Übersichten zeigen dieselbe gespeicherte Aufgabe, keine unabhängigen Kopien. Änderungen an Titel, Beschreibung, Fälligkeit, Status, Priorität, Unteraufgaben und Arbeitsverlauf erscheinen in beiden Übersichten.

- Im Erstell-/Bearbeitungsdialog und im Prioritätsfeld auf jeder Karte die Priorität auswählen.
- Alternativ den Kartentitel in eine Prioritätsspalte ziehen. Das ändert nur die Priorität; Status und vorhandener Archivtimer bleiben erhalten.
- Das Ziehen in eine Statusspalte ändert nur den Status; die Priorität bleibt erhalten.
- Die farbigen Tags und die Position in der Prioritätenübersicht stimmen immer mit der gespeicherten Priorität überein.
- Neue Aufgaben und bestehende Aufgaben ohne Priorität beginnen mit **mid**.
- Im Statusboard erscheinen alle nicht archivierten Aufgaben. Die Prioritätenübersicht zeigt nur Aufgaben in ToDo, In Progress oder Waiting. Beim Wechsel zu Done verschwindet eine Aufgabe sofort aus der Prioritätenübersicht, bleibt aber bis zur Archivierung in der Done-Spalte. Beim Zurückverschieben aus Done erscheint sie wieder in ihrer bisherigen Prioritätsspalte. Auch das Wiederherstellen aus dem Archiv bringt sie mit derselben Priorität zurück.
- Textentwürfe für Beschreibungen, Unteraufgaben und Arbeitsschritte werden innerhalb der geöffneten Ansicht zwischen beiden Darstellungen synchronisiert. Erst Speichern legt sie dauerhaft ab. Scrollpositionen bleiben bei Änderungen erhalten.

## Symbole und Gestaltung

Die Statuskategorien haben eindeutige, farbige Symbole neben ihrer Beschriftung:

- **ToDo**: leeres Kästchen.
- **In Progress**: Baustellenabsperrung.
- **Waiting**: Uhr.
- **Done**: Kästchen mit Haken.

Bei den Prioritäten stehen Pfeile für die Dringlichkeit: **low ↓**, **mid →**, **high ↑**, **immediately ⇈**. Die Symbole sind kräftiger eingefärbt als die dezenten Spaltenhintergründe. Jede Aufgabenkarte hat einen dezenten Rahmen in der Farbe ihrer aktuellen Status- beziehungsweise Prioritätsspalte. Beim Darüberfahren mit der Maus wird der Rahmen reinweiß (#ffffff) und erhält einen leichten weißen Schein. Tastaturfokus innerhalb einer Karte hebt den Rahmen weiterhin in der jeweiligen Highlightfarbe hervor. Sie erscheinen in Spaltenüberschriften, auf Karten, in der Vorlagenauswahl und im Dashboard; Auswahlfelder verwenden ebenfalls passende Zeichen. Alle Beschriftungen bleiben zusätzlich sichtbar. Die Symbole werden lokal als SVG dargestellt, ohne externe Bilder zu laden.

Aufwandseingabe, Stundenanzeigen, Wochenkapazität und die daraus berechnete Auslastung sind in dieser Version aus der Oberfläche entfernt. Das Dashboard konzentriert sich auf Aufgaben, Prioritäten, Fälligkeiten, Unteraufgaben und Abschlüsse.

Die frühere Kategorie „Anpassungen Planner“ wurde aus Status und Prioritäten entfernt. Beim Laden werden entsprechende Statuswerte zu **ToDo** und Prioritäten zu **low**. Das gilt auch für Vorlagen und Serienaufgaben; Inhalte, Projekte und Termine bleiben erhalten.

## Archiv

Aufgaben wechseln **24 Stunden nach dem Setzen auf Done** automatisch ins Archiv. Das Plugin prüft jede Minute, beim Laden und beim Öffnen der Ansicht. War Obsidian geschlossen, wird die Archivierung beim nächsten Start nachgeholt.

Das Archiv ist nach Titel, Beschreibung, Unteraufgaben und Arbeitsverlauf durchsuchbar. Es werden keine Aufgaben durch die automatische Archivierung gelöscht. **Wieder öffnen** verschiebt eine Aufgabe nach ToDo; Unteraufgaben und Arbeitsverlauf bleiben erhalten. Bei erneutem Abschluss beginnen die 24 Stunden von vorn.

## Dashboard

- Offene Aufgaben, Aufgaben in Bearbeitung, heutige Fälligkeiten und überfällige Aufgaben.
- Erledigte Aufgaben in den letzten 7 beziehungsweise 30 Kalendertagen, einschließlich heute und einschließlich Archiv.
- Aufgaben in Waiting sowie erledigte Unteraufgaben im Verhältnis zur Gesamtzahl.
- Verteilung auf die Kategorien und Abschlussdiagramm der letzten 7 Tage.
- Bevorstehende Fälligkeiten, zuletzt abgeschlossene Aufgaben und letzte dokumentierte Arbeitsschritte.
- Verteilung der offenen Aufgaben auf die fünf Prioritäten.

Erneut geöffnete Aufgaben zählen bis zu ihrem nächsten Abschluss nicht als erledigt. Die Statistik verwendet den letzten Abschluss der aktuell fertigen Aufgaben und zählt dieselbe Aufgabe nicht mehrfach.

## Bestehende Daten

Vorhandene Aufgaben und Vorlagen aus früheren Versionen werden automatisch übernommen. Fehlende Prioritäten werden auf mid gesetzt. Die bisherigen Kategorien werden zugeordnet: Offen → ToDo, In Bearbeitung → In Progress, Warten auf Person und Delayed → Waiting, Fertig → Done. Vorhandene Abschlussdaten und Archivtimer bleiben dabei erhalten. Titel, Status, Fälligkeitsdatum und Beschreibung bleiben erhalten. Neue Felder werden ergänzt.

Alte Aufgaben im Status Done besitzen noch kein gespeichertes Abschlussdatum. Für sie beginnt der Archivtimer beim ersten Laden von Version 1.7.1. Sie werden als vor dem Update erledigt gekennzeichnet und nicht rückwirkend in 7-/30-Tage-Statistiken eingerechnet.

Alle Daten liegen lokal in `<Vault>/.obsidian/plugins/tagesplaner/data.json`; das Archiv ist Teil dieser Datei. Persönliche Aufgaben gehören nicht ins öffentliche GitHub-Repository. Vor einem späteren Downgrade auf eine ältere Plugin-Version die Datei sichern: Ältere Versionen kennen die neuen Kategorien beziehungsweise das neue Datenformat nicht.

## Release 1.7.1 erstellen

Repository: https://github.com/Janosch3000/Daily-Planner

1. Ein neues Release mit neuem Tag **1.7.1**, Ziel **main**, Titel **Tagesplaner 1.7.1** erstellen.
2. Die aktuellen Dateien **main.js**, **manifest.json** und **styles.css** aus dieser Version als drei einzelne Assets anhängen.
3. Die Notizen aus `CHANGELOG.md` verwenden und das Release veröffentlichen. Nicht als Pre-release markieren, wenn BRAT es regulär als neueste Version beziehen soll.

Die Dateien liegen direkt im Repository-Stammverzeichnis. `versions.json` dokumentiert die erforderliche Obsidian-Version und bleibt ebenfalls im Stammverzeichnis. Für die Installation über BRAT reicht das automatisch erzeugte Source-code-ZIP allein nicht; die drei einzelnen Release-Assets müssen vorhanden sein.

Die Plugin-ID `tagesplaner` bleibt unverändert, damit BRAT vorhandene Installationen aktualisiert.

## Grenzen dieser Version

Die Full-Calendar-Anbindung, das automatische Verschieben alter Fälligkeiten auf den nächsten Tag und eine Zeiterfassung sind nicht Bestandteil von 1.7.1. Überfällige Aufgaben bleiben in Heute sichtbar; wiederkehrende Aufgaben werden als neue Vorkommen erstellt. Das Archiv arbeitet mit abgeschlossenen Aufgaben und läuft, während das Plugin in Obsidian geladen ist.
