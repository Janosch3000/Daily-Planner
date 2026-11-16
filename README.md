# Daily Planner for Obsidian

Version **1.9.0** · Tasks and projects with expandable cards, subtask checkboxes, due times, a week/month calendar, templates, recurring tasks and Trash.

## Install or update with BRAT

In Obsidian, open **BRAT → Add Beta plugin** and enter `Janosch3000/Daily-Planner`. Enable **Daily Planner** under Community plugins. Open it using the ribbon icon or the **Open Daily Planner** command.

For updates, check for plugin updates in BRAT, then reload the plugin or restart Obsidian. Existing data is preserved. The plugin ID and data location remain `tagesplaner`; changing the display name does not create a second installation.

## Cards and subtasks

Collapsed cards show the title, small priority/status/project labels, due date and optional time, a two-line description preview and all subtasks. Check or uncheck a subtask directly on the collapsed card. Changes are saved immediately and reflected in both Status and Priorities, project views, statistics and calendar entries. Archived subtasks are read-only.

**Show More** expands the full description, activity history and available creation/completion/archive information. Waiting details appear there as well. **Show Less** collapses the card again. Expansion is preserved while switching between task boards and during updates in the same view; it is not a saved preference across restarts.

**Edit** opens the task dialog for title, description, priority, status, project, dates, time, recurrence, subtasks and activity. New activity is appended when changes are saved. Drag the card by its title to change status on the Status board or priority on the Priorities board. Inline priority/status selectors are intentionally absent.

Statuses are **ToDo**, **In Progress**, **Waiting**, **Done**. Priorities are **low**, **mid**, **high**, **immediately**. Status columns put higher priorities first, then earlier due dates and times. Done tasks are excluded from Priorities and return when reopened. Coloured card borders turn white on hover.

## Due dates and times

In **Edit → Due date** and **Due time**, set an optional local time using a 24-hour value such as `09:30`. A time requires a date. Selecting a time on a new task supplies today's date if none is set. Clearing the time keeps the date and makes the task all-day again. Existing tasks without times remain all-day; no midnight deadline is invented.

The time appears on the card, calendar entry and upcoming dashboard list. Calendar days show all-day entries first, then timed tasks in chronological order, using priority for equal times. A timed task becomes overdue when its local due time arrives. An all-day task becomes overdue on the next day. The open interface updates during the regular minute checks.

Dragging a task to another calendar day preserves its time. Rescheduling a subtask or follow-up changes only that item's date. These are date-only entries; this version adds due times to main tasks. Times use the device's local timezone, including its daylight-saving rules, and are not fixed UTC appointments. The calendar is a dated event list, not an hourly duration grid.

Templates and recurrence defaults also preserve due times. A timed template without a relative date uses creation day. New recurring tasks inherit the saved time. Editing a recurring task's defaults affects future occurrences; dragging an existing calendar entry changes that occurrence only.

## Week and month calendar

**Calendar** replaces the old Today page. **Week** starts on Monday; **Month** includes adjacent dates to complete the grid. Use the arrows, **Today**, or the date input to navigate. Scroll horizontally on narrow screens.

Entries cover open task dates, open subtask dates and follow-ups for Waiting tasks. Their type and optional time are shown. A task can have several entries. Click one to edit its task, or drag it to a date to reschedule that specific entry. Done, archived and deleted tasks are excluded.

**Overdue** and **No due date** below the grid remain accessible regardless of the displayed period. Search and status/priority/project filters apply to the grid and these lists together. Completed subtasks no longer create open calendar entries.

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

**Delete permanently** opens a confirmation. Only confirming it removes the task's contents permanently. Trash is not emptied automatically. Deleting one recurring occurrence does not pause the series. Manage the series under **Calendar → Recurrences**. A minimal series/date key remains after permanent deletion to prevent recreating that occurrence; it contains no task content.

Done tasks enter **Archive** after 24 elapsed hours, with their subtasks and activity. **Reopen** returns them to ToDo. Historical Done tasks without completion dates receive an estimated date when first loaded and are excluded from retrospective completion charts.

## Reminders and Waiting

Waiting tasks support a person/team and a follow-up date. The values survive status changes, but a follow-up is an open calendar entry only while the task is Waiting.

Under **Calendar → Reminders**, enable notifications and choose 0, 1, 3 or 7 days of advance notice. The default is one day. Project reminder settings are respected. With zero advance notice, a timed task waits for its due time; all-day reminders remain date-based. With advance notice, a timed task can receive an upcoming reminder and another when its due time arrives. Each phase is limited to once per calendar day and remains deduplicated after restart. **Check now** may repeat eligible reminders explicitly.

Checks run on loading/opening and every minute while the plugin is loaded. Obsidian must be open and the plugin enabled; there are no background system notifications. Hidden projects can retain reminders independently; open those tasks in Projects.

## Templates and recurring tasks

Use **+ Template** next to **+ Task** to create a named template. Templates store an optional title, description, initial status, priority, project, relative dates, due time, subtasks and recurrence rules. Enter adds a subtask row without saving prematurely.

Use **+ Task → Create task from template** to choose a template. An independent task is created and immediately opened for editing. Cancelling that edit dialog keeps the already-created task; use Delete if it was created accidentally. Editing or deleting templates does not change tasks already created from them.

Recurrences can be daily, weekly or monthly, with an interval of 1–365 and a required due date. Each occurrence has independent IDs, open subtasks and an empty activity history. Monthly recurrences handle short months and restore the original day in later months.

Manage series under **Calendar → Recurrences**, even after their source tasks are archived or deleted. Pausing stops generation; resuming skips paused periods. Active offline periods are caught up, up to 100 steps per maintenance pass. Tasks and recurrence progress are saved together, with retry on failure.

## Language, search and data

All plugin-owned interface text, commands, dialogs, reminders and errors are English. Existing user-written task titles, descriptions, projects, templates and activity are preserved in their original language. Date/time picker controls supplied by Obsidian or the operating system can follow its locale.

Search matches task titles, descriptions, subtasks, activity, waiting people and project names. Multiple words must all match. Combine status, priority, date and project filters. **Reset filters** clears them.

Data is stored locally in `<Vault>/.obsidian/plugins/tagesplaner/data.json`. Keep personal data out of the public repository. Back up that file before downgrading; older versions do not understand Trash, visibility options or times.

## Create release 1.9.0

Create a GitHub release with tag **1.9.0**, target **main**, title **Daily Planner 1.9.0**. Attach these files individually:

- `main.js`
- `manifest.json`
- `styles.css`

A ZIP or the automatically generated source archives alone are not sufficient for BRAT. `versions.json` stays in the repository. No additional build is needed; `main.js` is the directly loadable CommonJS file without extra runtime dependencies.
