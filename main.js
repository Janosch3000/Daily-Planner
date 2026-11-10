const { Plugin, ItemView, Modal, Notice } = require('obsidian');
const VIEW = 'tagesplaner-view';
const DAY = 86400000;
const COLS = [
  { name: 'In Bearbeitung', key: 'progress' }, { name: 'Offen', key: 'open' },
  { name: 'Warten auf Person', key: 'waiting' }, { name: 'Delayed', key: 'delayed' }, { name: 'Fertig', key: 'done' }
];
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
function normalize(raw, now = Date.now()) {
  if (raw && !Array.isArray(raw) && raw.schemaVersion > 2) throw new Error('Diese Daten benötigen eine neuere Tagesplaner-Version.');
  const source = Array.isArray(raw) ? { tasks: raw } : raw || {};
  if (source.tasks != null && !Array.isArray(source.tasks)) throw new Error('Das gespeicherte Aufgabenformat ist ungültig.');
  const tasks = (source.tasks || []).map(t => {
    if (!t || typeof t !== 'object') throw new Error('Eine gespeicherte Aufgabe ist ungültig.');
    const status = COLS.some(c => c.name === t.status) ? t.status : 'Offen';
    return {
      ...t, id: String(t.id || uid()), title: String(t.title || 'Ohne Titel'), status,
      due: dateKeyValid(t.due) ? t.due : '', note: String(t.note || ''), estimateHours: Math.max(0, Number(t.estimateHours) || 0),
      createdAt: stamp(t.createdAt), updatedAt: stamp(t.updatedAt),
      completedAt: status === 'Fertig' ? stamp(t.completedAt) || now : null,
      completionDateEstimated: status === 'Fertig' && (!!t.completionDateEstimated || !stamp(t.completedAt)),
      archivedAt: status === 'Fertig' ? stamp(t.archivedAt) : null,
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.map(s => ({ ...s, id: String(s.id || uid()), title: String(s.title || ''), done: !!s.done })) : [],
      worklog: Array.isArray(t.worklog) ? t.worklog.map(e => ({ ...e, id: String(e.id || uid()), text: String(e.text || ''), at: stamp(e.at) || now })) : []
    };
  });
  return { ...source, schemaVersion: 2, tasks, settings: { ...source.settings, weeklyCapacityHours: Number(source.settings?.weeklyCapacityHours) > 0 ? Number(source.settings.weeklyCapacityHours) : 40 } };
}
function setStatus(task, status, now = Date.now()) {
  if (!COLS.some(c => c.name === status)) throw new Error('Unbekannter Status.');
  if (task.status !== status) { task.completedAt = status === 'Fertig' ? now : null; task.completionDateEstimated = false; }
  task.status = status; task.archivedAt = null; task.updatedAt = now;
}
function archiveDue(data, now = Date.now()) {
  let changed = false;
  for (const task of data.tasks) {
    if (task.status === 'Fertig' && !task.archivedAt && task.completedAt && now - task.completedAt >= DAY) { task.archivedAt = now; changed = true; }
  }
  return changed;
}
function remaining(task) {
  if (task.status === 'Fertig') return 0;
  const ratio = task.subtasks.length ? task.subtasks.filter(s => !s.done).length / task.subtasks.length : 1;
  return task.estimateHours * ratio;
}
function metrics(data, now = Date.now()) {
  const today = dayKey(now), sunday = dayKey(shiftDay(now, (7 - new Date(now).getDay()) % 7));
  const tasks = data.tasks, active = tasks.filter(t => !t.archivedAt && t.status !== 'Fertig'), done = tasks.filter(t => t.status === 'Fertig');
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = dayKey(shiftDay(now, i - 6));
    return { key, count: done.filter(t => !t.completionDateEstimated && t.completedAt && t.completedAt <= now && dayKey(t.completedAt) === key).length };
  });
  const scheduled = active.filter(t => t.due ? t.due <= sunday : t.status === 'In Bearbeitung');
  const plannedHours = scheduled.reduce((n, t) => n + remaining(t), 0);
  return {
    today, active, done, week, scheduled, plannedHours, capacity: data.settings.weeklyCapacityHours,
    utilization: Math.round(plannedHours / data.settings.weeklyCapacityHours * 100),
    overdue: active.filter(t => t.due && t.due < today), dueToday: active.filter(t => t.due === today),
    inProgress: active.filter(t => t.status === 'In Bearbeitung'), waiting: active.filter(t => ['Warten auf Person', 'Delayed'].includes(t.status)),
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
  constructor(app, plugin, taskId = null) { super(app); this.plugin = plugin; this.taskId = taskId; this.saving = false; }
  onOpen() {
    this.contentEl.empty(); this.contentEl.addClass('tp-modal');
    const task = this.plugin.data.tasks.find(t => t.id === this.taskId);
    this.contentEl.createEl('h2', { text: task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe' });
    const form = this.contentEl.createEl('form');
    const field = (text, tag, type, value) => {
      const label = form.createEl('label', { cls: 'tp-field', text });
      const input = label.createEl(tag, type ? { type } : {}); input.value = value || ''; return input;
    };
    this.titleInput = field('Aufgabe', 'input', 'text', task?.title); this.titleInput.required = true;
    this.dueInput = field('Fällig am · optional', 'input', 'date', task?.due);
    this.estimateInput = field('Geschätzter Gesamtaufwand in Stunden · optional', 'input', 'number', task?.estimateHours || '');
    this.estimateInput.min = '0'; this.estimateInput.step = '0.25'; this.estimateInput.placeholder = 'z. B. 2';
    this.noteInput = field('Beschreibung · optional', 'textarea', null, task?.note); this.noteInput.rows = 3;
    const actions = form.createDiv('tp-inline-actions');
    this.saveButton = actions.createEl('button', { text: task ? 'Änderungen speichern' : 'Aufgabe erstellen', cls: 'mod-cta', type: 'submit' });
    button(actions, 'Abbrechen', () => this.close()); form.onsubmit = e => { e.preventDefault(); void this.submit(); }; this.titleInput.focus();
  }
  async submit() {
    if (this.saving) return;
    const title = this.titleInput.value.trim();
    if (!title) { new Notice('Bitte gib einen Aufgabentitel ein.'); this.titleInput.focus(); return; }
    if (!this.dueInput.checkValidity() || !this.estimateInput.checkValidity()) { this.dueInput.reportValidity(); this.estimateInput.reportValidity(); return; }
    if (this.dueInput.value && !dateKeyValid(this.dueInput.value)) return;
    const estimateHours = Number(this.estimateInput.value) || 0;
    if (!Number.isFinite(estimateHours) || estimateHours < 0) return;
    this.saving = true; this.saveButton.disabled = true;
    const values = { title, due: this.dueInput.value, note: this.noteInput.value.trim(), estimateHours, updatedAt: Date.now() };
    const ok = await this.plugin.mutate(data => {
      if (this.taskId) {
        const task = data.tasks.find(t => t.id === this.taskId);
        if (!task || task.archivedAt) throw new Error('Diese Aufgabe ist nicht mehr bearbeitbar.');
        Object.assign(task, values);
      } else data.tasks.push({ id: uid(), ...values, status: 'Offen', createdAt: Date.now(), completedAt: null, archivedAt: null, subtasks: [], worklog: [] });
    });
    if (ok) this.close(); else { this.saving = false; this.saveButton.disabled = false; }
  }
  onClose() { this.contentEl.empty(); }
}

class PlannerView extends ItemView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; this.tab = 'board'; this.drafts = new Map(); this.expanded = new Set(); this.archiveSearch = ''; }
  getViewType() { return VIEW; }
  getDisplayText() { return 'Tagesplaner'; }
  getIcon() { return 'layout-dashboard'; }
  async onOpen() { await this.plugin.archiveExpired(); this.render(); }
  async onClose() { this.drafts.clear(); }
  render() {
    const root = this.contentEl || this.containerEl.children[1]; root.empty(); root.addClass('tp-root');
    const head = root.createDiv('tp-head'), heading = head.createDiv(); heading.createEl('h2', { text: 'Tagesplaner' });
    heading.createDiv({ text: 'Fokus für heute. Überblick für die Woche.', cls: 'tp-muted' });
    button(head, '+ Aufgabe', () => new TaskModal(this.app, this.plugin).open(), 'mod-cta');
    const nav = root.createDiv('tp-tabs'); nav.setAttribute('aria-label', 'Planner-Ansichten');
    const archiveCount = this.plugin.data.tasks.filter(t => t.archivedAt).length;
    for (const [id, label] of [['board', 'Aufgaben'], ['dashboard', 'Dashboard'], ['archive', 'Archiv · ' + archiveCount]]) {
      const b = button(nav, label, () => { this.tab = id; this.render(); }, this.tab === id ? 'tp-tab is-active' : 'tp-tab'); b.setAttribute('aria-pressed', String(this.tab === id));
    }
    const body = root.createDiv('tp-body');
    if (this.tab === 'dashboard') this.renderDashboard(body); else if (this.tab === 'archive') this.renderArchive(body); else this.renderBoard(body);
  }
  renderBoard(parent) {
    const board = parent.createDiv('tp-board');
    for (const col of COLS) {
      const tasks = this.plugin.data.tasks.filter(t => !t.archivedAt && t.status === col.name), lane = board.createDiv('tp-lane tp-' + col.key);
      const head = lane.createDiv('tp-lane-head'); head.createEl('h3', { text: col.name }); head.createSpan({ text: String(tasks.length), cls: 'tp-count' });
      if (col.key === 'done') lane.createDiv({ text: 'Nach 24 Stunden automatisch im Archiv', cls: 'tp-lane-hint' });
      lane.ondragover = e => { if (e.dataTransfer?.types.includes('application/x-tagesplaner')) { e.preventDefault(); lane.addClass('tp-over'); } };
      lane.ondragleave = e => { if (!lane.contains(e.relatedTarget)) lane.removeClass('tp-over'); };
      lane.ondrop = e => { e.preventDefault(); lane.removeClass('tp-over'); const id = e.dataTransfer?.getData('application/x-tagesplaner'); if (id) void this.plugin.changeStatus(id, col.name); };
      if (!tasks.length) lane.createDiv({ text: 'Hier ist gerade Platz.', cls: 'tp-empty-lane' });
      tasks.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')).forEach(t => this.renderCard(lane, t, false));
    }
  }
  async editTask(id, change) {
    return this.plugin.mutate(data => {
      const task = data.tasks.find(t => t.id === id); if (!task || task.archivedAt) throw new Error('Die Aufgabe wurde inzwischen archiviert.');
      change(task); task.updatedAt = Date.now();
    });
  }
  renderCard(parent, task, archived) {
    const card = parent.createDiv('tp-card'), title = card.createDiv('tp-card-head'); title.createEl('h4', { text: task.title, cls: 'tp-title' });
    if (!archived) {
      title.draggable = true; title.title = 'Am Titel ziehen, um die Kategorie zu ändern';
      title.ondragstart = e => { e.dataTransfer.setData('application/x-tagesplaner', task.id); e.dataTransfer.effectAllowed = 'move'; };
    }
    const meta = card.createDiv('tp-meta');
    if (task.due) meta.createSpan({ text: shortDate(task.due), cls: 'tp-badge' + (!archived && task.status !== 'Fertig' && task.due < dayKey() ? ' tp-overdue' : '') });
    if (task.estimateHours) meta.createSpan({ text: hourText(task.estimateHours) + ' geplant', cls: 'tp-badge' });
    if (task.completedAt) meta.createSpan({ text: task.completionDateEstimated ? 'Vor dem Update erledigt · Archivtimer ab Update' : 'Erledigt ' + timeText(task.completedAt), cls: 'tp-muted' });
    if (archived) meta.createSpan({ text: 'Archiviert ' + timeText(task.archivedAt), cls: 'tp-muted' });
    if (task.note) card.createDiv({ text: task.note, cls: 'tp-description' });
    const actions = card.createDiv('tp-card-actions');
    if (archived) button(actions, 'Wieder öffnen', () => this.plugin.changeStatus(task.id, 'Offen'));
    else {
      const select = actions.createEl('select', { attr: { 'aria-label': 'Status für ' + task.title } });
      COLS.forEach(col => select.createEl('option', { text: col.name, value: col.name })); select.value = task.status;
      select.onchange = () => this.plugin.changeStatus(task.id, select.value); button(actions, 'Bearbeiten', () => new TaskModal(this.app, this.plugin, task.id).open());
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
      const key = task.id + ':sub'; input.value = this.drafts.get(key) || ''; input.oninput = () => this.drafts.set(key, input.value);
      const add = form.createEl('button', { text: '+', type: 'submit', attr: { 'aria-label': 'Unteraufgabe hinzufügen' } });
      form.onsubmit = async e => {
        e.preventDefault(); const value = input.value.trim(); if (!value || add.disabled) return; add.disabled = true;
        const ok = await this.editTask(task.id, t => t.subtasks.push({ id: uid(), title: value, done: false }));
        if (ok) { this.drafts.delete(key); this.render(); } else add.disabled = false;
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
      const key = task.id + ':log'; input.value = this.drafts.get(key) || ''; input.oninput = () => this.drafts.set(key, input.value);
      const save = form.createEl('button', { text: 'Eintrag speichern', type: 'submit', cls: 'tp-small-button' });
      form.onsubmit = async e => {
        e.preventDefault(); const text = input.value.trim(); if (!text || save.disabled) return; save.disabled = true;
        const ok = await this.editTask(task.id, t => t.worklog.push({ id: uid(), text, at: Date.now() }));
        if (ok) { this.drafts.delete(key); this.render(); } else save.disabled = false;
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
    metric('Offene Aufgaben', m.active.length, 'Alle noch nicht fertigen Aufgaben'); metric('In Bearbeitung', m.inProgress.length, 'Aktuell im Fokus', 'tp-progress');
    metric('Heute fällig', m.dueToday.length, 'Noch zu erledigen'); metric('Überfällig', m.overdue.length, 'Fälligkeit bereits überschritten', m.overdue.length ? 'tp-delayed' : '');
    metric('Erledigt · 7 Tage', m.done7, 'Heute und die letzten 6 Tage', 'tp-done'); metric('Erledigt · 30 Tage', m.done30, 'Inklusive archivierter Aufgaben', 'tp-done');
    metric('Wartend / verzögert', m.waiting.length, 'Braucht eventuell Unterstützung', 'tp-waiting'); metric('Unteraufgaben', m.subtasksDone + '/' + m.subtasks, 'Erledigt / gesamt, inklusive Archiv');
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
  async activate(tab = 'board') {
    let leaf = this.app.workspace.getLeavesOfType(VIEW)[0];
    if (!leaf) { leaf = this.app.workspace.getLeaf(true); await leaf.setViewState({ type: VIEW, active: true }); }
    leaf.view.tab = tab; leaf.view.render(); await this.app.workspace.revealLeaf(leaf);
  }
  onunload() { this.app.workspace.detachLeavesOfType(VIEW); }
};
