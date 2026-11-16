# Changelog

## 1.13.2

- Fix weekly all-day tasks incorrectly spanning every day between their start and end dates. Each occurrence now occupies only its selected weekday.
- Give Weekly its own optional First weekly occurrence field; hide ordinary range dates and remove the due-date requirement. With no date, start on the next selected weekday.
- Preserve optional event times and overnight clocks, and repair existing active weekly ranges while retaining task IDs, content, project assignments and shared subtasks.
- Keep daily/monthly recurrence and explicit Pause / No due date drag behavior unchanged.

Release assets: `main.js`, `manifest.json`, `styles.css`. Tag: **1.13.2**.


## 1.13.1

- Add subtasks directly on collapsed or expanded task cards with a compact title field and + button; support Enter to save.
- Delete individual subtasks with an accessible trash button without opening Edit.
- Preserve inline drafts across view changes and save failures; prevent duplicate submissions. Retain archive read-only behavior and shared weekly task updates.

Release assets: `main.js`, `manifest.json`, `styles.css`. Tag: **1.13.1**.


## 1.13.0

- Add a separate Recurring tasks category with its own Status and Priorities boards. Exclude series-linked tasks, including paused routines, from ordinary task boards.
- Add a recurring-task creation shortcut prefilled with Weekly and an initial date, plus direct access to Manage recurrences.
- Separate project routines from regular project boards while preserving project-only visibility and full editing.
- Keep existing tasks and series intact; retain the shared calendar, dashboard counts, archive, Trash and recurrence behavior.

Release assets: `main.js`, `manifest.json`, `styles.css`. Tag: **1.13.0**.


## 1.12.2

- Add a consistent thin white hover outline to buttons, tabs, calendar events and resize handles, draggable headings, fields, selectors, checkbox labels and expandable sections.
- Provide the same feedback for keyboard focus; exclude disabled controls and scope styling to Daily Planner and its dialogs.
- Use inset outlines without changing layout, hit areas or exact calendar tile heights.

Release assets: `main.js`, `manifest.json`, `styles.css`. Tag: **1.12.2**.


## 1.12.1

- Size timed calendar blocks exactly to their real start/end range. Remove the artificial minimum height and eight-pixel duration gap.
- Calculate overlapping columns from actual time boundaries, so consecutive short appointments use the full column.
- Show only title and time on timed blocks, with a compact single line for appointments shorter than 30 minutes. Keep click-to-edit, hover details and resize handles.

Release assets: `main.js`, `manifest.json`, `styles.css`. Tag: **1.12.1**.


## 1.12.0

- Select Monday–Sunday for Weekly recurrence and optionally repeat every N weeks.
- Keep one continuously open weekly task, projecting its calendar entries indefinitely without generating weekly copies. Share edits, subtasks and activity across all entries.
- Manage weekday, interval and first occurrence with Pause/Resume and Edit task. Pause before marking the shared task Done.
- Move and resize weekly entries to update the shared schedule; preserve overnight ranges. Unscheduling pauses the rule, and scheduling again resumes it.
- Count the task once, avoid permanent overdue flags from past weekly dates, and keep reminders distinct by occurrence date.
- Preserve legacy weekly copies and completed history during schema-3 migration. Pause trashed weekly tasks, resume on restore, and remove the rule on permanent deletion. Retain daily/monthly independent occurrences.

Release assets: `main.js`, `manifest.json`, `styles.css`. Tag: **1.12.0**.


## 1.11.0

- Add draggable unscheduled tasks beside the calendar. Dropping into a time slot creates a one-hour range; all-day/Month drops assign a date without times.
- Drop calendar events back into No due date to clear the main schedule, or only the dragged subtask/follow-up date. Preserve task content and unrelated dates.
- Keep the empty drop zone visible and highlight valid targets. Make calendar time-block movement reliable with pointer capture, a drag preview and cancellation.
- Keep parents without main dates available even when child/follow-up dates are scheduled. Respect existing visibility and filters.
- Preserve active recurrences when unscheduling a single occurrence; allow ordinary edits of the undated occurrence.

Release assets: `main.js`, `manifest.json`, `styles.css`. Tag: **1.11.0**.


## 1.10.0

- Replace due-time-only editing with start/end dates and times. Preserve old deadlines and supply a one-hour start for existing timed tasks.
- Add a weekly hourly timeline with readable titles, smaller metadata, generous spacing, separate overlap columns and sticky all-day entries.
- Resize timed events by dragging their top/bottom edges in 15-minute steps; support keyboard adjustment, pointer cancellation and stale-data validation.
- Move entire event ranges while preserving duration. Extend or shorten all-day/month date ranges using date handles.
- Handle overnight and multi-day ranges, including midnight boundaries. Preserve relative ranges in templates and recurrence defaults.
- Keep the end as the deadline for overdue indicators, filters and reminders. Retain English UI, Trash, project visibility and card features.

Release assets: `main.js`, `manifest.json`, `styles.css`. Tag: **1.10.0**.


## 1.9.0

- Complete or reopen subtasks directly on collapsed task cards. Changes persist across task boards, project views, reloads and calendar entries; archived subtasks remain read-only.
- Add Show More / Show Less to cards, expanding descriptions, activity history and task details while preserving compact default cards.
- Make the plugin interface, display name, commands, dialogs, notifications and errors consistently English. Preserve existing user content and the plugin ID/data path.
- Add optional local task due times in 24-hour format, including templates and recurring tasks. Keep existing tasks all-day.
- Display and sort timed calendar events chronologically; preserve time when dragging tasks to another date. Include time in overdue indicators, filters and dashboard dates.
- Respect due times in reminders, with a separate due-time notification after an advance reminder and persistent deduplication.

Release assets: `main.js`, `manifest.json`, `styles.css`. Tag: **1.9.0**.

Historical release notes below retain their original language.

## 1.8.0

- Aufgaben mit vollständigen Inhalten in Papierkorb verschieben, wiederherstellen oder nach Bestätigung endgültig löschen. Gelöschte Aufgaben aus Ansichten, Statistiken, Erinnerungen und automatischer Archivierung ausschließen.
- Projekte gezielt ausblenden: Nur Projektansicht, Dashboard-Berücksichtigung und Erinnerungen unabhängig einstellen. Die bisherige Ausnahme für Anpassungen Planer automatisch übernehmen.
- Heute durch Wochen- und Monatskalender ersetzen, mit Navigation, Datumssprung, Filtern und Terminverschiebung per Drag-and-drop. Aufgaben-, Unteraufgaben- und Nachfragetermine unabhängig erhalten.
- Überfällige Aufgaben und Aufgaben ohne Termin unter dem Kalender zugänglich halten.
- Kompakte Karten mit Titel, kleinen Prio-/Status-/Projektangaben, Beschreibung und Unteraufgaben. Änderungen über Bearbeiten oder Verschieben; Arbeitsverlauf im Dialog fortführen.
- Schutz vor veralteten Bearbeitungsdialogen für gelöschte Aufgaben und Duplikatschutz für gelöschte Serienvorkommen.

Release-Assets: `main.js`, `manifest.json`, `styles.css`. Tag: **1.8.0**.

## 1.7.2

- Aufgaben des Projekts „Anpassungen Planer“ nur in der Projektansicht anzeigen, einschließlich dessen Archiv.
- Standardboards, Heute, allgemeines Archiv und Dashboard schließen diese Aufgaben aus; Projektfilter können die Ausnahme nicht umgehen.
- Aufgaben bleiben unverändert gespeichert und nach einem Projektwechsel wieder regulär sichtbar.

Release-Assets: `main.js`, `manifest.json`, `styles.css`. Tag: **1.7.2**.

## 1.7.1

- Status und Priorität „Anpassungen Planner“ aus Boards, Auswahlfeldern, Filtern und Dashboard entfernt.
- Bestehende Aufgaben, Vorlagen und Serien übernehmen stattdessen ToDo beziehungsweise low; Inhalte bleiben erhalten.
- Beide Boards haben wieder vier Spalten.

Release-Assets: `main.js`, `manifest.json`, `styles.css`. Tag: **1.7.1**.

## 1.7.0

- Suche und kombinierbare Filter nach Status, Priorität, Termin und Projekt; Suche auch in Unteraufgaben, Arbeitsverlauf und wartenden Personen.
- Neue Heute-Ansicht für heute fällige und überfällige Aufgaben, Unteraufgaben und Nachfragen, ohne doppelte Aufgabenkarten.
- Tägliche, wöchentliche und monatliche Serien mit frei wählbarem Intervall, korrekten Monatsenden, Offline-Nachholen und Schutz vor Duplikaten.
- Wiederholungen auch über Vorlagen starten; Serien unter Heute verwalten und pausieren oder fortsetzen.
- Konfigurierbare Erinnerungen in Obsidian mit Vorlauf und täglicher Begrenzung. Keine Hintergrundbenachrichtigungen bei geschlossenem Obsidian.
- Eigene Termine für Unteraufgaben, in Dialog und Karte bearbeitbar. Relative Unteraufgabentermine in Vorlagen.
- Waiting mit Person/Team und Nachfragedatum; Nachfragen sind in Heute und Erinnerungen integriert.
- Neue Projektansicht mit Auswahl, Status-/Prioritätenboards, Fortschritt, Archiv und Projektverwaltung.
- Aufgaben und Vorlagen können Projekten zugeordnet werden oder ausdrücklich ohne Projekt bleiben. Das Entfernen eines Projekts löscht keine Aufgaben.
- Bestehende Aufgaben, Vorlagen, Arbeitsverläufe, Symbolfarben, weiße Hover-Rahmen und die Prioritätssortierung bleiben erhalten.

Release-Assets: `main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.7.0**, Zielbranch: **main**.

## 1.6.1

- Statusspalten umgeordnet: ToDo, In Progress, Waiting, Done, Anpassungen Planner.
- Anpassungen Planner steht damit ganz rechts.

Release-Assets: `main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.6.1**, Zielbranch: **main**.

## 1.6.0

- Anpassungen Planner als neuen Status und als zusätzliche Priorität ergänzt.
- Verfügbar in beiden Boards, Auswahlfeldern, Aufgaben- und Vorlageneditor sowie im Dashboard.
- Türkise Gestaltung mit Einstellregler-Symbol und weißem Hover-Rahmen.
- Die Priorität Anpassungen Planner folgt in der Statussortierung auf low.
- Bestehende Aufgaben und Prioritäten bleiben erhalten; die Done-Regeln gelten weiterhin.

Release-Assets: `main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.6.0**, Zielbranch: **main**.

## 1.5.3

- Aufgaben innerhalb jeder Statusspalte sind nach Priorität sortiert: immediately, high, mid, low.
- Bei gleicher Priorität entscheidet weiterhin das Fälligkeitsdatum, Aufgaben ohne Datum stehen dahinter.
- Prioritätsänderungen und das Verschieben zwischen Statusspalten aktualisieren die Reihenfolge automatisch.

Release-Assets: `main.js`, `manifest.json` und `styles.css` einzeln anhängen. Tag: **1.5.3**, Zielbranch: **main**.

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
