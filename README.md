# Daily Planner for Obsidian

Version **1.16.0** · Tasks and projects with continuous weekly tasks, weekday selection, start/end schedules, resizable calendar blocks, templates and Trash.

## Install or update with BRAT

In Obsidian, open **BRAT → Add Beta plugin** and enter `Janosch3000/Daily-Planner`. Enable **Daily Planner** under Community plugins. Open it using the ribbon icon or the **Open Daily Planner** command.

For updates, check for plugin updates in BRAT, then reload the plugin or restart Obsidian. Existing data is preserved. The plugin ID and data location remain `tagesplaner`; changing the display name does not create a second installation.

## Central settings

Open the **Settings** gear tile on Home, **Tools → Settings**, or the **Open settings** command. Search across categories, edit preferences, then choose **Save settings**. **Discard changes**, **Reset this section** and **Reset all settings** are separate actions. Unsaved appearance changes affect the example card only. Existing task content is not rewritten when defaults change.

- **Home:** hide and reorder all tool cards, show/hide the overview and upcoming preview, choose 1–20 preview tasks and a 1–365-day horizon, and set the tile column count. Settings remains accessible even if other tiles are hidden.
- **Tasks:** default priority, status and optional project; compact cards and collapsed subtask visibility. New-task defaults also apply to new templates; applying an existing template still uses its saved values.
- **Calendar:** default Week/Month, week starting Monday/Sunday/Saturday, weekend visibility, first/last visible hour, 5/10/15/30/60-minute snap and resize steps, default appointment length and hour height. Visible hours crop Week only; out-of-hours entries remain in Month and Edit. Heights remain proportional to actual durations.
- **Recurrence:** default none/daily/weekly/monthly, weekday and interval. A new recurring-task shortcut uses Weekly when the default is None. Existing rules remain unchanged.
- **Reminders:** global enabled state, 0–30 days of advance notice and separate task, subtask and Waiting-follow-up switches. Existing enabled/lead settings migrate unchanged. Project-specific reminder permissions continue to apply.
- **Archive & Trash:** enable/disable automatic archiving and choose hours after Done; enable/disable archive deletion and choose calendar-month retention; optionally clean Trash after a selected number of days. Defaults remain 24 hours, two calendar months, and no automatic Trash cleanup. These rules apply to existing eligible records on the next maintenance pass.
- **Appearance:** inherited/light/dark theme; compact/comfortable/spacious spacing; inherited/system/serif/monospace font; interface, task-title, description and preview text sizes; line height; card padding, gap, radius and borders; board width and gaps; tile size and radius; icon size; button height and control rounding; background colour strength and shadows; hover outline and brightness; animations; description and metadata visibility; accent, four status colours and four priority colours. The live preview demonstrates card appearance before saving. Reduced-motion system preferences remain respected.
- **Navigation:** mouse Back / Alt+Left and the default expanded sidebar state.
- **New projects:** default project-only visibility, dashboard inclusion and reminder permission. Saved projects retain their own settings.
- **Data & backup:** export all plugin data to JSON, create a vault backup, review/import JSON, choose whether a successful backup is required before import, and reset settings separately from content.

### Backups and importing

**Export all data** downloads a complete JSON file. Vault backups are stored under the vault's configuration folder, normally `.obsidian/plugins/tagesplaner/backups/`. They contain personal task data and should not be added to a public repository. Manual backups and exports are not automatically purged.

Choose a JSON backup (up to 20 MB) or paste JSON, then **Review import**. A dialog shows task/project/template counts and requires **Import and replace data**. Import replaces the full plugin dataset. With the default backup option enabled, a backup write must succeed before replacement; a failure cancels the import. Invalid data and unsupported future versions are rejected. Settings reset never deletes tasks, projects, templates or history.

Version 1.16.0 uses **data schema 4**. Earlier plugin versions refuse this format, protecting customised retention rules from being ignored by an older release. Keep a backup before updating or downgrading.

## Home page

Opening Daily Planner with the ribbon or **Open Daily Planner** command opens **Home**. Large cards with coloured line icons lead to Tasks, Recurring tasks, Calendar, Projects, Dashboard, Templates, Archive and Trash. Cards also open Settings, recurrence management and central reminder preferences. Cards show short descriptions and live counts where relevant.

Inside a tool, a large **Home** button at the top left returns here. **Tools** beside it expands a left sidebar for switching tools; selecting a tool closes it. The sidebar overlays the content on narrow panels. The plugin title and tagline are no longer rendered inside the planner. Home uses the full available content width and has no navigation header. Home itself has no Home button, sidebar toggle or task/template creation shortcuts. Within the planner content, the mouse Back button (button 3) returns from a tool to Home. Alt+Left is supported as well. The handler prevents the native Back action for the handled event sequence and is removed when the view closes; unrelated mouse buttons and Back on Home keep their normal behavior. Browser/Obsidian history is not modified. **+ Task** is available in Tasks, Calendar and Projects; **+ Recurring task** appears in Recurring tasks; **+ Template** appears only in Templates. Home, Dashboard, Archive and Trash have no task/template creation shortcuts. Creating a task from a template remains available in the task dialog. Switching through Home preserves task drafts, filters and board selections. Direct commands such as Open dashboard still open their named view. Home places a compact dashboard to the left of the tool cards and a Next up preview to their right. The dashboard shows open work, In Progress, due today, completed work in the last seven days, overdue/waiting counts and a small completion chart; project-only and dashboard-excluded tasks are omitted. Next up shows up to six distinct open tasks with scheduled ranges within the next 60 days, ordered by their start; completed, deleted, archived and project-only tasks are excluded. Weekly routines appear only once using their next occurrence. Preview clicks enter the task’s tool before opening Edit. With no upcoming tasks, a helpful empty state appears. The columns stack as the panel narrows, and tool cards adapt from two to one column and support keyboard navigation and the shared white hover/focus outline.

## Interaction feedback

Interactive controls throughout Daily Planner receive a subtle white outline on hover and keyboard focus: buttons, tabs, calendar events and resize handles, draggable task headings, fields, selects, checkbox labels and expandable sections. Disabled controls remain inactive. The outline does not change control sizes or calendar tile durations, and is scoped to this plugin and its dialogs.

## Separate recurring task boards

**Tasks** shows regular tasks. **Recurring tasks** is a separate category for tasks linked to daily, weekly or monthly series, including paused series. Both categories have independent **Status** and **Priorities** boards, with the same editing, subtasks, activity, drag/drop, filters and Trash actions. Done tasks stay out of priority boards as before.

Use **+ Recurring task** from the new view to open the creation dialog with Weekly selected; change the rule, weekday and dates before saving. Choosing No recurrence on a new task creates a regular task instead. Existing recurring tasks appear in the new category automatically, without copying or resetting them. **Manage recurrences** opens rule settings directly.

In Projects, regular tasks occupy the boards and recurring tasks appear in their own separate section. This preserves access to routines in project-only projects. Project visibility settings and filters remain respected. Calendar, dashboard totals, Archive and Trash continue to include both categories; weekly calendar entries still share one task.

Pausing or choosing No recurrence on an existing recurring task pauses its series; the task stays in Recurring tasks so it remains easy to find and resume. Historical weekly copies detached by the 1.12 migration remain independent regular tasks.

## Cards and subtasks

Collapsed cards show the title, small priority/status/project labels, due date and optional time, a two-line description preview and all subtasks. Check or uncheck a subtask directly on the collapsed card. Changes are saved immediately and reflected in both Status and Priorities, project views, statistics and calendar entries. Add a subtask directly in the card’s **New subtask…** field, then press **+** or Enter. Remove any subtask with its trash icon, including completed subtasks. These controls remain available when the card is collapsed and work in regular, recurring and project views. Draft text survives board changes and failed saves; repeated submissions do not create duplicates. Archived subtasks are read-only.

**Show More** expands the full description, activity history and available creation/completion/archive information. Waiting details appear there as well. **Show Less** collapses the card again. Expansion is preserved while switching between task boards and during updates in the same view; it is not a saved preference across restarts.

**Edit** opens the task dialog for title, description, priority, status, project, dates, time, recurrence, subtasks and activity. New activity is appended when changes are saved. Drag the card by its title to change status on the Status board or priority on the Priorities board. Inline priority/status selectors are intentionally absent.

Statuses are **ToDo**, **In Progress**, **Waiting**, **Done**. Priorities are **low**, **mid**, **high**, **immediately**. Status columns put higher priorities first, then earlier due dates and times. Done tasks are excluded from Priorities and return when reopened. Coloured card borders turn white on hover.

## Drag tasks between the calendar and No due date

**No due date** is a drop zone beside the calendar. It lists open, visible tasks without their own main end date. A task can be listed here even when one of its subtasks or its Waiting follow-up has a separate date. The list follows search/project/status/priority filters and excludes project-only, Done, archived and deleted tasks.

- Drag a task from this list into a weekly time slot to create a one-hour range starting at the selected time, snapped to the configured time grid. Resize or edit the range afterwards.
- Drop onto the weekly all-day row or a Month day cell to assign that date without inventing clock times.
- Drag a main task event back into No due date to clear its start date/time and end date/time. The task itself, its status, priority, project, description, subtasks and activity are kept.
- Drag a subtask or follow-up entry into the zone to remove only that entry's date. Other dates on the parent task remain unchanged. Removing a child's date does not put an otherwise scheduled parent into the unscheduled list.

The zone remains available when empty. During calendar-event dragging the valid target is highlighted. Releasing outside a valid target cancels the move. Clicking an entry still opens Edit; the dialog is also the alternative for assigning or clearing dates without dragging. On narrow panels the unscheduled list appears above the calendar.

For a weekly task, removing its main schedule pauses all weekly calendar entries. Scheduling the task again resumes the same shared task on the selected weekday. For daily and monthly recurrences, unscheduling one occurrence does not pause the series or change future defaults. Manage rules under Calendar → Recurrences.

## Start and end dates

In **Edit**, set **Start date**, **Start time**, **End date** and **End time**. Times use local 24-hour values. Both dates can differ, including overnight and multi-day tasks. The end must be after the start for timed tasks; all-day ranges include both boundary dates.

Entering a start time supplies an end one hour later if no complete end exists. Entering only an end time supplies a start one hour earlier, including the previous day when necessary. Leave both times empty for all-day scheduling. A date without times remains all-day.

Existing due dates and due times become end dates/times without changing the deadline. Existing timed tasks receive a one-hour start before that deadline. Existing all-day tasks remain all-day. Change the generated start in Edit if the task needs a different duration.

**The end remains the deadline** for overdue indicators, filters, dashboard dates and reminders. Start and end are scheduling boundaries, not work-effort estimates. Times follow the device's local timezone and daylight-saving rules rather than representing fixed UTC appointments.

Templates store relative start/end dates and both times. Recurrence defaults preserve the start's offset from the end, including negative offsets for overnight ranges. Moving or resizing any weekly calendar entry changes the shared weekly schedule, including its weekday and duration. Daily/monthly entries remain independent; editing one in its dialog updates future defaults, while moving or resizing it changes only that occurrence.

## Weekly timeline and month calendar

**Week** displays an hourly timeline from Monday to Sunday. All-day tasks, subtasks and follow-ups stay above the time grid. Time blocks are positioned by their starts and sized by their duration. The initial vertical position targets the first scheduled hour; subsequent scrolling is retained while the view is open.

Overlapping events use separate columns. Busy days widen to retain readable event titles. Every timed block has exactly the height of its duration, with no minimum height or artificial vertical gap. A 15-minute task is one quarter of an hour tall, and consecutive tasks touch at their shared time boundary. Scroll horizontally to reach the remaining weekdays on narrow screens. Timed blocks show only their title and time range. Tasks shorter than 30 minutes use one compact line; longer blocks put the time below the title. Long titles are clipped to the available space. Click to open all details, or hover for the full title, range and project. Month and all-day entries retain their metadata.

**Move:** drag a time block onto a date/time slot to move the whole range while preserving its duration. Dropping an all-day task into the time grid creates a one-hour timed range. Date-based moves, including in Month, preserve the existing times and number of days. Subtask and follow-up moves change only their own dates.

**Resize timed events:** in Week, drag the small top handle to change the start or the bottom handle to change the end. Changes snap to the configured time grid (15 minutes by default), with a minimum resized duration of one grid step. The time label previews the proposed range while dragging. Releasing saves it; cancelling the pointer gesture keeps the original schedule. Resize handles also support Arrow Up/Arrow Down for one-grid-step changes. Edit remains available as an alternative.

**Resize dates:** all-day entries and Month entries have small date handles. Drag the start or end handle onto another day to extend or shorten that boundary without moving the other one. Clicking a date handle opens Edit. Timed Month entries preserve their clocks while their dates change; use Week or Edit for precise time adjustments.

Multi-day timed tasks are split across day columns with continuation arrows. A range ending exactly at midnight does not add an empty block on the following day. All-day ranges include their end day. All-day dates and time blocks refer to the same underlying task; clicking an entry opens that task.

**Month** uses larger day cells and more space between entries. Use the arrows, **Today**, or the date input to navigate. Search and status/priority/project filters apply to the calendar and the **Overdue** / **No due date** lists below it. Done, archived, deleted and project-only tasks remain excluded from the general calendar. Completed subtasks no longer create calendar entries.

Resizing validates that the task is still open and that its schedule has not changed in another dialog. Failed saves restore the original range. A task deleted or archived during an interaction cannot be resized.


## Projects and visibility

Assign tasks and templates to a project or **No project**. In **Projects**, choose one project, **All projects**, or unassigned tasks. Status/Priorities boards, project progress and the project archive are available there.

Under **Edit project → Visibility**, configure these independently:

- **Show only in project view** excludes its tasks from general boards, Calendar and the general archive. The project view remains fully editable. A general board's project filter does not override this setting.
- **Include in dashboard** controls counts, distributions, due dates, completions and activity in the general dashboard.
- **Enable reminders for this project** controls task, subtask and follow-up notifications.

New projects are visible and included everywhere. The previous exception for the project named “Anpassungen Planer” migrates to these settings: project view only, excluded from dashboard, reminders enabled. After migration the options are independent of the name and survive renaming.

Removing a project preserves tasks, templates and future recurrence defaults, changing only their project assignment to No project.

## Trash and archive

**Delete** on a card or in the edit dialog moves the saved task to **Trash**. Its description, project, dates, time, subtasks and activity are retained. It disappears from active views, project progress, dashboard and reminders. Deleted tasks are not automatically archived.

Trash shows every deleted task, including hidden projects, regardless of task filters. **Restore** restores the previous values. Previously archived tasks remain archived; hidden-project tasks remain in project views. A restored Done task retains its completion time and may therefore qualify for automatic archiving.

**Delete permanently** opens a confirmation. Only confirming it removes the task's contents permanently. Trash is not emptied automatically unless you enable its retention rule in Settings. Deleting a shared weekly task pauses its rule and removes every projected entry. Restore resumes it if it was active before deletion; permanent deletion also removes its weekly rule. Deleting one daily/monthly occurrence does not pause that series. A minimal series/date key remains after permanent deletion of a daily/monthly occurrence to prevent recreating it; it contains no task content.

By default, Done tasks enter **Archive** after 24 elapsed hours, with their subtasks and activity. By default, archived tasks are **permanently deleted two calendar months after their archivedAt timestamp**, including all task content, subtasks and activity, without passing through Trash. The same local day/time is used; if the target month lacks that day, its last day is used. This applies to existing archived tasks and project archives, regardless of filters or project visibility. Cleanup runs on startup/opening and every minute while the plugin is loaded; overdue cleanup is performed the next time Obsidian runs. Reopened tasks are no longer archived and are not deleted; archiving them again starts a new retention period. Tasks currently in Trash are excluded. Failed saves roll the cleanup back and are retried. A minimal daily/monthly recurrence ID/date tombstone prevents deleted occurrences from being regenerated, while independent series continue; a deleted weekly owner’s rule is removed. **Reopen** returns them to ToDo. Historical Done tasks without completion dates receive an estimated date when first loaded and are excluded from retrospective completion charts.

## Reminders and Waiting

Waiting tasks support a person/team and a follow-up date. The values survive status changes, but a follow-up is an open calendar entry only while the task is Waiting.

Under **Settings → Reminders** (also reachable via Calendar → Reminders), enable notifications and choose 0–30 days of advance notice. The default is one day. Project reminder settings are respected. With zero advance notice, a timed task waits for its due time; all-day reminders remain date-based. With advance notice, a timed task can receive an upcoming reminder and another when its due time arrives. Each phase is limited to once per calendar day and remains deduplicated after restart. **Check now** may repeat eligible reminders explicitly.

Checks run on loading/opening and every minute while the plugin is loaded. Reminder types can be enabled independently in central settings. Obsidian must be open and the plugin enabled; there are no background system notifications. Hidden projects can retain reminders independently; open those tasks in Projects.

## Templates and recurring tasks

Open **Templates → + Template** to create a named template. Templates store an optional title, description, initial status, priority, project, relative dates, due time, subtasks and recurrence rules. Enter adds a subtask row without saving prematurely.

Use **+ Task → Create task from template** to choose a template. An independent task is created and immediately opened for editing. Cancelling that edit dialog keeps the already-created task; use Delete if it was created accidentally. Editing or deleting templates does not change tasks already created from them.

### Continuous weekly tasks

In the task dialog, choose **Recurrence → Weekly**, then select **Weekly weekday**, for example **Friday**. Set the interval to 1 for every week, or a larger number for every N weeks. Optionally set **First weekly occurrence**. Leave it empty to start on the next selected weekday, including today. Weekly mode does not require a due date or a start/end date range. Each all-day entry occupies one day only. Optional start/end times define one occurrence; an earlier end clock means the following morning.

Weekly recurrence uses **one continuously open task**. It appears on the selected weekday in every future week, including months viewed far ahead, without creating task copies. There is no end date for the series. Weekly mode hides the ordinary start/end date fields and uses its optional first-occurrence field instead. Dates never create a continuous all-day range between weekly entries. Older long weekly ranges are repaired on loading without changing task IDs or content.

All calendar entries share the same title, description, priority, project, subtasks and activity. Completing a subtask changes it everywhere; it does not reset next week. The Tasks board and dashboard count the shared task once. Old weekly dates do not make it permanently overdue. Reminders distinguish individual upcoming weekly dates.

Under **Calendar → Recurrences**, edit **Weekday**, **Every … weeks** and **First occurrence**, then choose **Save weekly rule**. You can also pause/resume the rule or open its task. Moving or resizing a weekly calendar entry changes the shared rule. To mark the task Done, pause its weekly recurrence first; active weekly tasks stay open.

Existing weekly series migrate to this shared model. The newest open task becomes its owner; older copies and completed history are preserved as independent tasks. If only completed history exists, one open owner is created without changing those completed tasks. Deleted-only series remain paused.

### Daily and monthly tasks

Daily and monthly recurrences retain independent occurrences with their own IDs, open subtasks and empty activity history. Both require an initial date and support intervals of 1–365. Monthly recurrences handle short months and restore the original day later.

Manage these series under **Calendar → Recurrences**, even after source tasks are archived or deleted. Pausing stops generation; resuming skips paused periods. Active offline periods are caught up, up to 100 steps per maintenance pass. Tasks and recurrence progress are saved together, with retry on failure.

## Language, search and data

All plugin-owned interface text, commands, dialogs, reminders and errors are English. Existing user-written task titles, descriptions, projects, templates and activity are preserved in their original language. Date/time picker controls supplied by Obsidian or the operating system can follow its locale.

Search matches task titles, descriptions, subtasks, activity, waiting people and project names. Multiple words must all match. Combine status, priority, date and project filters. **Reset filters** clears them.

Data is stored locally in `<Vault>/.obsidian/plugins/tagesplaner/data.json`. Keep personal data out of the public repository. Version 1.16.0 uses data schema 4 for central preferences and retention rules. Back up this file before updating or downgrading. Earlier releases with schema guards refuse newer data to prevent overwriting it; use a matching backup if returning to an older release.

## Create release 1.16.0

Create a GitHub release with tag **1.16.0**, target **main**, title **Daily Planner 1.16.0**. Attach these files individually:

- `main.js`
- `manifest.json`
- `styles.css`

A ZIP or the automatically generated source archives alone are not sufficient for BRAT. `versions.json` stays in the repository. No additional build is needed; `main.js` is the directly loadable CommonJS file without extra runtime dependencies.
