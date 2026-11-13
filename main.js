const { Plugin, ItemView, Modal, Notice } = require('obsidian');
const VIEW = 'tagesplaner-view';
const DAY = 86400000;
const COLS = [
  { name: 'ToDo', key: 'open', icon: 'square', glyph: '☐' }, { name: 'In Progress', key: 'progress', icon: 'construction', glyph: '🚧' },
  { name: 'Waiting', key: 'waiting', icon: 'clock', glyph: '◷' },
  { name: 'Done', key: 'done', icon: 'square-check', glyph: '☑' },
  { name: 'Anpassungen Planner', key: 'planner', icon: 'sliders', glyph: '⚙' }
];
const PRIORITIES = [
  { name: 'low', key: 'low', icon: 'arrow-down', glyph: '↓', rank: 1 }, { name: 'mid', key: 'mid', icon: 'arrow-right', glyph: '→', rank: 2 },
  { name: 'high', key: 'high', icon: 'arrow-up', glyph: '↑', rank: 3 }, { name: 'immediately', key: 'immediately', icon: 'arrows-up', glyph: '⇈', rank: 4 },
  { name: 'Anpassungen Planner', key: 'planner', icon: 'sliders', glyph: '⚙', rank: 0 }
];
const LEGACY_STATUS = Object.freeze({
  'Offen': 'ToDo', 'In Bearbeitung': 'In Progress',
  'Warten auf Person': 'Waiting', 'Delayed': 'Waiting', 'Fertig': 'Done'
});
const copy = value => JSON.parse(JSON.stringify(value));
const uid = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);
const stamp = value => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
const SYMBOLS = {
  sliders: [['path', { d: 'M4 6h5m4 0h7M4 12h9m4 0h3M4 18h2m4 0h10' }], ['circle', { cx: 11, cy: 6, r: 2 }], ['circle', { cx: 15, cy: 12, r: 2 }], ['circle', { cx: 8, cy: 18, r: 2 }]],
  square: [['rect', { x: 4, y: 4, width: 16, height: 16, rx: 3 }]],
  'square-check': [['rect', { x: 4, y: 4, width: 16, height: 16, rx: 3 }], ['path', { d: 'M8 12l3 3 5-6' }]],
  clock: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', { d: 'M12 7v5l3 2' }]],
  construction: [['rect', { x: 3, y: 7, width: 18, height: 8, rx: 1.5 }], ['path', { d: 'M7 7l4 8m3-8l4 8M6 15v5m12-5v5' }]],
  'arrow-down': [['path', { d: 'M12 4v16m-6-6 6 6 6-6' }]],
  'arrow-right': [['path', { d: 'M4 12h16m-6-6 6 6-6 6' }]],
  'arrow-up': [['path', { d: 'M12 20V4m-6 6 6-6 6 6' }]],
  'arrows-up': [['path', { d: 'M6 14l6-6 6 6M6 20l6-6 6 6' }]]
};
function addSymbol(parent, definition) {
  const wrapper = parent.createSpan({ cls: 'tp-symbol tp-symbol-' + definition.key });
  wrapper.setAttribute('aria-hidden', 'true'); wrapper.setAttribute('data-icon', definition.icon);
  const doc = wrapper.ownerDocument, ns = 'http://www.w3.org/2000/svg';
  const svg = doc.createElementNS(ns, 'svg');
  for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.9', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', focusable: 'false' })) svg.setAttribute(key, value);
  for (const [tag, attrs] of SYMBOLS[definition.icon]) {
    const shape = doc.createElementNS(ns, tag); for (const [key, value] of Object.entries(attrs)) shape.setAttribute(key, String(value)); svg.appendChild(shape);
  }
  wrapper.appendChild(svg); return wrapper;
}
function symbolLabel(parent, definition, cls = '') {
  const label = parent.createSpan({ cls: 'tp-symbol-label ' + cls }); addSymbol(label, definition); label.createSpan({ text: definition.name }); return label;
}
function priorityBadge(parent, priority) {
  const definition = PRIORITIES.find(p => p.name === priority) || PRIORITIES[1];
  return symbolLabel(parent, definition, 'tp-priority-tag tp-priority-' + definition.key);
}
function statusBadge(parent, status) {
  const definition = COLS.find(c => c.name === status) || COLS[0];
  return symbolLabel(parent, definition, 'tp-status-tag tp-' + definition.key);
}
function dayKey(value = Date.now()) {
  const d = new Date(value);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
function dateKeyValid(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && dayKey(new Date(value + 'T12:00:00').getTime()) === value;
}
function shortDate(key) { return new Date(key + 'T12:00:00').toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' }); }
function timeText(value) { return new Date(value).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' }); }
function shiftDay(value, days) { const d = new Date(value); d.setDate(d.getDate() + days); return d.getTime(); }
const REPEAT_OPTIONS = [
  { value: 'none', label: 'Keine Wiederholung' }, { value: 'daily', label: 'Täglich' },
  { value: 'weekly', label: 'Wöchentlich' }, { value: 'monthly', label: 'Monatlich' }
];
const validDate = value => dateKeyValid(value) ? value : '';
const offsetDays = value => value !== '' && value != null && Number.isInteger(Number(value)) && Math.abs(Number(value)) <= 3650 ? Number(value) : null;
function shiftDate(key, days) { return dayKey(shiftDay(new Date(key + 'T12:00:00').getTime(), days)); }
function daysBetween(start, end) { return Math.round((Date.parse(end + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) / DAY); }
function repeatRule(value = {}) {
  return {
    frequency: REPEAT_OPTIONS.some(r => r.value === value?.frequency) ? value.frequency : 'none',
    interval: Number.isInteger(Number(value?.interval)) && Number(value.interval) >= 1 && Number(value.interval) <= 365 ? Number(value.interval) : 1
  };
}
function nextOccurrence(key, rule, anchorDay = Number(key.slice(-2))) {
  if (!dateKeyValid(key) || !['daily', 'weekly', 'monthly'].includes(rule.frequency)) return '';
  if (rule.frequency !== 'monthly') return shiftDate(key, rule.interval * (rule.frequency === 'weekly' ? 7 : 1));
  const [year, month] = key.split('-').map(Number), target = new Date(year, month - 1 + rule.interval, 1, 12);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12).getDate();
  target.setDate(Math.min(anchorDay, last)); return dayKey(target.getTime());
}
function projectName(data, id) { return data.projects.find(p => p.id === id)?.name || 'Kein Projekt'; }
function taskDefaults(task, baseDate = task.due || dayKey()) {
  return {
    title: task.title, note: task.note || '', status: task.status === 'Done' ? 'ToDo' : task.status,
    priority: task.priority, projectId: task.projectId || null, waitingFor: task.waitingFor || '',
    followUpInDays: validDate(task.followUpDate) ? daysBetween(baseDate, task.followUpDate) : null,
    subtasks: task.subtasks.map(s => ({ title: s.title, dueInDays: validDate(s.due) ? daysBetween(baseDate, s.due) : null }))
  };
}
function recurringTask(series, date, now) {
  const d = series.defaults;
  return {
    id: uid(), title: d.title, note: d.note, status: d.status, priority: d.priority, projectId: d.projectId,
    due: date, waitingFor: d.waitingFor, followUpDate: d.followUpInDays == null ? '' : shiftDate(date, d.followUpInDays),
    subtasks: d.subtasks.map(s => ({ id: uid(), title: s.title, done: false, due: s.dueInDays == null ? '' : shiftDate(date, s.dueInDays) })),
    worklog: [], recurrenceId: series.id, occurrenceDate: date,
    createdAt: now, updatedAt: now, completedAt: null, archivedAt: null, completionDateEstimated: false
  };
}
function resumeSeries(series, today = dayKey()) {
  if (!dateKeyValid(series.nextDate)) throw new Error('Bitte zuerst einen nächsten Serientermin setzen.');
  if (series.nextDate < today && series.frequency !== 'monthly') {
    const step = series.interval * (series.frequency === 'weekly' ? 7 : 1);
    series.nextDate = shiftDate(series.nextDate, Math.ceil(daysBetween(series.nextDate, today) / step) * step);
  } else {
    while (series.nextDate < today) {
      const next = nextOccurrence(series.nextDate, series, series.anchorDay);
      if (!dateKeyValid(next) || next <= series.nextDate) throw new Error('Die Wiederholung benötigt einen gültigen Termin.');
      series.nextDate = next;
    }
  }
  series.enabled = true;
}
function configureRecurrence(data, task, rule, now = Date.now()) {
  const config = repeatRule(rule), existing = data.recurrences.find(s => s.id === task.recurrenceId);
  if (config.frequency === 'none') { if (existing) existing.enabled = false; return; }
  if (!dateKeyValid(task.due)) throw new Error('Wiederholende Aufgaben benötigen ein Fälligkeitsdatum.');
  if (existing) {
    const wasPaused = !existing.enabled;
    const changed = existing.frequency !== config.frequency || existing.interval !== config.interval;
    Object.assign(existing, config, { enabled: true, defaults: taskDefaults(task), updatedAt: now });
    if (changed || !dateKeyValid(existing.nextDate)) { existing.anchorDay = Number(task.due.slice(-2)); existing.nextDate = nextOccurrence(task.due, config, existing.anchorDay); }
    if (wasPaused) resumeSeries(existing, dayKey(now));
  } else {
    const series = { id: uid(), ...config, enabled: true, anchorDay: Number(task.due.slice(-2)), defaults: taskDefaults(task), nextDate: nextOccurrence(task.due, config), createdAt: now, updatedAt: now };
    data.recurrences.push(series); task.recurrenceId = series.id; task.occurrenceDate = task.due;
  }
}
function generateRecurring(data, now = Date.now(), limit = 100) {
  const today = dayKey(now), occupied = new Set(data.tasks.filter(t => t.recurrenceId && t.occurrenceDate).map(t => t.recurrenceId + ':' + t.occurrenceDate));
  let generated = 0, steps = 0, changed = false;
  for (const series of data.recurrences) {
    while (series.enabled && dateKeyValid(series.nextDate) && series.nextDate <= today && steps < limit) {
      steps++; const date = series.nextDate, key = series.id + ':' + date;
      if (!occupied.has(key)) { data.tasks.push(recurringTask(series, date, now)); occupied.add(key); generated++; }
      const next = nextOccurrence(date, series, series.anchorDay);
      if (!dateKeyValid(next) || next <= date) { series.enabled = false; changed = true; break; }
      series.nextDate = next; changed = true;
    }
  }
  return { generated, changed };
}
function attentionEntries(data) {
  const entries = [];
  for (const task of data.tasks) {
    if (task.archivedAt || task.status === 'Done') continue;
    if (task.due) entries.push({ task, kind: 'task', date: task.due, label: 'Aufgabe fällig', key: 'task:' + task.id + ':' + task.due });
    for (const s of task.subtasks) if (!s.done && s.due) entries.push({ task, kind: 'subtask', subtaskId: s.id, date: s.due, label: 'Unteraufgabe: ' + s.title, key: 'subtask:' + task.id + ':' + s.id + ':' + s.due });
    if (task.status === 'Waiting' && task.followUpDate) entries.push({ task, kind: 'followup', date: task.followUpDate, label: 'Nachfragen bei ' + (task.waitingFor || 'offener Rückmeldung'), key: 'followup:' + task.id + ':' + task.followUpDate });
  }
  return entries;
}
function taskMatches(task, filters, data, now = Date.now()) {
  if (filters.status && task.status !== filters.status) return false;
  if (filters.priority && task.priority !== filters.priority) return false;
  if (filters.project && filters.project !== 'all' && (filters.project === 'none' ? !!task.projectId : task.projectId !== filters.project)) return false;
  const words = String(filters.query || '').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const text = [task.title, task.note, task.waitingFor, projectName(data, task.projectId), ...task.subtasks.map(s => s.title), ...task.worklog.map(e => e.text)].join(' ').toLocaleLowerCase();
  if (!words.every(word => text.includes(word))) return false;
  const dates = [task.due, ...task.subtasks.filter(s => !s.done).map(s => s.due), task.status === 'Waiting' ? task.followUpDate : ''].filter(Boolean), today = dayKey(now);
  if (filters.due === 'today' && !dates.includes(today)) return false;
  if (filters.due === 'overdue' && !dates.some(d => d < today)) return false;
  if (filters.due === 'week' && !dates.some(d => d >= today && d <= shiftDate(today, 7))) return false;
  if (filters.due === 'none' && dates.length) return false;
  return true;
}
function templateFields(source = {}) {
  const offset = source.dueInDays;
  return {
    title: String(source.title || ''), note: String(source.note || ''),
    priority: PRIORITIES.some(p => p.name === source.priority) ? source.priority : 'mid',
    status: COLS.some(c => c.name === source.status && c.name !== 'Done') ? source.status : 'ToDo',
    projectId: source.projectId || null, waitingFor: String(source.waitingFor || ''),
    followUpInDays: offsetDays(source.followUpInDays), repeat: repeatRule(source.repeat),
    dueInDays: offset !== null && offset !== undefined && offset !== '' && Number.isInteger(Number(offset)) && Number(offset) >= 0 && Number(offset) <= 3650 ? Number(offset) : null,
    subtasks: Array.isArray(source.subtasks) ? source.subtasks.map(s => ({ title: String(s.title || '').trim(), dueInDays: offsetDays(s.dueInDays) })).filter(s => s.title) : []
  };
}
function normalize(raw, now = Date.now()) {
  if (raw && !Array.isArray(raw) && raw.schemaVersion > 2) throw new Error('Diese Daten benötigen eine neuere Tagesplaner-Version.');
  const source = Array.isArray(raw) ? { tasks: raw } : raw || {};
  if (source.tasks != null && !Array.isArray(source.tasks)) throw new Error('Das gespeicherte Aufgabenformat ist ungültig.');
  if (source.templates != null && !Array.isArray(source.templates)) throw new Error('Das gespeicherte Vorlagenformat ist ungültig.');
  if (source.projects != null && !Array.isArray(source.projects)) throw new Error('Das gespeicherte Projektformat ist ungültig.');
  if (source.recurrences != null && !Array.isArray(source.recurrences)) throw new Error('Das gespeicherte Wiederholungsformat ist ungültig.');
  const projects = (source.projects || []).map(p => {
    if (!p || typeof p !== 'object' || !String(p.name || '').trim()) throw new Error('Ein gespeichertes Projekt ist ungültig.');
    return { ...p, id: String(p.id || uid()), name: String(p.name).trim(), note: String(p.note || '') };
  });
  const projectIds = new Set(projects.map(p => p.id));
  const tasks = (source.tasks || []).map(t => {
    if (!t || typeof t !== 'object') throw new Error('Eine gespeicherte Aufgabe ist ungültig.');
    const incomingStatus = Object.prototype.hasOwnProperty.call(LEGACY_STATUS, t.status) ? LEGACY_STATUS[t.status] : t.status;
    const status = COLS.some(c => c.name === incomingStatus) ? incomingStatus : 'ToDo';
    return {
      ...t, id: String(t.id || uid()), title: String(t.title || 'Ohne Titel'), status,
      priority: PRIORITIES.some(p => p.name === t.priority) ? t.priority : 'mid',
      projectId: projectIds.has(t.projectId) ? t.projectId : null, waitingFor: String(t.waitingFor || ''), followUpDate: validDate(t.followUpDate),
      recurrenceId: t.recurrenceId ? String(t.recurrenceId) : null, occurrenceDate: validDate(t.occurrenceDate),
      due: dateKeyValid(t.due) ? t.due : '', note: String(t.note || ''),
      createdAt: stamp(t.createdAt), updatedAt: stamp(t.updatedAt),
      completedAt: status === 'Done' ? stamp(t.completedAt) || now : null,
      completionDateEstimated: status === 'Done' && (!!t.completionDateEstimated || !stamp(t.completedAt)),
      archivedAt: status === 'Done' ? stamp(t.archivedAt) : null,
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.map(s => ({ ...s, id: String(s.id || uid()), title: String(s.title || ''), done: !!s.done, due: validDate(s.due) })) : [],
      worklog: Array.isArray(t.worklog) ? t.worklog.map(e => ({ ...e, id: String(e.id || uid()), text: String(e.text || ''), at: stamp(e.at) || now })) : []
    };
  });
  const templates = (source.templates || []).map(t => {
    if (!t || typeof t !== 'object') throw new Error('Eine gespeicherte Vorlage ist ungültig.');
    return { id: String(t.id || uid()), name: String(t.name || 'Ohne Namen'), ...templateFields(t), projectId: projectIds.has(t.projectId) ? t.projectId : null, createdAt: stamp(t.createdAt), updatedAt: stamp(t.updatedAt) };
  });
  const recurrences = (source.recurrences || []).map(s => {
    if (!s || typeof s !== 'object') throw new Error('Eine gespeicherte Wiederholung ist ungültig.');
    const rule = repeatRule(s), d = templateFields(s.defaults || {});
    return { ...s, id: String(s.id || uid()), ...rule, enabled: !!s.enabled && rule.frequency !== 'none' && !!validDate(s.nextDate), nextDate: validDate(s.nextDate), anchorDay: Number(s.anchorDay) >= 1 && Number(s.anchorDay) <= 31 ? Number(s.anchorDay) : Number(String(s.nextDate || '').slice(-2)) || 1, defaults: { ...d, title: d.title || 'Wiederkehrende Aufgabe', projectId: projectIds.has(d.projectId) ? d.projectId : null } };
  });
  const reminders = source.reminderSettings || {};
  return {
    ...source, schemaVersion: 2, tasks, templates, projects, recurrences, settings: { ...source.settings },
    reminderSettings: { enabled: reminders.enabled !== false, leadDays: [0, 1, 3, 7].includes(Number(reminders.leadDays)) ? Number(reminders.leadDays) : 1 },
    reminderState: { day: validDate(source.reminderState?.day), seen: Array.isArray(source.reminderState?.seen) ? source.reminderState.seen.filter(k => typeof k === 'string') : [] }
  };
}
function setStatus(task, status, now = Date.now()) {
  if (!COLS.some(c => c.name === status)) throw new Error('Unbekannter Status.');
  if (task.status !== status) { task.completedAt = status === 'Done' ? now : null; task.completionDateEstimated = false; }
  task.status = status; task.archivedAt = null; task.updatedAt = now;
}
function archiveDue(data, now = Date.now()) {
  let changed = false;
  for (const task of data.tasks) {
    if (task.status === 'Done' && !task.archivedAt && task.completedAt && now - task.completedAt >= DAY) { task.archivedAt = now; changed = true; }
  }
  return changed;
}
function metrics(data, now = Date.now()) {
  const today = dayKey(now);
  const tasks = data.tasks, active = tasks.filter(t => !t.archivedAt && t.status !== 'Done'), done = tasks.filter(t => t.status === 'Done');
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = dayKey(shiftDay(now, i - 6));
    return { key, count: done.filter(t => !t.completionDateEstimated && t.completedAt && t.completedAt <= now && dayKey(t.completedAt) === key).length };
  });
  return {
    today, active, done, week,
    overdue: active.filter(t => t.due && t.due < today), dueToday: active.filter(t => t.due === today),
    inProgress: active.filter(t => t.status === 'In Progress'), waiting: active.filter(t => t.status === 'Waiting'),
    done7: week.reduce((n, d) => n + d.count, 0),
    done30: done.filter(t => !t.completionDateEstimated && t.completedAt && dayKey(t.completedAt) >= dayKey(shiftDay(now, -29)) && t.completedAt <= now).length,
    subtasks: tasks.reduce((n, t) => n + t.subtasks.length, 0), subtasksDone: tasks.reduce((n, t) => n + t.subtasks.filter(s => s.done).length, 0)
  };
}
function button(parent, text, handler, cls = '') {
  const b = parent.createEl('button', { text, cls, type: 'button' }); b.onclick = handler; return b;
}
function progress(parent, value, label) {
  const el = parent.createDiv('tp-meter'); el.setAttribute('role', 'progressbar'); el.setAttribute('aria-label', label);
  el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100'); el.setAttribute('aria-valuenow', String(Math.min(100, Math.max(0, value))));
  el.createDiv('tp-meter-fill').style.width = Math.min(100, Math.max(0, value)) + '%';
}

class TaskModal extends Modal {
  constructor(app, plugin, taskId = null, options = {}) {
    super(app); this.plugin = plugin; this.taskId = taskId; this.options = options;
    this.isTemplate = options.mode === 'template'; this.saving = false; this.subtaskRows = []; this.subtaskElements = new Map();
  }
  onOpen() {
    this.contentEl.empty(); this.contentEl.addClass('tp-modal');
    const savedTemplate = this.isTemplate ? this.plugin.data.templates.find(t => t.id === this.options.templateId) : null;
    const task = this.isTemplate ? savedTemplate || this.options.seedTask : this.plugin.data.tasks.find(t => t.id === this.taskId);
    this.originalStatus = task?.status || 'ToDo';
    const heading = this.isTemplate ? (savedTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage') : (task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe');
    this.contentEl.createEl('h2', { text: heading });
    const form = this.contentEl.createEl('form');
    const field = (text, tag, type, value) => {
      const label = form.createEl('label', { cls: 'tp-field', text });
      const input = label.createEl(tag, type ? { type } : {}); input.value = value == null ? '' : String(value); return input;
    };
    if (this.isTemplate) {
      this.nameInput = field('Name der Vorlage', 'input', 'text', savedTemplate?.name || task?.title || ''); this.nameInput.required = true;
    }
    this.titleInput = field(this.isTemplate ? 'Vorgabe für den Aufgabentitel · optional' : 'Aufgabe', 'input', 'text', task?.title); this.titleInput.required = !this.isTemplate;
    this.priorityInput = field('Priorität', 'select', null, '');
    PRIORITIES.forEach(p => this.priorityInput.createEl('option', { text: p.glyph + ' ' + p.name, value: p.name })); this.priorityInput.value = task?.priority || 'mid';
    this.statusInput = field(this.taskId ? 'Status' : 'Startstatus', 'select', null, '');
    const statusOptions = this.taskId && !this.isTemplate ? COLS : COLS.filter(c => c.name !== 'Done');
    statusOptions.forEach(c => this.statusInput.createEl('option', { text: c.glyph + ' ' + c.name, value: c.name }));
    this.statusInput.value = statusOptions.some(c => c.name === task?.status) ? task.status : 'ToDo';
    this.projectInput = field('Projekt · optional', 'select', null, '');
    this.refreshProjects(task?.projectId || this.options.defaultProjectId || '');
    button(this.projectInput.parentElement, '+ Projekt anlegen', () => new ProjectModal(this.app, this.plugin, null, id => this.refreshProjects(id)).open(), 'tp-small-button');
    if (this.isTemplate) {
      const offset = savedTemplate ? savedTemplate.dueInDays : (dateKeyValid(task?.due) ? Math.max(0, Math.round((Date.parse(task.due + 'T00:00:00Z') - Date.parse(dayKey() + 'T00:00:00Z')) / DAY)) : null);
      this.offsetInput = field('Fällig in Tagen ab Erstellung · optional', 'input', 'number', offset);
      this.offsetInput.min = '0'; this.offsetInput.max = '3650'; this.offsetInput.step = '1'; this.offsetInput.placeholder = '0 = am Tag der Erstellung';
    } else this.dueInput = field('Fällig am · optional', 'input', 'date', task?.due);
    const series = this.plugin.data.recurrences.find(s => s.id === task?.recurrenceId);
    const rule = repeatRule(this.isTemplate ? task?.repeat : (series?.enabled ? series : {}));
    this.repeatInput = field('Wiederholung', 'select', null, '');
    REPEAT_OPTIONS.forEach(r => this.repeatInput.createEl('option', { text: r.label, value: r.value })); this.repeatInput.value = rule.frequency;
    this.repeatIntervalInput = field('Alle … Tage / Wochen / Monate', 'input', 'number', rule.interval);
    this.repeatIntervalInput.min = '1'; this.repeatIntervalInput.max = '365'; this.repeatIntervalInput.step = '1';
    form.createDiv({ text: 'Wiederholungen erzeugen neue Aufgaben am jeweiligen Fälligkeitstag. Änderungen an den Vorgaben gelten für künftige Aufgaben dieser Serie. Keine Wiederholung stoppt die Serie.', cls: 'tp-help' });
    this.repeatInput.onchange = () => {
      const enabled = this.repeatInput.value !== 'none'; this.repeatIntervalInput.disabled = !enabled;
      if (enabled && this.dueInput && !this.dueInput.value) this.dueInput.value = dayKey();
      if (enabled && this.offsetInput && this.offsetInput.value === '') this.offsetInput.value = '0';
    }; this.repeatIntervalInput.disabled = rule.frequency === 'none';
    this.waitingSection = form.createDiv('tp-waiting-fields');
    const waitingLabel = this.waitingSection.createEl('label', { cls: 'tp-field', text: 'Warten auf · Person oder Team' });
    this.waitingForInput = waitingLabel.createEl('input', { type: 'text', attr: { placeholder: 'z. B. Anna oder IT-Team' } }); this.waitingForInput.value = task?.waitingFor || '';
    const followLabel = this.waitingSection.createEl('label', { cls: 'tp-field', text: this.isTemplate ? 'Nachfragen nach Tagen · optional' : 'Nachfragen am · optional' });
    this.followUpInput = followLabel.createEl('input', { type: this.isTemplate ? 'number' : 'date' });
    if (this.isTemplate) {
      const offset = savedTemplate?.followUpInDays ?? (validDate(task?.followUpDate) ? daysBetween(dayKey(), task.followUpDate) : null);
      this.followUpInput.value = offset == null ? '' : String(offset); this.followUpInput.min = '0'; this.followUpInput.max = '3650'; this.followUpInput.step = '1';
    } else this.followUpInput.value = task?.followUpDate || '';
    this.statusInput.onchange = () => { this.waitingSection.hidden = this.statusInput.value !== 'Waiting'; }; this.statusInput.onchange();
    this.noteInput = field('Beschreibung · optional', 'textarea', null, task?.note); this.noteInput.rows = 3;
    const subSection = form.createDiv('tp-modal-subtasks'); subSection.createEl('h3', { text: 'Unteraufgaben' });
    this.subtaskList = subSection.createDiv('tp-modal-subtask-list');
    this.subtaskElements = new Map();
    this.originalSubtasks = copy(task?.subtasks || []);
    this.subtaskRows = copy(task?.subtasks || []).map(s => ({ id: s.id || uid(), title: s.title, done: !this.isTemplate && !!s.done, due: validDate(s.due), dueInDays: offsetDays(s.dueInDays) ?? (this.isTemplate && validDate(s.due) ? daysBetween(dayKey(), s.due) : null) }));
    if (this.isTemplate && !this.subtaskRows.length) this.subtaskRows.push({ id: uid(), title: '', done: false, due: '', dueInDays: null });
    subSection.createDiv({ text: 'Unteraufgaben direkt eingeben. Enter ergänzt die nächste Zeile; gespeichert wird über den Speichern-Knopf unten.', cls: 'tp-help' });
    this.renderSubtasks();
    this.addSubtaskButton = button(subSection, '+ Unteraufgabe', () => this.addSubtask());
    const actions = form.createDiv('tp-inline-actions');
    this.saveButton = actions.createEl('button', { text: this.isTemplate ? 'Vorlage speichern' : (task ? 'Änderungen speichern' : 'Aufgabe erstellen'), cls: 'mod-cta', type: 'submit' });
    if (!this.isTemplate && !this.taskId) this.fromTemplateButton = button(actions, 'Aufgabe nach Vorlage erstellen', () => new TemplatePickerModal(this.app, this.plugin, this).open());
    button(actions, 'Abbrechen', () => this.close());
    form.onkeydown = e => {
      if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229 && e.target?.tagName === 'INPUT') e.preventDefault();
    };
    form.onsubmit = e => {
      e.preventDefault();
      // Enter in a text field must not implicitly save a partly written template.
      if (e.submitter && e.submitter !== this.saveButton) return;
      if (!e.submitter && this.subtaskList.contains(this.contentEl.ownerDocument?.activeElement)) return;
      void this.submit();
    };
    if (this.options.initialTemplateId && !this.taskId && !this.isTemplate) {
      this.applyTemplate(this.options.initialTemplateId);
    }
    (this.nameInput || this.titleInput).focus();
  }
  renderSubtasks() {
    const ids = new Set(this.subtaskRows.map(s => s.id));
    for (const [id, entry] of this.subtaskElements) {
      if (!ids.has(id)) { entry.row.remove(); this.subtaskElements.delete(id); }
    }
    this.subtaskRows.forEach((item, index) => {
      let entry = this.subtaskElements.get(item.id);
      if (!entry) {
        const row = this.subtaskList.createDiv('tp-modal-subtask'); entry = { row, item };
        if (!this.isTemplate) {
          entry.check = row.createEl('input', { type: 'checkbox', attr: { 'aria-label': 'Unteraufgabe erledigt' } });
          entry.check.onchange = () => { entry.item.done = entry.check.checked; entry.lastDone = entry.check.checked; };
        }
        entry.input = row.createEl('input', { type: 'text', attr: { placeholder: 'Titel der Unteraufgabe' } });
        entry.input.oninput = () => { entry.item.title = entry.input.value; entry.lastTitle = entry.input.value; };
        entry.input.onkeydown = e => {
          if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
          e.preventDefault(); e.stopPropagation(); this.addSubtask(entry.item.id);
        };
        entry.date = row.createEl('input', { type: this.isTemplate ? 'number' : 'date', cls: 'tp-subtask-date', attr: { 'aria-label': this.isTemplate ? 'Fälligkeit der Unteraufgabe in Tagen ab Erstellung' : 'Fälligkeitsdatum der Unteraufgabe', placeholder: this.isTemplate ? 'Fällig in Tagen' : '' } });
        if (this.isTemplate) { entry.date.min = '0'; entry.date.max = '3650'; entry.date.step = '1'; }
        entry.date.oninput = () => {
          if (this.isTemplate) entry.item.dueInDays = entry.date.value === '' ? null : Number(entry.date.value); else entry.item.due = entry.date.value;
          entry.lastDate = entry.date.value;
        };
        entry.remove = button(row, '×', () => this.removeSubtask(entry.item.id), 'tp-icon-button');
        this.subtaskElements.set(item.id, entry);
      }
      entry.item = item;
      if (entry.input.value !== item.title) entry.input.value = item.title;
      entry.lastTitle = item.title; entry.input.setAttribute('aria-label', 'Titel der Unteraufgabe ' + (index + 1));
      const dueValue = this.isTemplate ? (item.dueInDays == null ? '' : String(item.dueInDays)) : (item.due || '');
      if (entry.date.value !== dueValue) entry.date.value = dueValue; entry.lastDate = dueValue;
      entry.remove.setAttribute('aria-label', 'Unteraufgabe ' + (index + 1) + ' entfernen');
      if (entry.check) { entry.check.checked = item.done; entry.lastDone = item.done; }
      const atPosition = this.subtaskList.children[index];
      if (atPosition !== entry.row) this.subtaskList.insertBefore(entry.row, atPosition || null);
    });
  }
  captureSubtasks() {
    // Read pending field values before list changes/save, even if an input event was delayed.
    for (const item of this.subtaskRows) {
      const entry = this.subtaskElements.get(item.id); if (!entry) continue;
      if (entry.input.value !== entry.lastTitle) { item.title = entry.input.value; entry.lastTitle = entry.input.value; }
      if (entry.check && entry.check.checked !== entry.lastDone) { item.done = entry.check.checked; entry.lastDone = entry.check.checked; }
      if (entry.date.value !== entry.lastDate) {
        if (this.isTemplate) item.dueInDays = entry.date.value === '' ? null : Number(entry.date.value); else item.due = entry.date.value;
        entry.lastDate = entry.date.value;
      }
    }
  }
  focusSubtask(id) {
    const input = this.subtaskElements.get(id)?.input; input?.focus();
  }
  addSubtask(afterId = null) {
    if (this.saving) return;
    this.captureSubtasks();
    const index = afterId == null ? this.subtaskRows.length - 1 : this.subtaskRows.findIndex(s => s.id === afterId);
    const current = this.subtaskRows[index];
    if (current && !current.title.trim()) { this.focusSubtask(current.id); return; }
    const next = this.subtaskRows[index + 1];
    if (next && !next.title.trim()) { this.focusSubtask(next.id); return; }
    const item = { id: uid(), title: '', done: false, due: '', dueInDays: null };
    this.subtaskRows.splice(index + 1, 0, item); this.renderSubtasks(); this.focusSubtask(item.id);
  }
  removeSubtask(id) {
    if (this.saving) return;
    this.captureSubtasks();
    const index = this.subtaskRows.findIndex(s => s.id === id);
    if (index < 0) return;
    this.subtaskRows.splice(index, 1); this.renderSubtasks();
    const next = this.subtaskRows[Math.min(index, this.subtaskRows.length - 1)]; if (next) this.focusSubtask(next.id);
  }
  setSubtaskSaving(saving) {
    this.addSubtaskButton.disabled = saving;
    for (const entry of this.subtaskElements.values()) {
      entry.input.disabled = saving; entry.remove.disabled = saving; entry.date.disabled = saving;
      if (entry.check) entry.check.disabled = saving;
    }
  }
  applyTemplate(id) {
    const source = this.plugin.data.templates.find(t => t.id === id);
    if (!source) { new Notice('Diese Vorlage ist nicht mehr vorhanden.'); return false; }
    const values = templateFields(source);
    this.titleInput.value = values.title; this.noteInput.value = values.note;
    this.priorityInput.value = values.priority; this.statusInput.value = values.status;
    this.refreshProjects(values.projectId || ''); this.waitingForInput.value = values.waitingFor;
    this.followUpInput.value = values.followUpInDays == null ? '' : shiftDate(dayKey(), values.followUpInDays);
    this.repeatInput.value = values.repeat.frequency; this.repeatIntervalInput.value = String(values.repeat.interval); this.repeatInput.onchange(); this.statusInput.onchange();
    this.dueInput.value = values.dueInDays == null ? '' : dayKey(shiftDay(Date.now(), values.dueInDays));
    this.subtaskRows = values.subtasks.map(s => ({ id: uid(), title: s.title, done: false, due: s.dueInDays == null ? '' : shiftDate(dayKey(), s.dueInDays), dueInDays: null })); this.renderSubtasks(); return true;
  }
  refreshProjects(selected) {
    this.projectInput.empty(); this.projectInput.createEl('option', { text: 'Kein Projekt', value: '' }).value = '';
    [...this.plugin.data.projects].sort((a, b) => a.name.localeCompare(b.name)).forEach(p => this.projectInput.createEl('option', { text: p.name, value: p.id }));
    this.projectInput.value = this.plugin.data.projects.some(p => p.id === selected) ? selected : '';
  }
  async submit() {
    if (this.saving) return;
    this.captureSubtasks();
    const title = this.titleInput.value.trim(), name = this.nameInput?.value.trim();
    if (this.isTemplate ? !name : !title) { new Notice(this.isTemplate ? 'Bitte gib der Vorlage einen Namen.' : 'Bitte gib einen Aufgabentitel ein.'); (this.nameInput || this.titleInput).focus(); return; }
    if (this.isTemplate && this.plugin.data.templates.some(t => t.id !== this.options.templateId && t.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { new Notice('Eine Vorlage mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.'); return; }
    if (this.dueInput && (!this.dueInput.checkValidity() || (this.dueInput.value && !dateKeyValid(this.dueInput.value)))) { this.dueInput.reportValidity(); return; }
    if (this.offsetInput && !this.offsetInput.checkValidity()) { this.offsetInput.reportValidity(); return; }
    if (!this.followUpInput.checkValidity()) { this.followUpInput.reportValidity(); return; }
    const frequency = this.repeatInput.value, interval = Number(this.repeatIntervalInput.value);
    if (!REPEAT_OPTIONS.some(r => r.value === frequency) || (frequency !== 'none' && (!Number.isInteger(interval) || interval < 1 || interval > 365))) { new Notice('Bitte ein gültiges Wiederholungsintervall eingeben.'); return; }
    const rule = repeatRule({ frequency, interval });
    if (!this.isTemplate && frequency !== 'none' && !validDate(this.dueInput.value)) { new Notice('Bitte ein Fälligkeitsdatum für die Wiederholung setzen.'); return; }
    const dueInDays = this.offsetInput && this.offsetInput.value !== '' ? Number(this.offsetInput.value) : (this.isTemplate && frequency !== 'none' ? 0 : null);
    if (dueInDays != null && (!Number.isInteger(dueInDays) || dueInDays < 0 || dueInDays > 3650)) return;
    const followUpInDays = this.isTemplate && this.followUpInput.value !== '' ? Number(this.followUpInput.value) : null;
    if (this.isTemplate ? followUpInDays != null && (!Number.isInteger(followUpInDays) || followUpInDays < 0 || followUpInDays > 3650) : this.followUpInput.value && !dateKeyValid(this.followUpInput.value)) return;
    for (const item of this.subtaskRows.filter(s => s.title.trim())) {
      if (this.isTemplate ? item.dueInDays != null && (!Number.isInteger(item.dueInDays) || item.dueInDays < 0 || item.dueInDays > 3650) : item.due && !dateKeyValid(item.due)) { new Notice('Bitte einen gültigen Termin für jede Unteraufgabe eingeben.'); return; }
    }
    if (!PRIORITIES.some(p => p.name === this.priorityInput.value)) return;
    const status = this.statusInput.value;
    if (!COLS.some(c => c.name === status) || ((!this.taskId || this.isTemplate) && status === 'Done')) return;
    this.saving = true; this.saveButton.disabled = true; this.setSubtaskSaving(true);
    const subtasks = this.subtaskRows.filter(s => s.title.trim()).map(s => this.isTemplate ? { title: s.title.trim(), dueInDays: s.dueInDays ?? null } : { id: s.id, title: s.title.trim(), done: !!s.done, due: s.due || '' });
    const values = { title, note: this.noteInput.value.trim(), priority: this.priorityInput.value, projectId: this.projectInput.value || null, waitingFor: this.waitingForInput.value.trim(), followUpDate: this.isTemplate ? '' : this.followUpInput.value, updatedAt: Date.now() };
    const ok = await this.plugin.mutate(data => {
      if (values.projectId && !data.projects.some(p => p.id === values.projectId)) throw new Error('Dieses Projekt wurde inzwischen entfernt.');
      if (this.isTemplate) {
        if (data.templates.some(t => t.id !== this.options.templateId && t.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error('Eine Vorlage mit diesem Namen existiert bereits.');
        const fields = { name, ...templateFields({ ...values, status, dueInDays, followUpInDays, repeat: rule, subtasks }), updatedAt: Date.now() };
        if (this.options.templateId) {
          const template = data.templates.find(t => t.id === this.options.templateId); if (!template) throw new Error('Vorlage nicht gefunden.'); Object.assign(template, fields);
        } else data.templates.push({ id: uid(), ...fields, createdAt: Date.now() });
      } else if (this.taskId) {
        const task = data.tasks.find(t => t.id === this.taskId); if (!task || task.archivedAt) throw new Error('Diese Aufgabe ist nicht mehr bearbeitbar.');
        const subtasksChanged = JSON.stringify(subtasks) !== JSON.stringify(this.originalSubtasks);
        if (subtasksChanged && JSON.stringify(task.subtasks) !== JSON.stringify(this.originalSubtasks)) throw new Error('Unteraufgaben wurden inzwischen geändert. Bitte den Dialog erneut öffnen.');
        Object.assign(task, values, { due: this.dueInput.value }); if (subtasksChanged) task.subtasks = subtasks;
        if (status !== this.originalStatus) setStatus(task, status);
        configureRecurrence(data, task, rule);
      } else {
        const task = { id: uid(), ...values, status, due: this.dueInput.value, createdAt: Date.now(), completedAt: null, archivedAt: null, recurrenceId: null, occurrenceDate: '', subtasks, worklog: [] };
        data.tasks.push(task); configureRecurrence(data, task, rule);
      }
    });
    if (ok) this.close(); else { this.saving = false; this.saveButton.disabled = false; this.setSubtaskSaving(false); }
  }
  onClose() { this.contentEl.empty(); }
}
class TemplateModal extends TaskModal {
  constructor(app, plugin, templateId = null, seedTask = null) { super(app, plugin, null, { mode: 'template', templateId, seedTask: seedTask ? copy(seedTask) : null }); }
}
class TemplatePickerModal extends Modal {
  constructor(app, plugin, taskModal = null) { super(app); this.plugin = plugin; this.taskModal = taskModal; this.creating = false; this.templateButtons = []; }
  onOpen() {
    this.contentEl.empty(); this.contentEl.addClass('tp-template-picker');
    this.contentEl.createEl('h2', { text: 'Aufgabe nach Vorlage erstellen' });
    this.contentEl.createEl('p', { text: 'Wähle eine Vorlage aus. Die neue Aufgabe öffnet sich direkt zum Bearbeiten.', cls: 'tp-muted' });
    this.searchInput = this.contentEl.createEl('input', { type: 'search', attr: { placeholder: 'Vorlage suchen …', 'aria-label': 'Vorlagen durchsuchen' } });
    this.list = this.contentEl.createDiv('tp-template-picker-list');
    this.searchInput.oninput = () => this.renderOptions();
    this.cancelButton = button(this.contentEl, 'Abbrechen', () => { if (!this.creating) this.close(); });
    this.renderOptions(); this.searchInput.focus();
  }
  renderOptions() {
    this.list.empty(); this.templateButtons = [];
    const search = this.searchInput.value.trim().toLocaleLowerCase();
    const templates = this.plugin.data.templates.filter(t => [t.name, t.title, t.note].join(' ').toLocaleLowerCase().includes(search)).sort((a, b) => a.name.localeCompare(b.name));
    for (const t of templates) {
      const row = this.list.createDiv('tp-template-picker-option'); row.setAttribute('data-template-id', t.id);
      const choose = button(row, t.name, () => this.choose(t.id), 'tp-template-choice');
      choose.setAttribute('aria-label', 'Aufgabe aus Vorlage ' + t.name + ' erstellen'); choose.disabled = this.creating; this.templateButtons.push(choose);
      const meta = row.createDiv('tp-meta'); priorityBadge(meta, t.priority); statusBadge(meta, t.status);
      meta.createSpan({ text: t.subtasks.length + ' Unteraufgaben', cls: 'tp-muted' });
      if (t.title) row.createDiv({ text: t.title, cls: 'tp-template-title' });
    }
    if (!templates.length) this.list.createDiv({ text: search ? 'Keine passenden Vorlagen.' : 'Noch keine Vorlagen. Erstelle zuerst eine über + Vorlage neben + Aufgabe.', cls: 'tp-empty' });
  }
  async choose(id) {
    if (this.creating) return false;
    this.creating = true; this.searchInput.disabled = true; this.cancelButton.disabled = true; this.templateButtons.forEach(b => { b.disabled = true; });
    const taskId = await this.plugin.createTaskFromTemplate(id, this.taskModal?.options.defaultProjectId || null);
    if (taskId) { this.close(); this.taskModal?.close(); new TaskModal(this.app, this.plugin, taskId).open(); }
    else { this.creating = false; this.searchInput.disabled = false; this.cancelButton.disabled = false; this.renderOptions(); }
    return !!taskId;
  }
  onClose() { this.contentEl.empty(); }
}
class DeleteTemplateModal extends Modal {
  constructor(app, plugin, templateId) { super(app); this.plugin = plugin; this.templateId = templateId; this.saving = false; }
  onOpen() {
    this.contentEl.createEl('h2', { text: 'Vorlage löschen?' });
    this.contentEl.createEl('p', { text: 'Die Vorlage wird entfernt. Bereits daraus erstellte Aufgaben bleiben erhalten.' });
    const actions = this.contentEl.createDiv('tp-inline-actions');
    this.deleteButton = button(actions, 'Vorlage löschen', () => this.confirm(), 'mod-warning'); button(actions, 'Abbrechen', () => this.close());
  }
  async confirm() {
    if (this.saving) return; this.saving = true; this.deleteButton.disabled = true;
    const ok = await this.plugin.mutate(data => { data.templates = data.templates.filter(t => t.id !== this.templateId); });
    if (ok) this.close(); else { this.saving = false; this.deleteButton.disabled = false; }
  }
  onClose() { this.contentEl.empty(); }
}
class ProjectModal extends Modal {
  constructor(app, plugin, projectId = null, onSaved = null) { super(app); this.plugin = plugin; this.projectId = projectId; this.onSaved = onSaved; this.saving = false; }
  onOpen() {
    const project = this.plugin.data.projects.find(p => p.id === this.projectId);
    this.contentEl.createEl('h2', { text: project ? 'Projekt bearbeiten' : 'Neues Projekt' });
    const form = this.contentEl.createEl('form');
    const label = form.createEl('label', { text: 'Projektname', cls: 'tp-field' }); this.nameInput = label.createEl('input', { type: 'text' }); this.nameInput.required = true; this.nameInput.value = project?.name || '';
    const noteLabel = form.createEl('label', { text: 'Beschreibung · optional', cls: 'tp-field' }); this.noteInput = noteLabel.createEl('textarea'); this.noteInput.value = project?.note || '';
    const actions = form.createDiv('tp-inline-actions'); this.saveButton = actions.createEl('button', { text: 'Projekt speichern', cls: 'mod-cta', type: 'submit' }); button(actions, 'Abbrechen', () => this.close());
    form.onsubmit = e => { e.preventDefault(); void this.submit(); }; this.nameInput.focus();
  }
  async submit() {
    if (this.saving) return;
    const name = this.nameInput.value.trim(), note = this.noteInput.value.trim();
    if (!name) { new Notice('Bitte einen Projektnamen eingeben.'); return; }
    if (this.plugin.data.projects.some(p => p.id !== this.projectId && p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { new Notice('Ein Projekt mit diesem Namen existiert bereits.'); return; }
    this.saving = true; this.saveButton.disabled = true; let id = this.projectId;
    const ok = await this.plugin.mutate(data => {
      if (data.projects.some(p => p.id !== id && p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error('Projektname bereits vorhanden.');
      if (id) { const project = data.projects.find(p => p.id === id); if (!project) throw new Error('Projekt wurde entfernt.'); Object.assign(project, { name, note }); }
      else { id = uid(); data.projects.push({ id, name, note, createdAt: Date.now() }); }
    });
    if (ok) { this.close(); this.onSaved?.(id); } else { this.saving = false; this.saveButton.disabled = false; }
  }
  onClose() { this.contentEl.empty(); }
}
class DeleteProjectModal extends Modal {
  constructor(app, plugin, projectId, onDeleted = null) { super(app); this.plugin = plugin; this.projectId = projectId; this.onDeleted = onDeleted; this.saving = false; }
  onOpen() {
    this.contentEl.createEl('h2', { text: 'Projekt entfernen?' });
    this.contentEl.createEl('p', { text: 'Die Aufgaben bleiben erhalten und werden Kein Projekt zugeordnet. Auch Vorlagen und künftige Serienaufgaben verlieren nur die Projektzuordnung.' });
    const actions = this.contentEl.createDiv('tp-inline-actions'); this.removeButton = button(actions, 'Projekt entfernen', () => this.confirm(), 'mod-warning'); button(actions, 'Abbrechen', () => this.close());
  }
  async confirm() {
    if (this.saving) return; this.saving = true; this.removeButton.disabled = true;
    const ok = await this.plugin.mutate(data => {
      data.projects = data.projects.filter(p => p.id !== this.projectId);
      for (const task of data.tasks) if (task.projectId === this.projectId) task.projectId = null;
      for (const template of data.templates) if (template.projectId === this.projectId) template.projectId = null;
      for (const series of data.recurrences) if (series.defaults.projectId === this.projectId) series.defaults.projectId = null;
    });
    if (ok) { this.close(); this.onDeleted?.(); } else { this.saving = false; this.removeButton.disabled = false; }
  }
  onClose() { this.contentEl.empty(); }
}
class ReminderSettingsModal extends Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; this.saving = false; }
  onOpen() {
    this.contentEl.createEl('h2', { text: 'Fälligkeits-Erinnerungen' });
    const label = this.contentEl.createEl('label', { cls: 'tp-reminder-toggle' }); this.enabledInput = label.createEl('input', { type: 'checkbox' }); this.enabledInput.checked = this.plugin.data.reminderSettings.enabled; label.createSpan({ text: 'Erinnerungen in Obsidian anzeigen' });
    const lead = this.contentEl.createEl('label', { text: 'Vorlauf', cls: 'tp-field' }); this.leadInput = lead.createEl('select');
    for (const days of [0, 1, 3, 7]) this.leadInput.createEl('option', { text: days === 0 ? 'Am Fälligkeitstag' : days + ' Tag(e) vorher', value: String(days) }); this.leadInput.value = String(this.plugin.data.reminderSettings.leadDays);
    this.contentEl.createEl('p', { text: 'Aufgaben, offene Unteraufgaben und Nachfragen werden berücksichtigt. Jede Fälligkeit wird automatisch höchstens einmal pro Tag gemeldet. Erinnerungen laufen nur, solange das Plugin in Obsidian geladen ist.', cls: 'tp-help' });
    const actions = this.contentEl.createDiv('tp-inline-actions'); this.saveButton = button(actions, 'Speichern', () => this.submit(), 'mod-cta'); button(actions, 'Abbrechen', () => this.close());
  }
  async submit() {
    if (this.saving) return; const leadDays = Number(this.leadInput.value); if (![0, 1, 3, 7].includes(leadDays)) return;
    this.saving = true; this.saveButton.disabled = true;
    const enabled = this.enabledInput.checked;
    const ok = await this.plugin.mutate(data => { data.reminderSettings = { enabled, leadDays }; });
    if (ok) { this.close(); await this.plugin.checkReminders(); } else { this.saving = false; this.saveButton.disabled = false; }
  }
  onClose() { this.contentEl.empty(); }
}
class SeriesManagerModal extends Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; this.busy = false; }
  onOpen() {
    this.contentEl.createEl('h2', { text: 'Wiederholungen verwalten' });
    this.contentEl.createEl('p', { text: 'Serien bleiben auch nach dem Archivieren ihrer Aufgaben hier erreichbar. Fortsetzen überspringt die pausierte Zeit; normale Offline-Zeiten werden weiterhin nachgeholt.', cls: 'tp-help' });
    this.list = this.contentEl.createDiv('tp-series-list'); this.renderList(); button(this.contentEl, 'Schließen', () => this.close());
  }
  renderList() {
    this.list.empty();
    if (!this.plugin.data.recurrences.length) this.list.createDiv({ text: 'Noch keine wiederkehrenden Aufgaben. Im Aufgabendialog eine Wiederholung wählen.', cls: 'tp-empty' });
    for (const series of this.plugin.data.recurrences) {
      const row = this.list.createDiv('tp-series-row'); row.createEl('h3', { text: series.defaults.title });
      row.createDiv({ text: (series.enabled ? 'Aktiv' : 'Pausiert') + ' · ' + REPEAT_OPTIONS.find(r => r.value === series.frequency)?.label + ' · Intervall ' + series.interval + ' · ' + projectName(this.plugin.data, series.defaults.projectId), cls: 'tp-muted' });
      const actions = row.createDiv('tp-inline-actions'); const next = actions.createEl('input', { type: 'date', attr: { 'aria-label': 'Nächster Termin für ' + series.defaults.title } }); next.value = series.nextDate;
      button(actions, 'Termin speichern', () => this.change(series.id, s => { if (!dateKeyValid(next.value)) throw new Error('Ungültiger Termin.'); s.nextDate = next.value; s.anchorDay = Number(next.value.slice(-2)); }));
      button(actions, series.enabled ? 'Pausieren' : 'Fortsetzen', () => this.change(series.id, s => { if (s.enabled) s.enabled = false; else resumeSeries(s); }));
    }
  }
  async change(id, action) {
    if (this.busy) return false; this.busy = true;
    const ok = await this.plugin.mutate(data => { const series = data.recurrences.find(s => s.id === id); if (!series) throw new Error('Serie nicht gefunden.'); action(series); });
    this.busy = false; this.renderList(); return ok;
  }
  onClose() { this.contentEl.empty(); }
}

class PlannerView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf); this.plugin = plugin; this.tab = 'board'; this.taskBoard = 'status'; this.drafts = new Map();
    this.draftInputs = new Map(); this.draftControls = new Map(); this.pendingDrafts = new Set();
    this.expanded = new Set(); this.archiveSearch = ''; this.scrollPositions = new Map();
    this.filters = { query: '', status: '', priority: '', due: 'all', project: 'all' };
    this.selectedProject = 'all'; this.projectBoard = 'status';
  }
  getViewType() { return VIEW; }
  getDisplayText() { return 'Tagesplaner'; }
  getIcon() { return 'layout-dashboard'; }
  async onOpen() { await this.plugin.runMaintenance(); await this.plugin.checkReminders(); this.render(); }
  async onClose() { this.drafts.clear(); }
  render() {
    this.draftInputs = new Map(); this.draftControls = new Map();
    if (!['all', 'none'].includes(this.filters.project) && !this.plugin.data.projects.some(p => p.id === this.filters.project)) this.filters.project = 'none';
    const root = this.contentEl || this.containerEl.children[1];
    const previousBody = root.querySelector?.('.tp-body');
    if (previousBody && this.renderedTab) {
      const boards = {};
      for (const group of root.querySelectorAll('[data-board]')) boards[group.getAttribute('data-board')] = group.querySelector('.tp-board-scroll')?.scrollLeft || 0;
      this.scrollPositions.set(this.renderedTab, { top: previousBody.scrollTop, boards });
    }
    root.empty(); root.addClass('tp-root');
    const head = root.createDiv('tp-head'), heading = head.createDiv(); heading.createEl('h2', { text: 'Tagesplaner' });
    heading.createDiv({ text: 'Fokus für heute. Überblick für die Woche.', cls: 'tp-muted' });
    const headActions = head.createDiv('tp-head-actions');
    button(headActions, '+ Aufgabe', () => new TaskModal(this.app, this.plugin, null, { defaultProjectId: this.tab === 'projects' && this.plugin.data.projects.some(p => p.id === this.selectedProject) ? this.selectedProject : null }).open(), 'mod-cta');
    button(headActions, '+ Vorlage', () => new TemplateModal(this.app, this.plugin).open());
    const nav = root.createDiv('tp-tabs'); nav.setAttribute('aria-label', 'Planner-Ansichten');
    const archiveCount = this.plugin.data.tasks.filter(t => t.archivedAt).length;
    for (const [id, label] of [['board', 'Aufgaben'], ['today', 'Heute'], ['projects', 'Projekte'], ['dashboard', 'Dashboard'], ['templates', 'Vorlagenverwaltung'], ['archive', 'Archiv · ' + archiveCount]]) {
      const b = button(nav, label, () => { this.tab = id; this.render(); }, this.tab === id ? 'tp-tab is-active' : 'tp-tab'); b.setAttribute('aria-pressed', String(this.tab === id));
    }
    if (this.tab === 'board') {
      const taskNav = root.createDiv('tp-task-navigation'); taskNav.setAttribute('aria-label', 'Ansichten innerhalb von Aufgaben');
      taskNav.createSpan({ text: 'Aufgaben', cls: 'tp-task-group-label' });
      const segments = taskNav.createDiv('tp-task-segments'); segments.setAttribute('role', 'group'); segments.setAttribute('aria-label', 'Aufgabenübersicht wählen');
      for (const [id, label] of [['status', 'Status'], ['priority', 'Prioritäten']]) {
        const b = button(segments, label, () => this.switchTaskBoard(id), this.taskBoard === id ? 'tp-task-segment is-active' : 'tp-task-segment');
        b.setAttribute('aria-pressed', String(this.taskBoard === id)); b.setAttribute('data-task-board', id);
      }
    }
    const body = root.createDiv('tp-body');
    if (this.tab === 'dashboard') this.renderDashboard(body); else if (this.tab === 'archive') this.renderArchive(body); else if (this.tab === 'templates') this.renderTemplates(body); else if (this.tab === 'today') this.renderToday(body); else if (this.tab === 'projects') this.renderProjects(body); else this.renderBoard(body);
    const viewKey = this.tab === 'board' ? 'board:' + this.taskBoard : this.tab === 'projects' ? 'projects:' + this.selectedProject + ':' + this.projectBoard : this.tab;
    const position = this.scrollPositions.get(viewKey);
    if (position) {
      body.scrollTop = position.top;
      for (const group of root.querySelectorAll?.('[data-board]') || []) group.querySelector('.tp-board-scroll').scrollLeft = position.boards[group.getAttribute('data-board')] || 0;
    }
    this.renderedTab = viewKey;
  }
  switchTaskBoard(board) {
    if (!['status', 'priority'].includes(board)) return;
    this.tab = 'board'; this.taskBoard = board; this.render();
  }
  renderBoard(parent) {
    const target = parent.createDiv('tp-filter-results');
    const draw = () => {
      target.empty(); this.draftInputs = new Map(); this.draftControls = new Map();
      if (this.taskBoard === 'priority') this.renderTaskBoard(target, 'Prioritäten', 'Nicht abgeschlossene Aufgaben nach Dringlichkeit · Teil deiner Aufgaben', 'priority', PRIORITIES);
      else this.renderTaskBoard(target, 'Status', 'Nach Arbeitsstand verschieben · Teil deiner Aufgaben', 'status', COLS);
    };
    const filters = parent.createDiv('tp-filter-slot'); parent.insertBefore(filters, target); this.renderFilters(filters, draw); draw();
  }
  renderFilters(parent, onUpdate, options = {}) {
    const bar = parent.createDiv('tp-filters');
    const query = bar.createEl('input', { type: 'search', attr: { placeholder: 'Aufgaben, Unteraufgaben oder Arbeitsverlauf suchen …', 'aria-label': 'Aufgaben durchsuchen' } }); query.value = this.filters.query;
    query.oninput = () => { this.filters.query = query.value; onUpdate(); };
    const select = (label, key, entries) => {
      const field = bar.createEl('select', { attr: { 'aria-label': label } }); entries.forEach(([value, text]) => { field.createEl('option', { text, value }).value = value; }); field.value = this.filters[key];
      field.onchange = () => { this.filters[key] = field.value; onUpdate(); };
    };
    select('Nach Status filtern', 'status', [['', 'Alle Status'], ...COLS.map(c => [c.name, c.name])]);
    select('Nach Priorität filtern', 'priority', [['', 'Alle Prioritäten'], ...PRIORITIES.map(p => [p.name, p.name])]);
    if (!options.hideDate) select('Nach Fälligkeit filtern', 'due', [['all', 'Alle Termine'], ['today', 'Heute fällig'], ['overdue', 'Überfällig'], ['week', 'Nächste 7 Tage'], ['none', 'Ohne Termin']]);
    if (!options.hideProject) select('Nach Projekt filtern', 'project', [['all', 'Alle Projekte'], ['none', 'Kein Projekt'], ...this.plugin.data.projects.map(p => [p.id, p.name])]);
    button(bar, 'Filter zurücksetzen', () => { this.filters = { query: '', status: '', priority: '', due: 'all', project: 'all' }; this.render(); }, 'tp-small-button');
  }
  visibleTasks(scope = null, archived = false) {
    const filters = { ...this.filters, project: scope == null ? this.filters.project : scope };
    return this.plugin.data.tasks.filter(t => !!t.archivedAt === archived && taskMatches(t, filters, this.plugin.data));
  }
  renderToday(parent) {
    const head = parent.createDiv('tp-page-heading'), title = head.createDiv(); title.createEl('h3', { text: 'Heute · ' + new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' }) });
    title.createDiv({ text: 'Fällige Aufgaben, offene Unteraufgaben und Nachfragen – inklusive Überfälligem.', cls: 'tp-muted' });
    const actions = head.createDiv('tp-inline-actions'); button(actions, 'Wiederholungen', () => new SeriesManagerModal(this.app, this.plugin).open()); button(actions, 'Erinnerungen', () => new ReminderSettingsModal(this.app, this.plugin).open()); button(actions, 'Jetzt prüfen', () => this.plugin.checkReminders(Date.now(), true));
    const filters = parent.createDiv(), target = parent.createDiv();
    const draw = () => {
      target.empty(); this.draftInputs = new Map(); this.draftControls = new Map(); const today = dayKey();
      const filtered = new Set(this.plugin.data.tasks.filter(t => taskMatches(t, { ...this.filters, due: 'all' }, this.plugin.data)).map(t => t.id));
      const entries = attentionEntries(this.plugin.data).filter(e => e.date <= today && filtered.has(e.task.id));
      const tasks = new Map(); entries.forEach(e => { if (!tasks.has(e.task.id)) tasks.set(e.task.id, { task: e.task, reasons: [] }); tasks.get(e.task.id).reasons.push(e); });
      const summary = target.createDiv('tp-brief-stats'); summary.createSpan({ text: tasks.size + ' Aufgaben' }); summary.createSpan({ text: entries.filter(e => e.kind === 'subtask').length + ' fällige Unteraufgaben' }); summary.createSpan({ text: entries.filter(e => e.kind === 'followup').length + ' Nachfragen' });
      if (!tasks.size) target.createDiv({ text: 'Alles im Blick – keine heute fälligen oder überfälligen Einträge für diese Auswahl.', cls: 'tp-empty' });
      for (const [overdue, label] of [[true, 'Überfällig'], [false, 'Heute fällig']]) {
        const relevant = [...tasks.values()].filter(item => item.reasons.some(e => e.date < today) === overdue).sort((a, b) => {
          const dateA = a.reasons.map(e => e.date).sort()[0], dateB = b.reasons.map(e => e.date).sort()[0]; return dateA.localeCompare(dateB);
        });
        if (!relevant.length) continue; target.createEl('h3', { text: label, cls: 'tp-list-heading' }); const grid = target.createDiv('tp-list-grid');
        for (const item of relevant) { const box = grid.createDiv('tp-attention-item'); const reasons = box.createDiv('tp-attention-reasons'); item.reasons.forEach(e => reasons.createDiv({ text: e.label + ' · ' + shortDate(e.date), cls: e.date < today ? 'tp-attention-overdue' : '' })); this.renderCard(box, item.task, false); }
      }
    };
    this.renderFilters(filters, draw, { hideDate: true }); draw();
  }
  renderProjects(parent) {
    if (this.selectedProject !== 'all' && this.selectedProject !== 'none' && !this.plugin.data.projects.some(p => p.id === this.selectedProject)) this.selectedProject = 'none';
    const head = parent.createDiv('tp-page-heading'), title = head.createDiv(); title.createEl('h3', { text: 'Projektansicht' }); title.createDiv({ text: 'Projekt auswählen oder Aufgaben ohne Projekt anzeigen.', cls: 'tp-muted' });
    const actions = head.createDiv('tp-inline-actions'); button(actions, '+ Projekt', () => new ProjectModal(this.app, this.plugin, null, id => { this.selectedProject = id; this.render(); }).open(), 'mod-cta');
    const select = parent.createEl('select', { cls: 'tp-project-picker', attr: { 'aria-label': 'Angezeigtes Projekt auswählen' } });
    [['all', 'Alle Projekte'], ['none', 'Kein Projekt'], ...this.plugin.data.projects.map(p => [p.id, p.name])].forEach(([value, text]) => select.createEl('option', { text, value })); select.value = this.selectedProject; select.onchange = () => { this.selectedProject = select.value; this.render(); };
    const project = this.plugin.data.projects.find(p => p.id === this.selectedProject);
    if (project) {
      if (project.note) parent.createDiv({ text: project.note, cls: 'tp-description' });
      button(actions, 'Projekt bearbeiten', () => new ProjectModal(this.app, this.plugin, project.id).open());
      button(actions, 'Projekt entfernen', () => new DeleteProjectModal(this.app, this.plugin, project.id, () => { this.selectedProject = 'none'; this.render(); }).open());
    }
    const scopeTasks = this.plugin.data.tasks.filter(t => this.selectedProject === 'all' || (this.selectedProject === 'none' ? !t.projectId : t.projectId === this.selectedProject));
    const summary = parent.createDiv('tp-brief-stats'); summary.createSpan({ text: scopeTasks.filter(t => t.status !== 'Done').length + ' offen' }); summary.createSpan({ text: scopeTasks.filter(t => t.status === 'Done').length + ' erledigt (inkl. Archiv)' });
    const total = scopeTasks.length, done = scopeTasks.filter(t => t.status === 'Done').length; progress(parent, done / Math.max(1, total) * 100, 'Projektfortschritt');
    const nav = parent.createDiv('tp-task-segments'); for (const [key, label] of [['status', 'Status'], ['priority', 'Prioritäten']]) button(nav, label, () => { this.projectBoard = key; this.render(); }, 'tp-task-segment' + (this.projectBoard === key ? ' is-active' : ''));
    const filters = parent.createDiv(), target = parent.createDiv();
    const draw = () => {
      target.empty(); this.draftInputs = new Map(); this.draftControls = new Map(); this.renderTaskBoard(target, this.projectBoard === 'status' ? 'Projektaufgaben nach Status' : 'Projektaufgaben nach Priorität', project?.name || (this.selectedProject === 'none' ? 'Kein Projekt' : 'Alle Projekte'), this.projectBoard, this.projectBoard === 'status' ? COLS : PRIORITIES, this.selectedProject);
      const archived = this.visibleTasks(this.selectedProject, true);
      if (archived.length) { const details = target.createEl('details', { cls: 'tp-project-archive' }); details.createEl('summary', { text: archived.length + ' archivierte Aufgaben dieses Projekts' }); const list = details.createDiv('tp-list-grid'); archived.sort((a, b) => b.archivedAt - a.archivedAt).forEach(t => this.renderCard(list, t, true)); }
    };
    this.renderFilters(filters, draw, { hideProject: true }); draw();
  }
  renderTemplates(parent) {
    const head = parent.createDiv('tp-template-heading');
    const heading = head.createDiv(); heading.createEl('h3', { text: 'Deine Aufgabenvorlagen' });
    heading.createDiv({ text: 'Wiederkehrende Abläufe vorbereiten. Jede neue Aufgabe bleibt frei anpassbar.', cls: 'tp-muted' });
    const grid = parent.createDiv('tp-template-grid');
    const templates = [...this.plugin.data.templates].sort((a, b) => a.name.localeCompare(b.name));
    if (!templates.length) grid.createDiv({ text: 'Noch keine Vorlagen. Erstelle eine mit + Vorlage neben + Aufgabe.', cls: 'tp-empty' });
    for (const template of templates) {
      const card = grid.createDiv('tp-template-card'); card.setAttribute('data-template-id', template.id);
      card.createEl('h4', { text: template.name });
      const meta = card.createDiv('tp-meta'); priorityBadge(meta, template.priority); statusBadge(meta, template.status);
      if (template.dueInDays != null) meta.createSpan({ text: template.dueInDays === 0 ? 'Fällig am Erstellungstag' : 'Fällig nach ' + template.dueInDays + ' Tagen', cls: 'tp-badge' });
      if (template.title) card.createDiv({ text: template.title, cls: 'tp-template-title' });
      if (template.note) card.createDiv({ text: template.note, cls: 'tp-description' });
      if (template.subtasks.length) {
        card.createDiv({ text: template.subtasks.length + ' Unteraufgaben', cls: 'tp-section-title' });
        const list = card.createEl('ul', { cls: 'tp-template-subtasks' }); template.subtasks.forEach(s => list.createEl('li', { text: s.title }));
      }
      const actions = card.createDiv('tp-template-actions');
      button(actions, 'Bearbeiten', () => new TemplateModal(this.app, this.plugin, template.id).open());
      button(actions, 'Umbenennen', () => new TemplateModal(this.app, this.plugin, template.id).open());
      button(actions, 'Löschen', () => new DeleteTemplateModal(this.app, this.plugin, template.id).open());
    }
  }
  renderTaskBoard(parent, heading, hint, field, columns, scope = null) {
    const group = parent.createDiv('tp-board-group'); group.setAttribute('data-board', field);
    const headingEl = group.createDiv('tp-board-heading'); headingEl.createEl('h3', { text: heading });
    headingEl.createDiv({ text: hint, cls: 'tp-muted' });
    const board = group.createDiv('tp-board-scroll').createDiv('tp-board');
    for (const col of columns) {
      const tasks = this.visibleTasks(scope).filter(t => t[field] === col.name && (field !== 'priority' || t.status !== 'Done'));
      const lane = board.createDiv('tp-lane ' + (field === 'priority' ? 'tp-priority-' : 'tp-') + col.key);
      lane.setAttribute('data-value', col.name);
      const head = lane.createDiv('tp-lane-head'); symbolLabel(head.createEl('h3'), col); head.createSpan({ text: String(tasks.length), cls: 'tp-count' });
      if (field === 'status' && col.key === 'done') lane.createDiv({ text: 'Nach 24 Stunden automatisch im Archiv', cls: 'tp-lane-hint' });
      lane.ondragover = e => { if (e.dataTransfer?.types.includes('application/x-tagesplaner')) { e.preventDefault(); lane.addClass('tp-over'); } };
      lane.ondragleave = e => { if (!lane.contains(e.relatedTarget)) lane.removeClass('tp-over'); };
      lane.ondrop = e => {
        e.preventDefault(); lane.removeClass('tp-over'); const id = e.dataTransfer?.getData('application/x-tagesplaner');
        if (id) void (field === 'priority' ? this.plugin.changePriority(id, col.name) : this.plugin.changeStatus(id, col.name));
      };
      if (!tasks.length) lane.createDiv({ text: 'Hier ist gerade Platz.', cls: 'tp-empty-lane' });
      tasks.sort((a, b) => {
        if (field === 'status') {
          const priorityDifference = (PRIORITIES.find(p => p.name === b.priority)?.rank ?? 2) - (PRIORITIES.find(p => p.name === a.priority)?.rank ?? 2);
          if (priorityDifference) return priorityDifference;
        }
        return (a.due || '9999').localeCompare(b.due || '9999');
      }).forEach(t => this.renderCard(lane, t, false));
    }
  }
  bindDraft(input, key, initial = '') {
    input.value = this.drafts.has(key) ? this.drafts.get(key) : initial;
    if (!this.draftInputs.has(key)) this.draftInputs.set(key, new Set());
    this.draftInputs.get(key).add(input); this.registerDraftControl(key, input);
    input.oninput = () => {
      this.drafts.set(key, input.value);
      for (const other of this.draftInputs.get(key) || []) if (other !== input) other.value = input.value;
    };
  }
  registerDraftControl(key, control) {
    if (!this.draftControls.has(key)) this.draftControls.set(key, new Set());
    this.draftControls.get(key).add(control); control.disabled = this.pendingDrafts.has(key);
  }
  async saveDraft(taskId, kind, change) {
    const key = taskId + ':' + kind;
    if (this.pendingDrafts.has(key)) return false;
    const originalDraft = this.drafts.get(key);
    this.pendingDrafts.add(key);
    for (const control of this.draftControls.get(key) || []) control.disabled = true;
    try {
      const ok = await this.editTask(taskId, change);
      if (ok && this.drafts.get(key) === originalDraft) this.drafts.delete(key);
      return ok;
    } finally { this.pendingDrafts.delete(key); this.render(); }
  }
  async editTask(id, change) {
    return this.plugin.mutate(data => {
      const task = data.tasks.find(t => t.id === id); if (!task || task.archivedAt) throw new Error('Die Aufgabe wurde inzwischen archiviert.');
      change(task); task.updatedAt = Date.now();
    });
  }
  renderCard(parent, task, archived) {
    const card = parent.createDiv('tp-card'), title = card.createDiv('tp-card-head'); title.createEl('h4', { text: task.title, cls: 'tp-title' });
    card.setAttribute('data-task-id', task.id);
    if (!archived) {
      title.draggable = true; title.title = 'Am Titel ziehen, um die Kategorie zu ändern';
      title.ondragstart = e => { e.dataTransfer.setData('application/x-tagesplaner', task.id); e.dataTransfer.effectAllowed = 'move'; };
    }
    const meta = card.createDiv('tp-meta');
    priorityBadge(meta, task.priority); statusBadge(meta, task.status);
    meta.createSpan({ text: projectName(this.plugin.data, task.projectId), cls: 'tp-badge tp-project-badge' });
    const series = this.plugin.data.recurrences.find(s => s.id === task.recurrenceId);
    if (series) meta.createSpan({ text: '↻ ' + (series.enabled ? REPEAT_OPTIONS.find(r => r.value === series.frequency)?.label || 'Serie' : 'Serie pausiert'), cls: 'tp-badge' });
    if (task.due) meta.createSpan({ text: shortDate(task.due), cls: 'tp-badge' + (!archived && task.status !== 'Done' && task.due < dayKey() ? ' tp-overdue' : '') });
    if (task.completedAt) meta.createSpan({ text: task.completionDateEstimated ? 'Vor dem Update erledigt · Archivtimer ab Update' : 'Erledigt ' + timeText(task.completedAt), cls: 'tp-muted' });
    if (archived) meta.createSpan({ text: 'Archiviert ' + timeText(task.archivedAt), cls: 'tp-muted' });
    if (task.status === 'Waiting') {
      const waiting = card.createDiv('tp-waiting-card'); waiting.createDiv({ text: 'Warten auf: ' + (task.waitingFor || 'noch keine Person eingetragen'), cls: 'tp-section-title' });
      if (task.followUpDate) waiting.createDiv({ text: 'Nachfragen am ' + shortDate(task.followUpDate), cls: !archived && task.followUpDate <= dayKey() ? 'tp-overdue tp-badge' : 'tp-badge' });
    }
    const description = card.createDiv('tp-description-section');
    description.createDiv({ text: 'Beschreibung', cls: 'tp-section-title' });
    description.createDiv({ text: task.note || 'Noch keine Beschreibung.', cls: 'tp-description' });
    if (!archived) {
      const editor = description.createEl('details', { cls: 'tp-description-editor' });
      editor.createEl('summary', { text: 'Beschreibung bearbeiten' });
      const form = editor.createEl('form', { cls: 'tp-description-form' });
      const input = form.createEl('textarea', { attr: { 'aria-label': 'Beschreibung für ' + task.title, placeholder: 'Beschreibung eingeben oder anpassen …' } }); input.rows = 3;
      const key = task.id + ':description'; this.bindDraft(input, key, task.note);
      editor.open = this.drafts.has(key);
      const save = form.createEl('button', { text: 'Beschreibung speichern', type: 'submit', cls: 'tp-small-button' });
      this.registerDraftControl(key, save);
      form.onsubmit = async e => { e.preventDefault(); const note = input.value.trim(); return this.saveDraft(task.id, 'description', t => { t.note = note; }); };
    }
    const actions = card.createDiv('tp-card-actions');
    if (archived) button(actions, 'Wieder öffnen', () => this.plugin.changeStatus(task.id, 'ToDo'));
    else {
      const select = actions.createEl('select', { attr: { 'aria-label': 'Status für ' + task.title } });
      COLS.forEach(col => select.createEl('option', { text: col.glyph + ' ' + col.name, value: col.name })); select.value = task.status;
      select.onchange = () => this.plugin.changeStatus(task.id, select.value); button(actions, 'Bearbeiten', () => new TaskModal(this.app, this.plugin, task.id).open());
      const priority = actions.createEl('select', { cls: 'tp-priority-select', attr: { 'aria-label': 'Priorität für ' + task.title } });
      PRIORITIES.forEach(p => priority.createEl('option', { text: p.glyph + ' ' + p.name, value: p.name })); priority.value = task.priority;
      priority.onchange = () => this.plugin.changePriority(task.id, priority.value);
    }
    const sub = card.createDiv('tp-section'), subDone = task.subtasks.filter(s => s.done).length;
    sub.createDiv({ text: 'Unteraufgaben' + (task.subtasks.length ? ' · ' + subDone + '/' + task.subtasks.length : ''), cls: 'tp-section-title' });
    if (task.subtasks.length) progress(sub, subDone / task.subtasks.length * 100, 'Unteraufgaben abgeschlossen');
    for (const item of task.subtasks) {
      const row = sub.createDiv('tp-subtask'), label = row.createEl('label'), check = label.createEl('input', { type: 'checkbox' });
      check.checked = item.done; check.disabled = archived; label.createSpan({ text: item.title, cls: item.done ? 'tp-sub-done' : '' });
      check.onchange = () => this.editTask(task.id, t => { const s = t.subtasks.find(s => s.id === item.id); if (s) s.done = check.checked; });
      if (archived) {
        if (item.due) row.createSpan({ text: shortDate(item.due), cls: 'tp-badge' });
      } else {
        const due = row.createEl('input', { type: 'date', cls: 'tp-subtask-card-date', attr: { 'aria-label': 'Termin für Unteraufgabe ' + item.title } }); due.value = item.due || '';
        if (!item.done && item.due && item.due < dayKey()) due.addClass('tp-overdue');
        due.onchange = () => {
          if (!due.checkValidity() || (due.value && !dateKeyValid(due.value))) { due.reportValidity(); return; }
          return this.editTask(task.id, t => { const s = t.subtasks.find(s => s.id === item.id); if (s) s.due = due.value; });
        };
      }
      if (!archived) button(row, '×', () => this.editTask(task.id, t => { t.subtasks = t.subtasks.filter(s => s.id !== item.id); }), 'tp-icon-button').setAttribute('aria-label', 'Unteraufgabe entfernen: ' + item.title);
    }
    if (!archived) {
      const form = sub.createEl('form', { cls: 'tp-sub-form' }), input = form.createEl('input', { type: 'text', attr: { placeholder: 'Neue Unteraufgabe …', 'aria-label': 'Neue Unteraufgabe für ' + task.title } });
      const key = task.id + ':sub'; this.bindDraft(input, key);
      const add = form.createEl('button', { text: '+', type: 'submit', attr: { 'aria-label': 'Unteraufgabe hinzufügen' } });
      this.registerDraftControl(key, add);
      form.onsubmit = async e => {
        e.preventDefault(); const value = input.value.trim(); if (!value) return;
        return this.saveDraft(task.id, 'sub', t => t.subtasks.push({ id: uid(), title: value, done: false, due: '' }));
      };
    }
    const log = card.createDiv('tp-section tp-worklog'); log.createDiv({ text: 'Was wurde gemacht?', cls: 'tp-section-title' });
    const entries = [...task.worklog].reverse(), visible = this.expanded.has(task.id) ? entries : entries.slice(0, 2);
    if (!entries.length) log.createDiv({ text: 'Noch keine Arbeitsschritte dokumentiert.', cls: 'tp-muted' });
    for (const entry of visible) {
      const row = log.createDiv('tp-log-entry'); row.createDiv({ text: entry.text, cls: 'tp-log-text' }); row.createEl('time', { text: timeText(entry.at), cls: 'tp-muted' });
    }
    if (entries.length > 2) button(log, this.expanded.has(task.id) ? 'Weniger anzeigen' : 'Alle ' + entries.length + ' Einträge anzeigen', () => {
      if (this.expanded.has(task.id)) this.expanded.delete(task.id); else this.expanded.add(task.id); this.render();
    }, 'tp-text-button');
    if (!archived) {
      const form = log.createEl('form', { cls: 'tp-log-form' });
      const input = form.createEl('textarea', { attr: { placeholder: 'Arbeitsschritt oder Ergebnis eintragen …', 'aria-label': 'Arbeitsschritt für ' + task.title } }); input.rows = 2;
      const key = task.id + ':log'; this.bindDraft(input, key);
      const save = form.createEl('button', { text: 'Eintrag speichern', type: 'submit', cls: 'tp-small-button' });
      this.registerDraftControl(key, save);
      form.onsubmit = async e => {
        e.preventDefault(); const text = input.value.trim(); if (!text) return;
        return this.saveDraft(task.id, 'log', t => t.worklog.push({ id: uid(), text, at: Date.now() }));
      };
    }
  }
  renderArchive(parent) {
    const tools = parent.createDiv('tp-archive-tools'); tools.createEl('h3', { text: 'Dein Archiv' });
    tools.createDiv({ text: 'Erledigte Aufgaben bleiben mit Unteraufgaben und Arbeitsverlauf erhalten.', cls: 'tp-muted' });
    const input = tools.createEl('input', { type: 'search', attr: { placeholder: 'Archiv durchsuchen …', 'aria-label': 'Archiv durchsuchen' } }); input.value = this.archiveSearch;
    const grid = parent.createDiv('tp-archive-grid');
    const draw = () => {
      grid.empty(); const q = this.archiveSearch.toLocaleLowerCase();
      const tasks = this.plugin.data.tasks.filter(t => t.archivedAt && [t.title, t.note, ...t.worklog.map(e => e.text), ...t.subtasks.map(s => s.title)].join(' ').toLocaleLowerCase().includes(q));
      tasks.sort((a, b) => b.archivedAt - a.archivedAt).forEach(t => this.renderCard(grid, t, true));
      if (!tasks.length) grid.createDiv({ text: q ? 'Keine passenden Aufgaben gefunden.' : 'Noch keine archivierten Aufgaben. Fertige Aufgaben erscheinen nach 24 Stunden hier.', cls: 'tp-empty' });
    };
    input.oninput = () => { this.archiveSearch = input.value; draw(); }; draw();
  }
  renderDashboard(parent) {
    const m = metrics(this.plugin.data), intro = parent.createDiv('tp-dashboard-intro'); intro.createEl('h3', { text: 'Deine Woche im Blick' });
    intro.createDiv({ text: new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' }), cls: 'tp-muted' });
    const kpis = parent.createDiv('tp-kpis');
    const metric = (label, value, hint, tone = '', symbol = COLS[0]) => {
      const tile = kpis.createDiv('tp-kpi ' + tone), header = tile.createDiv('tp-kpi-header'); addSymbol(header, symbol); header.createDiv({ text: label, cls: 'tp-muted' }); tile.createDiv({ text: String(value), cls: 'tp-kpi-value' }); tile.createDiv({ text: hint, cls: 'tp-kpi-hint' });
    };
    metric('Offene Aufgaben', m.active.length, 'Alle noch nicht fertigen Aufgaben'); metric('In Progress', m.inProgress.length, 'Aktuell im Fokus', 'tp-progress', COLS[1]);
    metric('Heute fällig', m.dueToday.length, 'Noch zu erledigen', '', COLS[2]); metric('Überfällig', m.overdue.length, 'Fälligkeit bereits überschritten', m.overdue.length ? 'tp-risk' : '', PRIORITIES[3]);
    metric('Erledigt · 7 Tage', m.done7, 'Heute und die letzten 6 Tage', 'tp-done', COLS.find(c => c.name === 'Done')); metric('Erledigt · 30 Tage', m.done30, 'Inklusive archivierter Aufgaben', 'tp-done', COLS.find(c => c.name === 'Done'));
    metric('Waiting', m.waiting.length, 'Braucht eventuell Unterstützung', 'tp-waiting', COLS[2]); metric('Unteraufgaben', m.subtasksDone + '/' + m.subtasks, 'Erledigt / gesamt, inklusive Archiv', '', COLS.find(c => c.name === 'Done'));
    const grid = parent.createDiv('tp-dashboard-grid');
    const panel = title => { const box = grid.createDiv('tp-panel'); box.createEl('h4', { text: title }); return box; };
    const priorities = panel('Offene Aufgaben nach Priorität');
    for (const p of PRIORITIES) {
      const count = m.active.filter(t => t.priority === p.name).length, row = priorities.createDiv('tp-distribution tp-priority-' + p.key);
      symbolLabel(row, p); row.createSpan({ text: String(count), cls: 'tp-count' }); progress(row, count / Math.max(1, m.active.length) * 100, 'Priorität ' + p.name);
    }
    const activity = panel('Erledigte Aufgaben · letzte 7 Tage'), chart = activity.createDiv('tp-chart'), max = Math.max(1, ...m.week.map(d => d.count));
    for (const day of m.week) {
      const col = chart.createDiv('tp-chart-column'); col.createSpan({ text: String(day.count), cls: 'tp-chart-count' });
      col.createDiv('tp-chart-track').createDiv('tp-chart-bar').style.height = day.count / max * 100 + '%';
      col.createSpan({ text: shortDate(day.key), cls: 'tp-muted' }); col.setAttribute('aria-label', day.key + ': ' + day.count + ' erledigt');
    }
    activity.createDiv({ text: 'Archivierte Aufgaben zählen weiterhin mit. Wieder geöffnete Aufgaben zählen erst nach erneutem Abschluss. Alte Aufgaben ohne Abschlussdatum sind im Zeitdiagramm nicht enthalten.', cls: 'tp-help' });
    const distribution = panel('Verteilung auf die Kategorien');
    for (const col of COLS) {
      const count = this.plugin.data.tasks.filter(t => !t.archivedAt && t.status === col.name).length, row = distribution.createDiv('tp-distribution tp-' + col.key);
      symbolLabel(row, col); row.createSpan({ text: String(count), cls: 'tp-count' }); progress(row, count / Math.max(1, this.plugin.data.tasks.filter(t => !t.archivedAt).length) * 100, col.name);
    }
    const due = panel('Als Nächstes · Fälligkeit'), upcoming = m.active.filter(t => t.due && t.due <= dayKey(shiftDay(Date.now(), 7))).sort((a, b) => a.due.localeCompare(b.due));
    for (const t of upcoming.slice(0, 6)) {
      const row = due.createDiv('tp-summary-row'); button(row, t.title, () => new TaskModal(this.app, this.plugin, t.id).open(), 'tp-text-button'); row.createSpan({ text: shortDate(t.due), cls: t.due < m.today ? 'tp-overdue tp-badge' : 'tp-badge' });
    }
    if (!upcoming.length) due.createDiv({ text: 'Keine offenen Fälligkeiten in den nächsten 7 Tagen.', cls: 'tp-muted' });
    if (upcoming.length > 6) due.createDiv({ text: '+ ' + (upcoming.length - 6) + ' weitere Aufgaben im Board', cls: 'tp-help' });
    const recent = panel('Zuletzt abgeschlossen'), completed = [...m.done].sort((a, b) => b.completedAt - a.completedAt).slice(0, 5);
    for (const t of completed) {
      const row = recent.createDiv('tp-summary-row'); row.createSpan({ text: t.title }); row.createSpan({ text: (t.archivedAt ? 'Archiv · ' : '') + (t.completionDateEstimated ? 'Vor dem Update erledigt' : timeText(t.completedAt)), cls: 'tp-muted' });
    }
    if (!completed.length) recent.createDiv({ text: 'Deine nächsten Erfolge erscheinen hier.', cls: 'tp-muted' });
    const logs = panel('Letzte dokumentierte Arbeitsschritte'), entries = this.plugin.data.tasks.flatMap(t => t.worklog.map(e => ({ ...e, title: t.title }))).sort((a, b) => b.at - a.at).slice(0, 4);
    for (const e of entries) {
      const row = logs.createDiv('tp-log-entry'); row.createDiv({ text: e.title, cls: 'tp-section-title' }); row.createDiv({ text: e.text, cls: 'tp-log-text' }); row.createDiv({ text: timeText(e.at), cls: 'tp-muted' });
    }
    if (!entries.length) logs.createDiv({ text: 'Dokumentiere Arbeitsschritte direkt unten in den Aufgabenkarten.', cls: 'tp-muted' });
  }
}

module.exports = class TagesplanerPlugin extends Plugin {
  async onload() {
    this.queue = Promise.resolve(); this.data = normalize(await this.loadData()); await this.saveData(copy(this.data));
    this.registerView(VIEW, leaf => new PlannerView(leaf, this));
    this.addRibbonIcon('layout-dashboard', 'Tagesplaner öffnen', () => this.activate());
    this.addCommand({ id: 'open', name: 'Tagesplaner öffnen', callback: () => this.activate() });
    this.addCommand({ id: 'dashboard', name: 'Dashboard öffnen', callback: () => this.activate('dashboard') });
    this.addCommand({ id: 'today', name: 'Heute öffnen', callback: () => this.activate('today') });
    this.addCommand({ id: 'projects', name: 'Projektansicht öffnen', callback: () => this.activate('projects') });
    this.addCommand({ id: 'reminders', name: 'Erinnerungen jetzt prüfen', callback: () => this.checkReminders(Date.now(), true) });
    await this.runMaintenance(); await this.checkReminders(); this.lastDay = dayKey();
    this.registerInterval(window.setInterval(() => {
      void this.tick();
    }, 60000));
  }
  refreshViews() { this.app.workspace.getLeavesOfType(VIEW).forEach(leaf => leaf.view.render()); }
  mutate(change) {
    const operation = this.queue.then(async () => {
      const before = copy(this.data);
      try { change(this.data); await this.saveData(copy(this.data)); }
      catch (error) { this.data = before; console.error('Tagesplaner: Speichern fehlgeschlagen', error); new Notice('Änderung nicht gespeichert. Bitte erneut versuchen.'); this.refreshViews(); return false; }
      this.refreshViews(); return true;
    });
    this.queue = operation.catch(error => { console.error('Tagesplaner: Ansicht konnte nicht aktualisiert werden', error); }); return operation;
  }
  async archiveExpired(now = Date.now()) {
    // Check inside the write queue to serialize archival with status changes.
    const operation = this.queue.then(async () => {
      const before = copy(this.data); if (!archiveDue(this.data, now)) return false;
      try { await this.saveData(copy(this.data)); }
      catch (error) { this.data = before; console.error('Tagesplaner: Archivieren fehlgeschlagen', error); new Notice('Archivierung konnte nicht gespeichert werden.'); return false; }
      this.refreshViews(); return true;
    });
    this.queue = operation.catch(error => console.error(error)); return operation;
  }
  async runMaintenance(now = Date.now()) {
    const operation = this.queue.then(async () => {
      const before = copy(this.data), generated = generateRecurring(this.data, now), archived = archiveDue(this.data, now);
      if (!generated.changed && !archived) return false;
      try { await this.saveData(copy(this.data)); }
      catch (error) { this.data = before; console.error('Tagesplaner: Automatische Aktualisierung fehlgeschlagen', error); new Notice('Automatische Aufgaben/Ablage konnten nicht gespeichert werden. Der nächste Versuch folgt automatisch.'); return false; }
      this.refreshViews(); return true;
    });
    this.queue = operation.catch(error => console.error(error)); return operation;
  }
  async checkReminders(now = Date.now(), force = false) {
    const operation = this.queue.then(async () => {
      if (!this.data.reminderSettings.enabled) { if (force) new Notice('Fälligkeits-Erinnerungen sind deaktiviert.'); return false; }
      const today = dayKey(now), lastDate = shiftDate(today, this.data.reminderSettings.leadDays);
      const seen = new Set(this.data.reminderState.day === today ? this.data.reminderState.seen : []);
      const eligible = attentionEntries(this.data).filter(e => e.date <= lastDate);
      const fresh = force ? eligible : eligible.filter(e => !seen.has(e.key));
      if (!fresh.length) { if (force) new Notice('Keine anstehenden oder überfälligen Fälligkeiten.'); return false; }
      const before = copy(this.data.reminderState); fresh.forEach(e => seen.add(e.key));
      this.data.reminderState = { day: today, seen: [...seen] };
      try { await this.saveData(copy(this.data)); }
      catch (error) { this.data.reminderState = before; console.error('Tagesplaner: Erinnerungsstatus konnte nicht gespeichert werden', error); return false; }
      const overdue = fresh.filter(e => e.date < today).length, dueToday = fresh.filter(e => e.date === today).length, upcoming = fresh.length - overdue - dueToday;
      new Notice('Tagesplaner: ' + overdue + ' überfällig · ' + dueToday + ' heute fällig · ' + upcoming + ' demnächst. Heute zeigt fällige und überfällige Aufgaben, Unteraufgaben und Nachfragen; weitere Termine findest du über die Aufgabenfilter.', 10000);
      return true;
    });
    this.queue = operation.catch(error => console.error(error)); return operation;
  }
  async tick(now = Date.now()) {
    await this.runMaintenance(now); await this.checkReminders(now);
    if (this.lastDay !== dayKey(now)) { this.lastDay = dayKey(now); this.refreshViews(); }
  }
  changeStatus(id, status) { return this.mutate(data => { const task = data.tasks.find(t => t.id === id); if (!task) throw new Error('Aufgabe nicht gefunden.'); setStatus(task, status); }); }
  changePriority(id, priority) {
    return this.mutate(data => {
      if (!PRIORITIES.some(p => p.name === priority)) throw new Error('Unbekannte Priorität.');
      const task = data.tasks.find(t => t.id === id);
      if (!task || task.archivedAt) throw new Error('Die Aufgabe ist nicht mehr bearbeitbar.');
      task.priority = priority; task.updatedAt = Date.now();
    });
  }
  async createTaskFromTemplate(id, defaultProjectId = null) {
    let taskId = null;
    const ok = await this.mutate(data => {
      const template = data.templates.find(t => t.id === id); if (!template) throw new Error('Vorlage nicht gefunden.');
      const values = templateFields(template), now = Date.now();
      taskId = uid(); data.tasks.push({
        id: taskId, title: values.title.trim() || template.name, note: values.note, priority: values.priority,
        status: values.status, projectId: data.projects.some(p => p.id === values.projectId) ? values.projectId : (data.projects.some(p => p.id === defaultProjectId) ? defaultProjectId : null),
        waitingFor: values.waitingFor, followUpDate: values.followUpInDays == null ? '' : shiftDate(dayKey(now), values.followUpInDays),
        due: values.dueInDays == null ? (values.repeat.frequency !== 'none' ? dayKey(now) : '') : dayKey(shiftDay(now, values.dueInDays)),
        subtasks: values.subtasks.map(s => ({ id: uid(), title: s.title, done: false, due: s.dueInDays == null ? '' : shiftDate(dayKey(now), s.dueInDays) })), worklog: [],
        recurrenceId: null, occurrenceDate: '',
        createdAt: now, updatedAt: now, completedAt: null, archivedAt: null, completionDateEstimated: false
      });
      configureRecurrence(data, data.tasks[data.tasks.length - 1], values.repeat, now);
    });
    return ok ? taskId : false;
  }
  async activate(tab = 'board') {
    let leaf = this.app.workspace.getLeavesOfType(VIEW)[0];
    if (!leaf) { leaf = this.app.workspace.getLeaf(true); await leaf.setViewState({ type: VIEW, active: true }); }
    leaf.view.tab = tab; leaf.view.render(); await this.app.workspace.revealLeaf(leaf);
  }
  onunload() { this.app.workspace.detachLeavesOfType(VIEW); }
};
