const { Plugin, ItemView, Modal, Notice } = require('obsidian');
const VIEW = 'tagesplaner-view';
const DAY = 86400000;
const COLS = [
  { name: 'ToDo', key: 'open' }, { name: 'In Progress', key: 'progress' },
  { name: 'Waiting', key: 'waiting' }, { name: 'Done', key: 'done' }
];
const PRIORITIES = [
  { name: 'low', key: 'low' }, { name: 'mid', key: 'mid' },
  { name: 'high', key: 'high' }, { name: 'immediately', key: 'immediately' }
];
const LEGACY_STATUS = Object.freeze({
  'Offen': 'ToDo', 'In Bearbeitung': 'In Progress',
  'Warten auf Person': 'Waiting', 'Delayed': 'Waiting', 'Fertig': 'Done'
});
const copy = value => JSON.parse(JSON.stringify(value));
const uid = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);
const stamp = value => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
const hourText = value => (Math.round((Number(value) || 0) * 10) / 10).toLocaleString('de-CH') + ' h';
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
function templateFields(source = {}) {
  const offset = source.dueInDays;
  return {
    title: String(source.title || ''), note: String(source.note || ''),
    priority: PRIORITIES.some(p => p.name === source.priority) ? source.priority : 'mid',
    status: ['ToDo', 'In Progress', 'Waiting'].includes(source.status) ? source.status : 'ToDo',
    estimateHours: Number.isFinite(Number(source.estimateHours)) ? Math.max(0, Number(source.estimateHours)) : 0,
    dueInDays: offset !== null && offset !== undefined && offset !== '' && Number.isInteger(Number(offset)) && Number(offset) >= 0 && Number(offset) <= 3650 ? Number(offset) : null,
    subtasks: Array.isArray(source.subtasks) ? source.subtasks.map(s => ({ title: String(s.title || '').trim() })).filter(s => s.title) : []
  };
}
function normalize(raw, now = Date.now()) {
  if (raw && !Array.isArray(raw) && raw.schemaVersion > 2) throw new Error('Diese Daten benötigen eine neuere Tagesplaner-Version.');
  const source = Array.isArray(raw) ? { tasks: raw } : raw || {};
  if (source.tasks != null && !Array.isArray(source.tasks)) throw new Error('Das gespeicherte Aufgabenformat ist ungültig.');
  if (source.templates != null && !Array.isArray(source.templates)) throw new Error('Das gespeicherte Vorlagenformat ist ungültig.');
  const tasks = (source.tasks || []).map(t => {
    if (!t || typeof t !== 'object') throw new Error('Eine gespeicherte Aufgabe ist ungültig.');
    const incomingStatus = Object.prototype.hasOwnProperty.call(LEGACY_STATUS, t.status) ? LEGACY_STATUS[t.status] : t.status;
    const status = COLS.some(c => c.name === incomingStatus) ? incomingStatus : 'ToDo';
    return {
      ...t, id: String(t.id || uid()), title: String(t.title || 'Ohne Titel'), status,
      priority: PRIORITIES.some(p => p.name === t.priority) ? t.priority : 'mid',
      due: dateKeyValid(t.due) ? t.due : '', note: String(t.note || ''), estimateHours: Math.max(0, Number(t.estimateHours) || 0),
      createdAt: stamp(t.createdAt), updatedAt: stamp(t.updatedAt),
      completedAt: status === 'Done' ? stamp(t.completedAt) || now : null,
      completionDateEstimated: status === 'Done' && (!!t.completionDateEstimated || !stamp(t.completedAt)),
      archivedAt: status === 'Done' ? stamp(t.archivedAt) : null,
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.map(s => ({ ...s, id: String(s.id || uid()), title: String(s.title || ''), done: !!s.done })) : [],
      worklog: Array.isArray(t.worklog) ? t.worklog.map(e => ({ ...e, id: String(e.id || uid()), text: String(e.text || ''), at: stamp(e.at) || now })) : []
    };
  });
  const templates = (source.templates || []).map(t => {
    if (!t || typeof t !== 'object') throw new Error('Eine gespeicherte Vorlage ist ungültig.');
    return { id: String(t.id || uid()), name: String(t.name || 'Ohne Namen'), ...templateFields(t), createdAt: stamp(t.createdAt), updatedAt: stamp(t.updatedAt) };
  });
  return { ...source, schemaVersion: 2, tasks, templates, settings: { ...source.settings, weeklyCapacityHours: Number(source.settings?.weeklyCapacityHours) > 0 ? Number(source.settings.weeklyCapacityHours) : 40 } };
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
function remaining(task) {
  if (task.status === 'Done') return 0;
  const ratio = task.subtasks.length ? task.subtasks.filter(s => !s.done).length / task.subtasks.length : 1;
  return task.estimateHours * ratio;
}
function metrics(data, now = Date.now()) {
  const today = dayKey(now), sunday = dayKey(shiftDay(now, (7 - new Date(now).getDay()) % 7));
  const tasks = data.tasks, active = tasks.filter(t => !t.archivedAt && t.status !== 'Done'), done = tasks.filter(t => t.status === 'Done');
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = dayKey(shiftDay(now, i - 6));
    return { key, count: done.filter(t => !t.completionDateEstimated && t.completedAt && t.completedAt <= now && dayKey(t.completedAt) === key).length };
  });
  const scheduled = active.filter(t => t.due ? t.due <= sunday : t.status === 'In Progress');
  const plannedHours = scheduled.reduce((n, t) => n + remaining(t), 0);
  return {
    today, active, done, week, scheduled, plannedHours, capacity: data.settings.weeklyCapacityHours,
    utilization: Math.round(plannedHours / data.settings.weeklyCapacityHours * 100),
    overdue: active.filter(t => t.due && t.due < today), dueToday: active.filter(t => t.due === today),
    inProgress: active.filter(t => t.status === 'In Progress'), waiting: active.filter(t => t.status === 'Waiting'),
    done7: week.reduce((n, d) => n + d.count, 0),
    done30: done.filter(t => !t.completionDateEstimated && t.completedAt && dayKey(t.completedAt) >= dayKey(shiftDay(now, -29)) && t.completedAt <= now).length,
    subtasks: tasks.reduce((n, t) => n + t.subtasks.length, 0), subtasksDone: tasks.reduce((n, t) => n + t.subtasks.filter(s => s.done).length, 0),
    unestimated: scheduled.filter(t => !t.estimateHours).length
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
    this.isTemplate = options.mode === 'template'; this.saving = false; this.subtaskRows = [];
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
    PRIORITIES.forEach(p => this.priorityInput.createEl('option', { text: p.name, value: p.name })); this.priorityInput.value = task?.priority || 'mid';
    this.statusInput = field(this.taskId ? 'Status' : 'Startstatus', 'select', null, '');
    const statusOptions = this.taskId && !this.isTemplate ? COLS : COLS.filter(c => c.name !== 'Done');
    statusOptions.forEach(c => this.statusInput.createEl('option', { text: c.name, value: c.name }));
    this.statusInput.value = statusOptions.some(c => c.name === task?.status) ? task.status : 'ToDo';
    if (this.isTemplate) {
      const offset = savedTemplate ? savedTemplate.dueInDays : (dateKeyValid(task?.due) ? Math.max(0, Math.round((Date.parse(task.due + 'T00:00:00Z') - Date.parse(dayKey() + 'T00:00:00Z')) / DAY)) : null);
      this.offsetInput = field('Fällig in Tagen ab Erstellung · optional', 'input', 'number', offset);
      this.offsetInput.min = '0'; this.offsetInput.max = '3650'; this.offsetInput.step = '1'; this.offsetInput.placeholder = '0 = am Tag der Erstellung';
    } else this.dueInput = field('Fällig am · optional', 'input', 'date', task?.due);
    this.estimateInput = field('Geschätzter Gesamtaufwand in Stunden · optional', 'input', 'number', task?.estimateHours || '');
    this.estimateInput.min = '0'; this.estimateInput.step = '0.25'; this.estimateInput.placeholder = 'z. B. 2';
    this.noteInput = field('Beschreibung · optional', 'textarea', null, task?.note); this.noteInput.rows = 3;
    const subSection = form.createDiv('tp-modal-subtasks'); subSection.createEl('h3', { text: 'Unteraufgaben' });
    this.subtaskList = subSection.createDiv('tp-modal-subtask-list');
    this.originalSubtasks = copy(task?.subtasks || []);
    this.subtaskRows = copy(task?.subtasks || []).map(s => ({ id: s.id || uid(), title: s.title, done: !this.isTemplate && !!s.done })); this.renderSubtasks();
    button(subSection, '+ Unteraufgabe', () => { this.subtaskRows.push({ id: uid(), title: '', done: false }); this.renderSubtasks(); this.subtaskList.lastElementChild?.querySelector('input[type=text]')?.focus(); });
    const actions = form.createDiv('tp-inline-actions');
    this.saveButton = actions.createEl('button', { text: this.isTemplate ? 'Vorlage speichern' : (task ? 'Änderungen speichern' : 'Aufgabe erstellen'), cls: 'mod-cta', type: 'submit' });
    if (!this.isTemplate && !this.taskId) this.fromTemplateButton = button(actions, 'Aufgabe nach Vorlage erstellen', () => new TemplatePickerModal(this.app, this.plugin, this).open());
    button(actions, 'Abbrechen', () => this.close()); form.onsubmit = e => { e.preventDefault(); void this.submit(); };
    if (this.options.initialTemplateId && !this.taskId && !this.isTemplate) {
      this.applyTemplate(this.options.initialTemplateId);
    }
    (this.nameInput || this.titleInput).focus();
  }
  renderSubtasks() {
    this.subtaskList.empty();
    for (const item of this.subtaskRows) {
      const row = this.subtaskList.createDiv('tp-modal-subtask');
      if (!this.isTemplate) {
        const check = row.createEl('input', { type: 'checkbox', attr: { 'aria-label': 'Unteraufgabe erledigt' } }); check.checked = item.done; check.onchange = () => { item.done = check.checked; };
      }
      const input = row.createEl('input', { type: 'text', attr: { placeholder: 'Unteraufgabe', 'aria-label': 'Titel der Unteraufgabe' } }); input.value = item.title;
      input.oninput = () => { item.title = input.value; };
      button(row, '×', () => { this.subtaskRows = this.subtaskRows.filter(s => s.id !== item.id); this.renderSubtasks(); }, 'tp-icon-button').setAttribute('aria-label', 'Unteraufgabe entfernen');
    }
  }
  applyTemplate(id) {
    const source = this.plugin.data.templates.find(t => t.id === id);
    if (!source) { new Notice('Diese Vorlage ist nicht mehr vorhanden.'); return false; }
    const values = templateFields(source);
    this.titleInput.value = values.title; this.noteInput.value = values.note;
    this.priorityInput.value = values.priority; this.statusInput.value = values.status;
    this.estimateInput.value = values.estimateHours ? String(values.estimateHours) : '';
    this.dueInput.value = values.dueInDays == null ? '' : dayKey(shiftDay(Date.now(), values.dueInDays));
    this.subtaskRows = values.subtasks.map(s => ({ id: uid(), title: s.title, done: false })); this.renderSubtasks(); return true;
  }
  async submit() {
    if (this.saving) return;
    const title = this.titleInput.value.trim(), name = this.nameInput?.value.trim();
    if (this.isTemplate ? !name : !title) { new Notice(this.isTemplate ? 'Bitte gib der Vorlage einen Namen.' : 'Bitte gib einen Aufgabentitel ein.'); (this.nameInput || this.titleInput).focus(); return; }
    if (this.isTemplate && this.plugin.data.templates.some(t => t.id !== this.options.templateId && t.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { new Notice('Eine Vorlage mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.'); return; }
    if (!this.estimateInput.checkValidity()) { this.estimateInput.reportValidity(); return; }
    if (this.dueInput && (!this.dueInput.checkValidity() || (this.dueInput.value && !dateKeyValid(this.dueInput.value)))) { this.dueInput.reportValidity(); return; }
    if (this.offsetInput && !this.offsetInput.checkValidity()) { this.offsetInput.reportValidity(); return; }
    const estimateHours = Number(this.estimateInput.value) || 0;
    const dueInDays = this.offsetInput && this.offsetInput.value !== '' ? Number(this.offsetInput.value) : null;
    if (!Number.isFinite(estimateHours) || estimateHours < 0 || (dueInDays != null && (!Number.isInteger(dueInDays) || dueInDays < 0 || dueInDays > 3650))) return;
    if (!PRIORITIES.some(p => p.name === this.priorityInput.value)) return;
    const status = this.statusInput.value;
    if (!COLS.some(c => c.name === status) || ((!this.taskId || this.isTemplate) && status === 'Done')) return;
    this.saving = true; this.saveButton.disabled = true;
    const subtasks = this.subtaskRows.filter(s => s.title.trim()).map(s => ({ id: s.id, title: s.title.trim(), done: !!s.done }));
    const values = { title, note: this.noteInput.value.trim(), priority: this.priorityInput.value, estimateHours, updatedAt: Date.now() };
    const ok = await this.plugin.mutate(data => {
      if (this.isTemplate) {
        if (data.templates.some(t => t.id !== this.options.templateId && t.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error('Eine Vorlage mit diesem Namen existiert bereits.');
        const fields = { name, ...templateFields({ ...values, status, dueInDays, subtasks }), updatedAt: Date.now() };
        if (this.options.templateId) {
          const template = data.templates.find(t => t.id === this.options.templateId); if (!template) throw new Error('Vorlage nicht gefunden.'); Object.assign(template, fields);
        } else data.templates.push({ id: uid(), ...fields, createdAt: Date.now() });
      } else if (this.taskId) {
        const task = data.tasks.find(t => t.id === this.taskId); if (!task || task.archivedAt) throw new Error('Diese Aufgabe ist nicht mehr bearbeitbar.');
        const subtasksChanged = JSON.stringify(subtasks) !== JSON.stringify(this.originalSubtasks);
        if (subtasksChanged && JSON.stringify(task.subtasks) !== JSON.stringify(this.originalSubtasks)) throw new Error('Unteraufgaben wurden inzwischen geändert. Bitte den Dialog erneut öffnen.');
        Object.assign(task, values, { due: this.dueInput.value }); if (subtasksChanged) task.subtasks = subtasks;
        if (status !== this.originalStatus) setStatus(task, status);
      } else data.tasks.push({ id: uid(), ...values, status, due: this.dueInput.value, createdAt: Date.now(), completedAt: null, archivedAt: null, subtasks, worklog: [] });
    });
    if (ok) this.close(); else { this.saving = false; this.saveButton.disabled = false; }
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
    this.contentEl.createEl('p', { text: 'Wähle eine Vorlage aus. Die Aufgabe wird direkt erstellt und lässt sich anschließend frei bearbeiten.', cls: 'tp-muted' });
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
      const meta = row.createDiv('tp-meta'); meta.createSpan({ text: t.priority, cls: 'tp-priority-tag tp-priority-' + t.priority });
      meta.createSpan({ text: t.subtasks.length + ' Unteraufgaben · ' + t.status, cls: 'tp-muted' });
      if (t.title) row.createDiv({ text: t.title, cls: 'tp-template-title' });
    }
    if (!templates.length) this.list.createDiv({ text: search ? 'Keine passenden Vorlagen.' : 'Noch keine Vorlagen. Erstelle zuerst eine über + Vorlage neben + Aufgabe.', cls: 'tp-empty' });
  }
  async choose(id) {
    if (this.creating) return false;
    this.creating = true; this.searchInput.disabled = true; this.cancelButton.disabled = true; this.templateButtons.forEach(b => { b.disabled = true; });
    const ok = await this.plugin.createTaskFromTemplate(id);
    if (ok) { this.close(); this.taskModal?.close(); }
    else { this.creating = false; this.searchInput.disabled = false; this.cancelButton.disabled = false; this.renderOptions(); }
    return ok;
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

class PlannerView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf); this.plugin = plugin; this.tab = 'board'; this.taskBoard = 'status'; this.drafts = new Map();
    this.draftInputs = new Map(); this.draftControls = new Map(); this.pendingDrafts = new Set();
    this.expanded = new Set(); this.archiveSearch = ''; this.scrollPositions = new Map();
  }
  getViewType() { return VIEW; }
  getDisplayText() { return 'Tagesplaner'; }
  getIcon() { return 'layout-dashboard'; }
  async onOpen() { await this.plugin.archiveExpired(); this.render(); }
  async onClose() { this.drafts.clear(); }
  render() {
    this.draftInputs = new Map(); this.draftControls = new Map();
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
    button(headActions, '+ Aufgabe', () => new TaskModal(this.app, this.plugin).open(), 'mod-cta');
    button(headActions, '+ Vorlage', () => new TemplateModal(this.app, this.plugin).open());
    const nav = root.createDiv('tp-tabs'); nav.setAttribute('aria-label', 'Planner-Ansichten');
    const archiveCount = this.plugin.data.tasks.filter(t => t.archivedAt).length;
    for (const [id, label] of [['board', 'Aufgaben'], ['dashboard', 'Dashboard'], ['templates', 'Vorlagenverwaltung'], ['archive', 'Archiv · ' + archiveCount]]) {
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
    if (this.tab === 'dashboard') this.renderDashboard(body); else if (this.tab === 'archive') this.renderArchive(body); else if (this.tab === 'templates') this.renderTemplates(body); else this.renderBoard(body);
    const viewKey = this.tab === 'board' ? 'board:' + this.taskBoard : this.tab;
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
    if (this.taskBoard === 'priority') this.renderTaskBoard(parent, 'Prioritäten', 'Nicht abgeschlossene Aufgaben nach Dringlichkeit · Teil deiner Aufgaben', 'priority', PRIORITIES);
    else this.renderTaskBoard(parent, 'Status', 'Nach Arbeitsstand verschieben · Teil deiner Aufgaben', 'status', COLS);
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
      const meta = card.createDiv('tp-meta'); meta.createSpan({ text: template.priority, cls: 'tp-priority-tag tp-priority-' + template.priority });
      meta.createSpan({ text: template.status, cls: 'tp-badge' });
      if (template.estimateHours) meta.createSpan({ text: hourText(template.estimateHours), cls: 'tp-badge' });
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
  renderTaskBoard(parent, heading, hint, field, columns) {
    const group = parent.createDiv('tp-board-group'); group.setAttribute('data-board', field);
    const headingEl = group.createDiv('tp-board-heading'); headingEl.createEl('h3', { text: heading });
    headingEl.createDiv({ text: hint, cls: 'tp-muted' });
    const board = group.createDiv('tp-board-scroll').createDiv('tp-board');
    for (const col of columns) {
      const tasks = this.plugin.data.tasks.filter(t => !t.archivedAt && t[field] === col.name && (field !== 'priority' || t.status !== 'Done'));
      const lane = board.createDiv('tp-lane ' + (field === 'priority' ? 'tp-priority-' : 'tp-') + col.key);
      lane.setAttribute('data-value', col.name);
      const head = lane.createDiv('tp-lane-head'); head.createEl('h3', { text: col.name }); head.createSpan({ text: String(tasks.length), cls: 'tp-count' });
      if (field === 'status' && col.key === 'done') lane.createDiv({ text: 'Nach 24 Stunden automatisch im Archiv', cls: 'tp-lane-hint' });
      lane.ondragover = e => { if (e.dataTransfer?.types.includes('application/x-tagesplaner')) { e.preventDefault(); lane.addClass('tp-over'); } };
      lane.ondragleave = e => { if (!lane.contains(e.relatedTarget)) lane.removeClass('tp-over'); };
      lane.ondrop = e => {
        e.preventDefault(); lane.removeClass('tp-over'); const id = e.dataTransfer?.getData('application/x-tagesplaner');
        if (id) void (field === 'priority' ? this.plugin.changePriority(id, col.name) : this.plugin.changeStatus(id, col.name));
      };
      if (!tasks.length) lane.createDiv({ text: 'Hier ist gerade Platz.', cls: 'tp-empty-lane' });
      tasks.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')).forEach(t => this.renderCard(lane, t, false));
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
    meta.createSpan({ text: task.priority, cls: 'tp-priority-tag tp-priority-' + task.priority });
    if (task.due) meta.createSpan({ text: shortDate(task.due), cls: 'tp-badge' + (!archived && task.status !== 'Done' && task.due < dayKey() ? ' tp-overdue' : '') });
    if (task.estimateHours) meta.createSpan({ text: hourText(task.estimateHours) + ' geplant', cls: 'tp-badge' });
    if (task.completedAt) meta.createSpan({ text: task.completionDateEstimated ? 'Vor dem Update erledigt · Archivtimer ab Update' : 'Erledigt ' + timeText(task.completedAt), cls: 'tp-muted' });
    if (archived) meta.createSpan({ text: 'Archiviert ' + timeText(task.archivedAt), cls: 'tp-muted' });
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
      COLS.forEach(col => select.createEl('option', { text: col.name, value: col.name })); select.value = task.status;
      select.onchange = () => this.plugin.changeStatus(task.id, select.value); button(actions, 'Bearbeiten', () => new TaskModal(this.app, this.plugin, task.id).open());
      const priority = actions.createEl('select', { cls: 'tp-priority-select', attr: { 'aria-label': 'Priorität für ' + task.title } });
      PRIORITIES.forEach(p => priority.createEl('option', { text: p.name, value: p.name })); priority.value = task.priority;
      priority.onchange = () => this.plugin.changePriority(task.id, priority.value);
    }
    const sub = card.createDiv('tp-section'), subDone = task.subtasks.filter(s => s.done).length;
    sub.createDiv({ text: 'Unteraufgaben' + (task.subtasks.length ? ' · ' + subDone + '/' + task.subtasks.length : ''), cls: 'tp-section-title' });
    if (task.subtasks.length) progress(sub, subDone / task.subtasks.length * 100, 'Unteraufgaben abgeschlossen');
    for (const item of task.subtasks) {
      const row = sub.createDiv('tp-subtask'), label = row.createEl('label'), check = label.createEl('input', { type: 'checkbox' });
      check.checked = item.done; check.disabled = archived; label.createSpan({ text: item.title, cls: item.done ? 'tp-sub-done' : '' });
      check.onchange = () => this.editTask(task.id, t => { const s = t.subtasks.find(s => s.id === item.id); if (s) s.done = check.checked; });
      if (!archived) button(row, '×', () => this.editTask(task.id, t => { t.subtasks = t.subtasks.filter(s => s.id !== item.id); }), 'tp-icon-button').setAttribute('aria-label', 'Unteraufgabe entfernen: ' + item.title);
    }
    if (!archived) {
      const form = sub.createEl('form', { cls: 'tp-sub-form' }), input = form.createEl('input', { type: 'text', attr: { placeholder: 'Neue Unteraufgabe …', 'aria-label': 'Neue Unteraufgabe für ' + task.title } });
      const key = task.id + ':sub'; this.bindDraft(input, key);
      const add = form.createEl('button', { text: '+', type: 'submit', attr: { 'aria-label': 'Unteraufgabe hinzufügen' } });
      this.registerDraftControl(key, add);
      form.onsubmit = async e => {
        e.preventDefault(); const value = input.value.trim(); if (!value) return;
        return this.saveDraft(task.id, 'sub', t => t.subtasks.push({ id: uid(), title: value, done: false }));
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
    const metric = (label, value, hint, tone = '') => {
      const tile = kpis.createDiv('tp-kpi ' + tone); tile.createDiv({ text: label, cls: 'tp-muted' }); tile.createDiv({ text: String(value), cls: 'tp-kpi-value' }); tile.createDiv({ text: hint, cls: 'tp-kpi-hint' });
    };
    metric('Offene Aufgaben', m.active.length, 'Alle noch nicht fertigen Aufgaben'); metric('In Progress', m.inProgress.length, 'Aktuell im Fokus', 'tp-progress');
    metric('Heute fällig', m.dueToday.length, 'Noch zu erledigen'); metric('Überfällig', m.overdue.length, 'Fälligkeit bereits überschritten', m.overdue.length ? 'tp-risk' : '');
    metric('Erledigt · 7 Tage', m.done7, 'Heute und die letzten 6 Tage', 'tp-done'); metric('Erledigt · 30 Tage', m.done30, 'Inklusive archivierter Aufgaben', 'tp-done');
    metric('Waiting', m.waiting.length, 'Braucht eventuell Unterstützung', 'tp-waiting'); metric('Unteraufgaben', m.subtasksDone + '/' + m.subtasks, 'Erledigt / gesamt, inklusive Archiv');
    const grid = parent.createDiv('tp-dashboard-grid');
    const panel = title => { const box = grid.createDiv('tp-panel'); box.createEl('h4', { text: title }); return box; };
    const capacity = panel('Geplanter Aufwand bis Sonntag'); capacity.createDiv({ text: m.utilization + ' %', cls: 'tp-capacity-value' + (m.utilization > 100 ? ' tp-warning' : '') });
    capacity.createDiv({ text: hourText(m.plannedHours) + ' geschätzter Restaufwand / ' + hourText(m.capacity) + ' Wochenkapazität', cls: 'tp-muted' });
    progress(capacity, m.utilization, 'Geplanter Aufwand relativ zur Wochenkapazität');
    const form = capacity.createEl('form', { cls: 'tp-capacity-form' }), label = form.createEl('label', { text: 'Wochenkapazität (h)' });
    const input = label.createEl('input', { type: 'number' }); input.min = '0.25'; input.step = '0.25'; input.required = true; input.value = String(m.capacity);
    const save = form.createEl('button', { text: 'Speichern', type: 'submit' });
    form.onsubmit = async e => {
      e.preventDefault(); if (!input.checkValidity()) { input.reportValidity(); return; }
      const value = Number(input.value); if (!Number.isFinite(value) || value <= 0 || save.disabled) return; save.disabled = true;
      if (!await this.plugin.mutate(data => { data.settings.weeklyCapacityHours = value; })) save.disabled = false;
    };
    capacity.createEl('p', { text: 'Enthält offene Aufgaben mit Fälligkeit bis Sonntag (auch überfällige) sowie undatierte Aufgaben in Bearbeitung. Restaufwand sinkt anteilig mit erledigten Unteraufgaben. Keine Zeiterfassung.', cls: 'tp-help' });
    if (m.unestimated) capacity.createDiv({ text: m.unestimated + ' eingeplante Aufgaben haben noch keine Aufwandsschätzung.', cls: 'tp-help tp-warning' });
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
      row.createSpan({ text: col.name }); row.createSpan({ text: String(count), cls: 'tp-count' }); progress(row, count / Math.max(1, this.plugin.data.tasks.filter(t => !t.archivedAt).length) * 100, col.name);
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
    await this.archiveExpired(); this.lastDay = dayKey();
    this.registerInterval(window.setInterval(() => {
      void this.archiveExpired(); if (this.lastDay !== dayKey()) { this.lastDay = dayKey(); this.refreshViews(); }
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
  changeStatus(id, status) { return this.mutate(data => { const task = data.tasks.find(t => t.id === id); if (!task) throw new Error('Aufgabe nicht gefunden.'); setStatus(task, status); }); }
  changePriority(id, priority) {
    return this.mutate(data => {
      if (!PRIORITIES.some(p => p.name === priority)) throw new Error('Unbekannte Priorität.');
      const task = data.tasks.find(t => t.id === id);
      if (!task || task.archivedAt) throw new Error('Die Aufgabe ist nicht mehr bearbeitbar.');
      task.priority = priority; task.updatedAt = Date.now();
    });
  }
  createTaskFromTemplate(id) {
    return this.mutate(data => {
      const template = data.templates.find(t => t.id === id); if (!template) throw new Error('Vorlage nicht gefunden.');
      const values = templateFields(template), now = Date.now();
      data.tasks.push({
        id: uid(), title: values.title.trim() || template.name, note: values.note, priority: values.priority,
        status: values.status, estimateHours: values.estimateHours,
        due: values.dueInDays == null ? '' : dayKey(shiftDay(now, values.dueInDays)),
        subtasks: values.subtasks.map(s => ({ id: uid(), title: s.title, done: false })), worklog: [],
        createdAt: now, updatedAt: now, completedAt: null, archivedAt: null, completionDateEstimated: false
      });
    });
  }
  async activate(tab = 'board') {
    let leaf = this.app.workspace.getLeavesOfType(VIEW)[0];
    if (!leaf) { leaf = this.app.workspace.getLeaf(true); await leaf.setViewState({ type: VIEW, active: true }); }
    leaf.view.tab = tab; leaf.view.render(); await this.app.workspace.revealLeaf(leaf);
  }
  onunload() { this.app.workspace.detachLeavesOfType(VIEW); }
};
