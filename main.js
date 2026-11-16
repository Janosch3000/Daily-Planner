const { Plugin, ItemView, Modal, Notice } = require('obsidian');
const VIEW = 'tagesplaner-view';
const DAY = 86400000;
const COLS = [
  { name: 'ToDo', key: 'open', icon: 'square', glyph: '☐' }, { name: 'In Progress', key: 'progress', icon: 'construction', glyph: '🚧' },
  { name: 'Waiting', key: 'waiting', icon: 'clock', glyph: '◷' },
  { name: 'Done', key: 'done', icon: 'square-check', glyph: '☑' }
];
const PRIORITIES = [
  { name: 'low', key: 'low', icon: 'arrow-down', glyph: '↓', rank: 1 }, { name: 'mid', key: 'mid', icon: 'arrow-right', glyph: '→', rank: 2 },
  { name: 'high', key: 'high', icon: 'arrow-up', glyph: '↑', rank: 3 }, { name: 'immediately', key: 'immediately', icon: 'arrows-up', glyph: '⇈', rank: 4 }
];
const LEGACY_STATUS = Object.freeze({
  'Offen': 'ToDo', 'In Bearbeitung': 'In Progress',
  'Warten auf Person': 'Waiting', 'Delayed': 'Waiting', 'Fertig': 'Done'
});
const copy = value => JSON.parse(JSON.stringify(value));
const uid = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11);
const stamp = value => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
const SYMBOLS = {
  menu: [['path',{d:'M4 6h16M4 12h16M4 18h16'}]],
  home: [['path',{d:'M3 10l9-7 9 7M5 9v12h14V9M9 21v-8h6v8'}]],
  tasks: [['rect',{x:4,y:3,width:16,height:18,rx:2}],['path',{d:'M8 8l1 1 2-2M13 8h3M8 14l1 1 2-2M13 14h3'}]],
  repeat: [['path',{d:'M20 7H6l3-3M4 17h14l-3 3M20 7v5M4 17v-5'}]],
  calendar: [['rect',{x:3,y:5,width:18,height:16,rx:2}],['path',{d:'M7 3v4m10-4v4M3 11h18M8 15h2m4 0h2M8 18h2'}]],
  folder: [['path',{d:'M3 7V5a2 2 0 012-2h5l2 3h7a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z'}]],
  chart: [['path',{d:'M4 3v18h17M8 17v-5m5 5V7m5 10V4'}]],
  template: [['rect',{x:5,y:3,width:14,height:18,rx:2}],['path',{d:'M9 7h6M9 11h6M9 15h3'}]],
  archive: [['rect',{x:3,y:3,width:18,height:5,rx:1}],['path',{d:'M5 8v13h14V8M10 12h4'}]],
  trash: [['path',{d:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7'}]],
  bell: [['path',{d:'M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4'}]],
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
function shortDate(key) { return new Date(key + 'T12:00:00').toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit' }); }
function timeText(value) { return new Date(value).toLocaleString("en-GB", { dateStyle: 'short', timeStyle: 'short' }); }
function shiftDay(value, days) { const d = new Date(value); d.setDate(d.getDate() + days); return d.getTime(); }
const REPEAT_OPTIONS = [
  { value: 'none', label: "No recurrence" }, { value: 'daily', label: "Daily" },
  { value: 'weekly', label: "Weekly" }, { value: 'monthly', label: "Monthly" }
];
const validDate = value => dateKeyValid(value) ? value : '';
const offsetDays = value => value !== '' && value != null && Number.isInteger(Number(value)) && Math.abs(Number(value)) <= 3650 ? Number(value) : null;
function shiftDate(key, days) { return dayKey(shiftDay(new Date(key + 'T12:00:00').getTime(), days)); }
function daysBetween(start, end) { return Math.round((Date.parse(end + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) / DAY); }
function repeatRule(value = {}) {
  return {
    frequency: REPEAT_OPTIONS.some(r => r.value === value?.frequency) ? value.frequency : 'none',
    interval: Number.isInteger(Number(value?.interval)) && Number(value.interval) >= 1 && Number(value.interval) <= 365 ? Number(value.interval) : 1,
    ...(value?.frequency==='weekly'?{weekday:Number.isInteger(value.weekday)&&value.weekday>=0&&value.weekday<7?value.weekday:null}:{})
  };
}
function nextOccurrence(key, rule, anchorDay = Number(key.slice(-2))) {
  if (!dateKeyValid(key) || !['daily', 'weekly', 'monthly'].includes(rule.frequency)) return '';
  if (rule.frequency !== 'monthly') return shiftDate(key, rule.interval * (rule.frequency === 'weekly' ? 7 : 1));
  const [year, month] = key.split('-').map(Number), target = new Date(year, month - 1 + rule.interval, 1, 12);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12).getDate();
  target.setDate(Math.min(anchorDay, last)); return dayKey(target.getTime());
}
function projectName(data, id) { return data.projects.find(p => p.id === id)?.name || "No project"; }
function taskDefaults(task, baseDate = task.due || dayKey()) {
  return {
    title: task.title, note: task.note || '', status: task.status === 'Done' ? 'ToDo' : task.status,
    startTime: validTime(task.startTime), startOffsetDays: task.startDate ? daysBetween(baseDate, task.startDate) : null, dueTime: validTime(task.dueTime), priority: task.priority, projectId: task.projectId || null, waitingFor: task.waitingFor || '',
    followUpInDays: validDate(task.followUpDate) ? daysBetween(baseDate, task.followUpDate) : null,
    subtasks: task.subtasks.map(s => ({ title: s.title, dueInDays: validDate(s.due) ? daysBetween(baseDate, s.due) : null }))
  };
}
function recurringTask(series, date, now) {
  const d = series.defaults;
  return {
    id: uid(), title: d.title, note: d.note, status: d.status, priority: d.priority, projectId: d.projectId,
    ...normaliseSchedule({ due: date, dueTime: d.dueTime, startDate: d.startOffsetDays == null ? '' : shiftDate(date, d.startOffsetDays), startTime: d.startTime }), due: date, dueTime: validTime(d.dueTime), waitingFor: d.waitingFor, followUpDate: d.followUpInDays == null ? '' : shiftDate(date, d.followUpInDays),
    subtasks: d.subtasks.map(s => ({ id: uid(), title: s.title, done: false, due: s.dueInDays == null ? '' : shiftDate(date, s.dueInDays) })),
    worklog: [], recurrenceId: series.id, occurrenceDate: date,
    createdAt: now, updatedAt: now, completedAt: null, archivedAt: null, completionDateEstimated: false
  };
}
function resumeSeries(series, today = dayKey()) {
  if (!dateKeyValid(series.nextDate)) throw new Error("Set the next recurrence date first.");
  if (series.nextDate < today && series.frequency !== 'monthly') {
    const step = series.interval * (series.frequency === 'weekly' ? 7 : 1);
    series.nextDate = shiftDate(series.nextDate, Math.ceil(daysBetween(series.nextDate, today) / step) * step);
  } else {
    while (series.nextDate < today) {
      const next = nextOccurrence(series.nextDate, series, series.anchorDay);
      if (!dateKeyValid(next) || next <= series.nextDate) throw new Error("The recurrence needs a valid date.");
      series.nextDate = next;
    }
  }
  series.enabled = true;
}
function configureRecurrence(data, task, rule, now = Date.now()) {
  const config = repeatRule(rule), existing = data.recurrences.find(s => s.id === task.recurrenceId);
  if (config.frequency === 'none') { if (existing) existing.enabled = false; syncWeeklyData(data,now); return; }
  if (config.frequency === 'weekly') { configureWeekly(data,task,config,now); return; }
  if(existing?.mode==='continuous-weekly'){existing.mode='instances';delete existing.taskId;delete task.weeklyRecurrence;}
  if (!dateKeyValid(task.due)) throw new Error("Recurring tasks need a due date.");
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
  const today = dayKey(now), occupied = new Set([...(data.deletedOccurrences || []), ...data.tasks.filter(t => t.recurrenceId && t.occurrenceDate).map(t => t.recurrenceId + ':' + t.occurrenceDate)]);
  let generated = 0, steps = 0, changed = false;
  for (const series of data.recurrences) {
    if(series.frequency==='weekly')continue;
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
const validTime = value => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : '';
function entryOverdue(entry, now = Date.now()) {
  if(entry.task?.weeklyRecurrence&&entry.date<dayKey(now))return false;
  return entry.date < dayKey(now) || (entry.date === dayKey(now) && !!validTime(entry.time) && new Date(entry.date + 'T' + entry.time + ':00').getTime() <= now);
}
function taskOverdue(task, now = Date.now()) { return !task.weeklyRecurrence && !!task.due && entryOverdue({ date: task.due, time: task.dueTime }, now); }
function compareCalendarEntries(a, b) {
  return (a.time || '').localeCompare(b.time || '') || (PRIORITIES.find(p => p.name === b.task.priority)?.rank || 0) - (PRIORITIES.find(p => p.name === a.task.priority)?.rank || 0) || a.task.title.localeCompare(b.task.title);
}
function reminderKey(entry, now) { return entry.time ? (entryOverdue(entry, now) ? 'due:' : 'upcoming:') + entry.key : entry.key; }
const CALENDAR_PX_PER_MINUTE = 1.2;
function minuteOfDay(time) { const t = validTime(time); return t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) : 0; }
function wallValue(date, time = '00:00') { return Math.round(Date.parse(date + 'T00:00:00Z') / DAY) * 1440 + minuteOfDay(time); }
function wallParts(value) { const day = Math.floor(value / 1440), minutes = value - day * 1440; return { date: new Date(day * DAY).toISOString().slice(0, 10), time: String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0') }; }
function resolveSchedule(task) {
  const due = validDate(task.due), dueTime = validTime(task.dueTime), startDate = validDate(task.startDate), startTime = validTime(task.startTime);
  if (!due) { if (startDate || startTime || dueTime) throw new Error('An end date is required for a scheduled task.'); return { startDate: '', startTime: '' }; }
  if (dueTime && !startDate && !startTime) { const start = wallParts(wallValue(due, dueTime) - 60); return { startDate: start.date, startTime: start.time }; }
  if (!dueTime && !startTime) { if (startDate && startDate > due) throw new Error('The end date must not precede the start date.'); return { startDate, startTime: '' }; }
  if (!startDate || !startTime || !dueTime) throw new Error('Set both start and end dates and times, or leave both times empty for an all-day task.');
  if (wallValue(startDate, startTime) >= wallValue(due, dueTime)) throw new Error('The end must be after the start.');
  return { startDate, startTime };
}
function normaliseSchedule(task) {
  try { return resolveSchedule(task); } catch { return resolveSchedule({ due: validDate(task.due), dueTime: validDate(task.due) ? validTime(task.dueTime) : '' }); }
}
function scheduleKey(task) { const s = normaliseSchedule(task); return [s.startDate, s.startTime, task.due || '', task.dueTime || ''].join('|'); }
function taskRange(task) {
  if (!validDate(task.due)) return null;
  const s = normaliseSchedule(task), startDate = s.startDate || task.due, timed = !!validTime(task.dueTime);
  return { startDate, startTime: s.startTime, endDate: task.due, endTime: validTime(task.dueTime), timed, start: wallValue(startDate, s.startTime), end: wallValue(task.due, task.dueTime) + (timed ? 0 : 1440) };
}
function resizeRange(task, edge, delta) {
  const range = taskRange(task); if (!range?.timed || !['start', 'end'].includes(edge) || !Number.isFinite(delta)) throw new Error('This timed event cannot be resized.');
  const change = Math.round(delta / 15) * 15, start = edge === 'start' ? Math.min(range.start + change, range.end - 15) : range.start, end = edge === 'end' ? Math.max(range.end + change, range.start + 15) : range.end;
  const a = wallParts(start), b = wallParts(end); if (!validDate(a.date) || !validDate(b.date)) throw new Error('The resulting date is out of range.');
  return { startDate: a.date, startTime: a.time, due: b.date, dueTime: b.time };
}
function calendarEntriesForDate(entries, date) {
  const result = [], dayStart = wallValue(date);
  for (const entry of entries) {
    if (entry.kind !== 'task') { if (entry.date === date) result.push({ ...entry, timed: false }); continue; }
    const range = taskRange(entry.task); if (!range || range.end <= dayStart || range.start >= dayStart + 1440) continue;
    result.push({ ...entry, date, range, timed: range.timed, startMinute: Math.max(0, range.start - dayStart), endMinute: Math.min(1440, range.end - dayStart), continuesBefore: range.start < dayStart, continuesAfter: range.end > dayStart + 1440 });
  }
  return result;
}
function layoutTimedEvents(entries) {
  const sorted = entries.map(e => ({ ...e, layoutEnd: e.endMinute })).sort((a,b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute || a.task.title.localeCompare(b.task.title));
  const groups = []; let group = [], until = -1;
  for (const entry of sorted) { if (group.length && entry.startMinute >= until) { groups.push(group); group = []; until = -1; } group.push(entry); until = Math.max(until, entry.layoutEnd); }
  if (group.length) groups.push(group);
  return groups.flatMap(items => { const ends = []; for (const item of items) { let col = ends.findIndex(end => end <= item.startMinute); if (col < 0) col = ends.length; ends[col] = item.layoutEnd; item.column = col; } return items.map(item => ({ ...item, columns: ends.length })); });
}

const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function weekdayOf(date) { return (new Date(date+'T12:00:00').getDay()+6)%7; }
function weeklyRule(series) { return {weekday:Number.isInteger(series.weekday)&&series.weekday>=0&&series.weekday<7?series.weekday:weekdayOf(series.anchorDate||series.nextDate||dayKey()),interval:Math.max(1,Math.min(365,Number(series.interval)||1)),anchorDate:validDate(series.anchorDate)||validDate(series.nextDate)||dayKey(),enabled:!!series.enabled}; }
function weeklyStarts(rule,from,to) {
  const anchor=shiftDate(rule.anchorDate,(rule.weekday-weekdayOf(rule.anchorDate)+7)%7),step=rule.interval*7,result=[];
  let date=shiftDate(anchor,Math.max(0,Math.ceil(daysBetween(anchor,from)/step))*step);
  while(date<=to&&result.length<2000){result.push(date);date=shiftDate(date,step);}return result;
}
function continuousSeries(data,task) { return data.recurrences.find(s=>s.mode==='continuous-weekly'&&s.frequency==='weekly'&&s.taskId===task.id); }
function alignWeeklyTask(task,series,date) {
  const range=taskRange(task);if(!range)return;const delta=daysBetween(range.startDate,date);
  task.startDate=shiftDate(range.startDate,delta);task.due=shiftDate(range.endDate,delta);series.anchorDate=date;
}
function weeklyEventSchedule(task, fallback = dayKey()) {
  const base=validDate(task.startDate)||validDate(task.due)||validDate(fallback)||dayKey(),start=validTime(task.startTime),end=validTime(task.dueTime);
  if(!start&&!end)return {startDate:base,startTime:'',due:base,dueTime:''};
  if(!start&&end){const previous=wallParts(wallValue(base,end)-60);return {startDate:previous.date,startTime:previous.time,due:base,dueTime:end};}
  if(start&&!end){const next=wallParts(wallValue(base,start)+60);return {startDate:base,startTime:start,due:next.date,dueTime:next.time};}
  if(start===end)throw new Error('Choose different start and end times for the weekly event.');
  return {startDate:base,startTime:start,due:start>end?shiftDate(base,1):base,dueTime:end};
}
function configureWeekly(data,task,rule,now=Date.now()) {
  let series=data.recurrences.find(s=>s.id===task.recurrenceId);
  if(!series){series={id:uid(),createdAt:now};data.recurrences.push(series);}
  Object.assign(task,weeklyEventSchedule(task,series.anchorDate||dayKey(now)));
  const range=taskRange(task);
  const weekday=rule.weekday==null?weekdayOf(range.startDate):rule.weekday,date=shiftDate(range.startDate,(weekday-weekdayOf(range.startDate)+7)%7);
  Object.assign(series,rule,{weekday,mode:'continuous-weekly',taskId:task.id,anchorDate:date,enabled:true,updatedAt:now});
  task.recurrenceId=series.id;alignWeeklyTask(task,series,date);task.occurrenceDate='';
  if(task.status==='Done'){task.status='ToDo';task.completedAt=null;task.archivedAt=null;}
  syncWeeklyData(data,now);return series;
}
function syncWeeklyData(data,now=Date.now()) {
  for(const series of data.recurrences){
    if(series.frequency!=='weekly')continue;
    if(series.mode!=='continuous-weekly'){
      const related=data.tasks.filter(t=>t.recurrenceId===series.id),open=related.filter(t=>!t.deletedAt&&!t.archivedAt&&t.status!=='Done').sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      let owner=open[0];
      if(!owner){
        const deleted=related.find(t=>t.deletedAt);
        if(deleted){owner=deleted;series.enabled=false;}
        else {owner=recurringTask(series,validDate(series.nextDate)||dayKey(now),now);data.tasks.push(owner);}
      }
      if(series.enabled&&!owner.deletedAt)Object.assign(owner,weeklyEventSchedule(owner,series.anchorDate||series.nextDate||dayKey(now)));
      const range=taskRange(owner),weekday=series.weekday==null?weekdayOf(range?.startDate||series.nextDate||dayKey(now)):series.weekday;
      Object.assign(series,{mode:'continuous-weekly',taskId:owner.id,weekday,anchorDate:range?.startDate||series.nextDate||dayKey(now)});
      if(range)alignWeeklyTask(owner,series,shiftDate(range.startDate,(weekday-weekdayOf(range.startDate)+7)%7));
      for(const old of related)if(old.id!==owner.id){old.previousRecurrenceId=series.id;old.recurrenceId=null;delete old.weeklyRecurrence;}
    }
    const task=data.tasks.find(t=>t.id===series.taskId);if(!task){series.enabled=false;continue;}
    task.recurrenceId=series.id;
    if(series.enabled&&!task.deletedAt)Object.assign(task,weeklyEventSchedule(task,series.anchorDate||dayKey(now)));
    if(task.deletedAt||!taskRange(task))series.enabled=false;
    const rule=weeklyRule(series);Object.assign(series,rule);task.weeklyRecurrence=copy(rule);
    if(series.enabled&&task.status==='Done'){task.status='ToDo';task.completedAt=null;task.archivedAt=null;}
    if(taskRange(task))series.defaults=taskDefaults(task);
    else {const old=series.defaults||{},base=shiftDate(series.anchorDate,-(old.startOffsetDays||0));series.defaults={...taskDefaults(task,base),startTime:old.startTime||'',dueTime:old.dueTime||'',startOffsetDays:old.startOffsetDays??null};}
    series.nextDate=weeklyStarts(rule,dayKey(now),shiftDate(dayKey(now),series.interval*7+7))[0]||series.anchorDate;
  }
  for(const task of data.tasks)if(task.weeklyRecurrence&&!continuousSeries(data,task))delete task.weeklyRecurrence;
}
function changeWeeklyPattern(data,series,weekday,interval,anchor=null) {
  const task=data.tasks.find(t=>t.id===series.taskId);if(!task||task.deletedAt)throw new Error('Restore this task from Trash before changing its recurrence.');
  if(!Number.isInteger(weekday)||weekday<0||weekday>6||!Number.isInteger(interval)||interval<1||interval>365)throw new Error('Choose a weekday and a valid week interval.');
  const base=anchor||shiftDate(series.anchorDate,-weekdayOf(series.anchorDate)),date=shiftDate(base,(weekday-weekdayOf(base)+7)%7);
  Object.assign(series,{weekday,interval,anchorDate:date});alignWeeklyTask(task,series,date);syncWeeklyData(data);
}
function syncChangedWeeklyRange(data,task,previousRange) {
  const series=continuousSeries(data,task);if(!series)return;
  const range=taskRange(task);if(!range){series.enabled=false;syncWeeklyData(data);return;}
  const weekday=weekdayOf(range.startDate),base=previousRange?shiftDate(series.anchorDate,-weekdayOf(series.anchorDate)):range.startDate,date=shiftDate(base,(weekday-weekdayOf(base)+7)%7);
  series.weekday=weekday;series.enabled=true;alignWeeklyTask(task,series,date);syncWeeklyData(data);
}
function resumeWeekly(data,series) {
  const task=data.tasks.find(t=>t.id===series.taskId);if(!task||task.deletedAt)throw new Error('Restore the weekly task before resuming.');
  if(!taskRange(task)){
    const d=series.defaults||{},date=shiftDate(series.anchorDate||dayKey(),-(d.startOffsetDays||0));
    Object.assign(task,{due:date,dueTime:validTime(d.dueTime),startDate:d.startOffsetDays==null?'':shiftDate(date,d.startOffsetDays),startTime:validTime(d.startTime)});Object.assign(task,normaliseSchedule(task));
  }
  if(task.status==='Done'){task.status='ToDo';task.completedAt=null;task.archivedAt=null;}
  series.enabled=true;syncWeeklyData(data);
}
function weeklyProjectedTasks(task,from,to) {
  const rule=task.weeklyRecurrence,range=taskRange(task);if(!rule?.enabled||!range)return [];
  const offsets=[0,daysBetween(range.startDate,range.endDate),...task.subtasks.filter(s=>s.due).map(s=>daysBetween(range.startDate,s.due)),...(task.followUpDate?[daysBetween(range.startDate,task.followUpDate)]:[])];
  return weeklyStarts(rule,shiftDate(from,-Math.max(...offsets)),shiftDate(to,-Math.min(...offsets))).map(date=>{
    const delta=daysBetween(range.startDate,date);return {...task,startDate:date,due:shiftDate(task.due,delta),subtasks:task.subtasks.map(s=>({...s,due:s.due?shiftDate(s.due,delta):''})),followUpDate:task.followUpDate?shiftDate(task.followUpDate,delta):''};
  });
}
function calendarSourceTask(entry) { return entry.sourceTask||entry.task; }
function attentionEntries(data,from=null,to=null) {
  const entries=[],start=from||dayKey(),end=to||shiftDate(start,7),explicit=!!from;
  const append=(task,sourceTask=null)=>{
    const extra=sourceTask?{sourceTask}:{};
    if(task.due)entries.push({task,...extra,kind:'task',date:task.due,time:validTime(task.dueTime),label:sourceTask?'Weekly task':'Task due',key:'task:'+task.id+':'+task.due+(task.dueTime?':'+task.dueTime:'')});
    for(const s of task.subtasks)if(!s.done&&s.due)entries.push({task,...extra,kind:'subtask',subtaskId:s.id,date:s.due,label:'Subtask: '+s.title,key:'subtask:'+task.id+':'+s.id+':'+s.due});
    if(task.status==='Waiting'&&task.followUpDate)entries.push({task,...extra,kind:'followup',date:task.followUpDate,label:'Follow up with '+(task.waitingFor||'pending response'),key:'followup:'+task.id+':'+task.followUpDate});
  };
  for(const task of data.tasks){
    if(task.deletedAt||task.archivedAt||task.status==='Done')continue;
    if(task.weeklyRecurrence){for(const projected of weeklyProjectedTasks(task,start,end)){
      const first=entries.length;append(projected,task);
      for(let i=entries.length-1;i>=first;i--){const e=entries[i],range=taskRange(projected),inRange=e.kind==='task'?range.end>wallValue(start)&&range.start<wallValue(shiftDate(end,1)):e.date>=start&&e.date<=end;if(!inRange||(!explicit&&e.date<start))entries.splice(i,1);}
    }}else append(task);
  }
  return entries;
}
function taskMatches(task, filters, data, now = Date.now()) {
  if (task.deletedAt) return false;
  if (filters.status && task.status !== filters.status) return false;
  if (filters.priority && task.priority !== filters.priority) return false;
  if (filters.project && filters.project !== 'all' && (filters.project === 'none' ? !!task.projectId : task.projectId !== filters.project)) return false;
  const words = String(filters.query || '').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const text = [task.title, task.note, task.waitingFor, projectName(data, task.projectId), ...task.subtasks.map(s => s.title), ...task.worklog.map(e => e.text)].join(' ').toLocaleLowerCase();
  if (!words.every(word => text.includes(word))) return false;
  const today = dayKey(now), dates = task.weeklyRecurrence ? attentionEntries(data,today,shiftDate(today,7)).filter(e=>e.task.id===task.id).map(e=>e.date) : [task.due, ...task.subtasks.filter(s => !s.done).map(s => s.due), task.status === 'Waiting' ? task.followUpDate : ''].filter(Boolean);
  if(task.weeklyRecurrence&&filters.due==='overdue')return false;
  if (filters.due === 'today' && !dates.includes(today)) return false;
  if (filters.due === 'overdue' && !taskOverdue(task, now) && !task.subtasks.some(s => !s.done && s.due && s.due < today) && !(task.status === 'Waiting' && task.followUpDate && task.followUpDate < today)) return false;
  if (filters.due === 'week' && !dates.some(d => d >= today && d <= shiftDate(today, 7))) return false;
  if (filters.due === 'none' && dates.length) return false;
  return true;
}
function projectOnlyTask(data, task) {
  const project = data.projects.find(p => p.id === task.projectId);
  return !!project?.onlyInProjects;
}
function calendarRange(date, mode = 'week') {
  const anchor = validDate(date) || dayKey(), first = mode === 'month' ? anchor.slice(0, 7) + '-01' : anchor;
  const weekday = (new Date(first + 'T12:00:00').getDay() + 6) % 7, start = shiftDate(first, -weekday);
  const last = mode === 'month' ? new Date(Number(anchor.slice(0,4)), Number(anchor.slice(5,7)), 0).getDate() : 7;
  return { start, days: mode === 'month' ? Math.ceil((weekday + last) / 7) * 7 : 7 };
}
function shiftMonth(date, amount) {
  const d = new Date(date + 'T12:00:00'), day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + amount);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return dayKey(d.getTime());
}
function templateFields(source = {}) {
  const offset = source.dueInDays;
  return {
    title: String(source.title || ''), note: String(source.note || ''), dueTime: validTime(source.dueTime), startTime: validTime(source.startTime), startInDays: offsetDays(source.startInDays), startOffsetDays: offsetDays(source.startOffsetDays),
    priority: PRIORITIES.some(p => p.name === source.priority) ? source.priority : source.priority === 'Anpassungen Planner' ? 'low' : 'mid',
    status: COLS.some(c => c.name === source.status && c.name !== 'Done') ? source.status : 'ToDo',
    projectId: source.projectId || null, waitingFor: String(source.waitingFor || ''),
    followUpInDays: offsetDays(source.followUpInDays), repeat: repeatRule(source.repeat),
    dueInDays: offset !== null && offset !== undefined && offset !== '' && Number.isInteger(Number(offset)) && Number(offset) >= 0 && Number(offset) <= 3650 ? Number(offset) : null,
    subtasks: Array.isArray(source.subtasks) ? source.subtasks.map(s => ({ title: String(s.title || '').trim(), dueInDays: offsetDays(s.dueInDays) })).filter(s => s.title) : []
  };
}
function normalize(raw, now = Date.now()) {
  if (raw && !Array.isArray(raw) && raw.schemaVersion > 3) throw new Error("This data requires a newer Daily Planner version.");
  const source = Array.isArray(raw) ? { tasks: raw } : raw || {};
  if (source.tasks != null && !Array.isArray(source.tasks)) throw new Error("Invalid saved task format.");
  if (source.templates != null && !Array.isArray(source.templates)) throw new Error("Invalid saved template format.");
  if (source.projects != null && !Array.isArray(source.projects)) throw new Error("Invalid saved project format.");
  if (source.recurrences != null && !Array.isArray(source.recurrences)) throw new Error("Invalid saved recurrence format.");
  const projects = (source.projects || []).map(p => {
    if (!p || typeof p !== 'object' || !String(p.name || '').trim()) throw new Error("Invalid saved project.");
    const legacyHidden = String(p.name).trim().replace(/\s+/g, ' ').toLocaleLowerCase() === 'anpassungen planer';
    return { ...p, id: String(p.id || uid()), name: String(p.name).trim(), note: String(p.note || ''), onlyInProjects: typeof p.onlyInProjects === 'boolean' ? p.onlyInProjects : legacyHidden, includeInDashboard: typeof p.includeInDashboard === 'boolean' ? p.includeInDashboard : !legacyHidden, remindersEnabled: p.remindersEnabled !== false };
  });
  const projectIds = new Set(projects.map(p => p.id));
  const tasks = (source.tasks || []).map(t => {
    if (!t || typeof t !== 'object') throw new Error("Invalid saved task.");
    const incomingStatus = Object.prototype.hasOwnProperty.call(LEGACY_STATUS, t.status) ? LEGACY_STATUS[t.status] : t.status;
    const status = COLS.some(c => c.name === incomingStatus) ? incomingStatus : 'ToDo';
    return {
      ...t, ...normaliseSchedule(t), deletedAt: stamp(t.deletedAt), id: String(t.id || uid()), title: String(t.title || "Untitled task"), status,
      priority: PRIORITIES.some(p => p.name === t.priority) ? t.priority : t.priority === 'Anpassungen Planner' ? 'low' : 'mid',
      projectId: projectIds.has(t.projectId) ? t.projectId : null, waitingFor: String(t.waitingFor || ''), followUpDate: validDate(t.followUpDate),
      recurrenceId: t.recurrenceId ? String(t.recurrenceId) : null, occurrenceDate: validDate(t.occurrenceDate),
      due: dateKeyValid(t.due) ? t.due : '', dueTime: dateKeyValid(t.due) ? validTime(t.dueTime) : '', note: String(t.note || ''),
      createdAt: stamp(t.createdAt), updatedAt: stamp(t.updatedAt),
      completedAt: status === 'Done' ? stamp(t.completedAt) || now : null,
      completionDateEstimated: status === 'Done' && (!!t.completionDateEstimated || !stamp(t.completedAt)),
      archivedAt: status === 'Done' ? stamp(t.archivedAt) : null,
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.map(s => ({ ...s, id: String(s.id || uid()), title: String(s.title || ''), done: !!s.done, due: validDate(s.due) })) : [],
      worklog: Array.isArray(t.worklog) ? t.worklog.map(e => ({ ...e, id: String(e.id || uid()), text: String(e.text || ''), at: stamp(e.at) || now })) : []
    };
  });
  const templates = (source.templates || []).map(t => {
    if (!t || typeof t !== 'object') throw new Error("Invalid saved template.");
    return { id: String(t.id || uid()), name: String(t.name || "Untitled"), ...templateFields(t), projectId: projectIds.has(t.projectId) ? t.projectId : null, createdAt: stamp(t.createdAt), updatedAt: stamp(t.updatedAt) };
  });
  const recurrences = (source.recurrences || []).map(s => {
    if (!s || typeof s !== 'object') throw new Error("Invalid saved recurrence.");
    const rule = repeatRule(s), d = templateFields(s.defaults || {});
    return { ...s, id: String(s.id || uid()), ...rule, enabled: !!s.enabled && rule.frequency !== 'none' && !!validDate(s.nextDate), nextDate: validDate(s.nextDate), anchorDay: Number(s.anchorDay) >= 1 && Number(s.anchorDay) <= 31 ? Number(s.anchorDay) : Number(String(s.nextDate || '').slice(-2)) || 1, defaults: { ...d, title: d.title || "Recurring task", projectId: projectIds.has(d.projectId) ? d.projectId : null } };
  });
  const reminders = source.reminderSettings || {};
  const data = {
    ...source, schemaVersion: 3, tasks, templates, projects, recurrences, deletedOccurrences: Array.isArray(source.deletedOccurrences) ? source.deletedOccurrences.filter(k => typeof k === 'string') : [], settings: { ...source.settings },
    reminderSettings: { enabled: reminders.enabled !== false, leadDays: [0, 1, 3, 7].includes(Number(reminders.leadDays)) ? Number(reminders.leadDays) : 1 },
    reminderState: { day: validDate(source.reminderState?.day), seen: Array.isArray(source.reminderState?.seen) ? source.reminderState.seen.filter(k => typeof k === 'string') : [] }
  };
  syncWeeklyData(data,now);return data;
}
function setStatus(task, status, now = Date.now()) {
  if(status==='Done'&&task.weeklyRecurrence?.enabled)throw new Error('Pause the weekly recurrence before completing this task.');
  if (!COLS.some(c => c.name === status)) throw new Error("Unknown status.");
  if (task.status !== status) { task.completedAt = status === 'Done' ? now : null; task.completionDateEstimated = false; }
  task.status = status; task.archivedAt = null; task.updatedAt = now;
}
function archiveDue(data, now = Date.now()) {
  let changed = false;
  for (const task of data.tasks) {
    if (!task.deletedAt && !task.weeklyRecurrence?.enabled && task.status === 'Done' && !task.archivedAt && task.completedAt && now - task.completedAt >= DAY) { task.archivedAt = now; changed = true; }
  }
  return changed;
}
function archiveDeleteAt(archivedAt) {
  if(!Number.isFinite(archivedAt)||archivedAt<=0)return Infinity;
  const date=new Date(archivedAt),day=date.getDate();date.setDate(1);date.setMonth(date.getMonth()+2);
  const last=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();date.setDate(Math.min(day,last));return date.getTime();
}
function purgeExpiredArchive(data, now = Date.now()) {
  const expired=data.tasks.filter(task=>!task.deletedAt&&task.archivedAt&&now>=archiveDeleteAt(task.archivedAt));
  if(!expired.length)return false;
  const ids=new Set(expired.map(task=>task.id));
  for(const task of expired)if(task.recurrenceId&&task.occurrenceDate){const key=task.recurrenceId+':'+task.occurrenceDate;if(!data.deletedOccurrences.includes(key))data.deletedOccurrences.push(key);}
  data.tasks=data.tasks.filter(task=>!ids.has(task.id));
  data.recurrences=data.recurrences.filter(series=>!(series.mode==='continuous-weekly'&&ids.has(series.taskId)));
  return true;
}
function metrics(data, now = Date.now()) {
  const today = dayKey(now);
  const weeklyDueToday = new Set(attentionEntries(data,today,today).filter(e=>e.sourceTask&&e.kind==='task'&&e.date===today).map(e=>e.task.id));
  const tasks = data.tasks.filter(t => !t.deletedAt), active = tasks.filter(t => !t.archivedAt && t.status !== 'Done'), done = tasks.filter(t => t.status === 'Done');
  const week = Array.from({ length: 7 }, (_, i) => {
    const key = dayKey(shiftDay(now, i - 6));
    return { key, count: done.filter(t => !t.completionDateEstimated && t.completedAt && t.completedAt <= now && dayKey(t.completedAt) === key).length };
  });
  return {
    today, active, done, week,
    overdue: active.filter(t => taskOverdue(t, now)), dueToday: active.filter(t => t.weeklyRecurrence ? weeklyDueToday.has(t.id) : t.due === today),
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
    this.contentEl.addClass('tp-controls'); this.contentEl.setAttribute('lang', 'en-GB');
    this.contentEl.empty(); this.contentEl.addClass('tp-modal');
    const savedTemplate = this.isTemplate ? this.plugin.data.templates.find(t => t.id === this.options.templateId) : null;
    const task = this.isTemplate ? savedTemplate || this.options.seedTask : this.plugin.data.tasks.find(t => t.id === this.taskId);
    this.originalStatus = task?.status || 'ToDo';
    const heading = this.isTemplate ? (savedTemplate ? "Edit template" : "New template") : (task ? "Edit task" : "New task");
    this.contentEl.createEl('h2', { text: heading });
    const form = this.contentEl.createEl('form');
    const field = (text, tag, type, value) => {
      const label = form.createEl('label', { cls: 'tp-field', text });
      const input = label.createEl(tag, type ? { type } : {}); input.value = value == null ? '' : String(value); return input;
    };
    if (this.isTemplate) {
      this.nameInput = field("Template name", 'input', 'text', savedTemplate?.name || task?.title || ''); this.nameInput.required = true;
    }
    this.titleInput = field(this.isTemplate ? "Default task title · optional" : "Task", 'input', 'text', task?.title); this.titleInput.required = !this.isTemplate;
    this.priorityInput = field("Priority", 'select', null, '');
    PRIORITIES.forEach(p => this.priorityInput.createEl('option', { text: p.glyph + ' ' + p.name, value: p.name })); this.priorityInput.value = task?.priority || 'mid';
    this.statusInput = field(this.taskId ? 'Status' : "Initial status", 'select', null, '');
    const statusOptions = this.taskId && !this.isTemplate && !task?.weeklyRecurrence?.enabled ? COLS : COLS.filter(c => c.name !== 'Done');
    statusOptions.forEach(c => this.statusInput.createEl('option', { text: c.glyph + ' ' + c.name, value: c.name }));
    this.statusInput.value = statusOptions.some(c => c.name === task?.status) ? task.status : 'ToDo';
    this.projectInput = field("Project · optional", 'select', null, '');
    this.refreshProjects(task?.projectId || this.options.defaultProjectId || '');
    button(this.projectInput.parentElement, "+ Create project", () => new ProjectModal(this.app, this.plugin, null, id => this.refreshProjects(id)).open(), 'tp-small-button');
    const schedule = this.isTemplate ? task || {} : normaliseSchedule(task || {});
    if (this.isTemplate) {
      this.startOffsetInput = field('Days until start from creation · optional', 'input', 'number', savedTemplate?.startInDays ?? (validDate(task?.startDate) ? daysBetween(dayKey(),task.startDate) : null));this.startOffsetInput.min='-3650';this.startOffsetInput.max='3650';this.startOffsetInput.step='1';
    } else this.startDateInput = field('Start date · optional','input','date',schedule.startDate);
    this.startTimeInput = field('Start time · optional (24-hour)','input','time',schedule.startTime);this.startTimeInput.step='60';
    if (this.isTemplate) {
      const offset = savedTemplate ? savedTemplate.dueInDays : (dateKeyValid(task?.due) ? Math.max(0,daysBetween(dayKey(),task.due)) : null);
      this.offsetInput = field('Days until end from creation · optional','input','number',offset);this.offsetInput.min='0';this.offsetInput.max='3650';this.offsetInput.step='1';this.offsetInput.placeholder='0 = creation day';
    } else this.dueInput = field('End date · optional','input','date',task?.due);
    this.dueTimeInput = field('End time · optional (24-hour)','input','time',validTime(task?.dueTime));this.dueTimeInput.step='60';
    form.createDiv({text:'Set a start and end. Leave both times empty for an all-day task. The end remains the deadline for reminders. Local time.',cls:'tp-help'});
    const setDate = (which,date) => { const dateInput=which==='start'?this.startDateInput:this.dueInput,offsetInput=which==='start'?this.startOffsetInput:this.offsetInput;if(dateInput)dateInput.value=date;else offsetInput.value=String(daysBetween(dayKey(),date)); };
    const readDate = which => { const dateInput=which==='start'?this.startDateInput:this.dueInput,offsetInput=which==='start'?this.startOffsetInput:this.offsetInput;return dateInput?dateInput.value:(offsetInput.value===''?'':shiftDate(dayKey(),Number(offsetInput.value))); };
    this.dueTimeInput.onchange=()=>{if(!validTime(this.dueTimeInput.value))return;const end=readDate('end')||dayKey();setDate('end',end);if(!readDate('start')&&!this.startTimeInput.value){const start=wallParts(wallValue(end,this.dueTimeInput.value)-60);setDate('start',start.date);this.startTimeInput.value=start.time;}};
    this.startTimeInput.onchange=()=>{if(!validTime(this.startTimeInput.value))return;const start=readDate('start')||dayKey();setDate('start',start);if(!readDate('end')||!this.dueTimeInput.value){const end=wallParts(wallValue(start,this.startTimeInput.value)+60);setDate('end',end.date);this.dueTimeInput.value=end.time;}};
    const series = this.plugin.data.recurrences.find(s => s.id === task?.recurrenceId);
    const rule = repeatRule(this.isTemplate ? task?.repeat : (series?.enabled ? series : !task && this.options.defaultRepeat ? {frequency:this.options.defaultRepeat,interval:1} : {}));
    this.originalRule=copy(rule);this.originalDue=task?.due||'';
    if(!this.isTemplate)this.weeklyFirstInput=field('First weekly occurrence · optional','input','date',series?.frequency==='weekly'?(task?.startDate||series.anchorDate||''):'');
    this.repeatInput = field("Recurrence", 'select', null, '');
    REPEAT_OPTIONS.forEach(r => this.repeatInput.createEl('option', { text: r.label, value: r.value })); this.repeatInput.value = rule.frequency;
    this.weekdayInput=field('Weekly weekday','select',null,'');WEEKDAYS.forEach((name,i)=>this.weekdayInput.createEl('option',{text:name,value:String(i)}));this.weekdayInput.value=String(rule.weekday??series?.weekday??weekdayOf(task?.startDate||task?.due||dayKey()));
    this.repeatIntervalInput = field("Every … days / weeks / months", 'input', 'number', rule.interval);
    this.repeatIntervalInput.min = '1'; this.repeatIntervalInput.max = '365'; this.repeatIntervalInput.step = '1';
    form.createDiv({ text: "Weekly repeats keep one task open and show it on the selected weekday forever. Editing any weekly entry changes the same task everywhere. For Weekly, choose a weekday and optionally the first occurrence. No due date is required. Each all-day occurrence lasts one day; end times describe that occurrence, not the end of the series. Daily/monthly repeats create separate tasks. No recurrence pauses the series.", cls: 'tp-help' });
    this.repeatInput.onchange = () => {
      const enabled = this.repeatInput.value !== 'none'; this.repeatIntervalInput.disabled = !enabled;this.weekdayInput.parentElement.hidden=this.repeatInput.value!=='weekly';
      if(this.weeklyFirstInput){const weekly=this.repeatInput.value==='weekly';this.weeklyFirstInput.parentElement.hidden=!weekly;this.startDateInput.parentElement.hidden=weekly;this.dueInput.parentElement.hidden=weekly;}
      if (enabled && this.dueInput && !this.dueInput.value && this.repeatInput.value!=='weekly') this.dueInput.value = dayKey();
      if (enabled && this.offsetInput && this.offsetInput.value === '') this.offsetInput.value = '0';
    }; this.repeatIntervalInput.disabled = rule.frequency === 'none';this.weekdayInput.parentElement.hidden=rule.frequency!=='weekly';if(this.weeklyFirstInput){const weekly=rule.frequency==='weekly';this.weeklyFirstInput.parentElement.hidden=!weekly;this.startDateInput.parentElement.hidden=weekly;this.dueInput.parentElement.hidden=weekly;}if(!task && this.options.defaultRepeat)this.repeatInput.onchange();
    this.waitingSection = form.createDiv('tp-waiting-fields');
    const waitingLabel = this.waitingSection.createEl('label', { cls: 'tp-field', text: "Waiting for · Person or team" });
    this.waitingForInput = waitingLabel.createEl('input', { type: 'text', attr: { placeholder: "e.g. Anna or the IT team" } }); this.waitingForInput.value = task?.waitingFor || '';
    const followLabel = this.waitingSection.createEl('label', { cls: 'tp-field', text: this.isTemplate ? "Follow up after days · optional" : "Follow-up date · optional" });
    this.followUpInput = followLabel.createEl('input', { type: this.isTemplate ? 'number' : 'date' });
    if (this.isTemplate) {
      const offset = savedTemplate?.followUpInDays ?? (validDate(task?.followUpDate) ? daysBetween(dayKey(), task.followUpDate) : null);
      this.followUpInput.value = offset == null ? '' : String(offset); this.followUpInput.min = '0'; this.followUpInput.max = '3650'; this.followUpInput.step = '1';
    } else this.followUpInput.value = task?.followUpDate || '';
    this.statusInput.onchange = () => { this.waitingSection.hidden = this.statusInput.value !== 'Waiting'; }; this.statusInput.onchange();
    this.noteInput = field("Description · optional", 'textarea', null, task?.note); this.noteInput.rows = 3;
    const subSection = form.createDiv('tp-modal-subtasks'); subSection.createEl('h3', { text: "Subtasks" });
    this.subtaskList = subSection.createDiv('tp-modal-subtask-list');
    this.subtaskElements = new Map();
    this.originalSubtasks = copy(task?.subtasks || []);
    this.subtaskRows = copy(task?.subtasks || []).map(s => ({ id: s.id || uid(), title: s.title, done: !this.isTemplate && !!s.done, due: validDate(s.due), dueInDays: offsetDays(s.dueInDays) ?? (this.isTemplate && validDate(s.due) ? daysBetween(dayKey(), s.due) : null) }));
    if (this.isTemplate && !this.subtaskRows.length) this.subtaskRows.push({ id: uid(), title: '', done: false, due: '', dueInDays: null });
    subSection.createDiv({ text: "Enter subtasks directly. Press Enter to add a row; use the Save button below to save.", cls: 'tp-help' });
    this.renderSubtasks();
    this.addSubtaskButton = button(subSection, "+ Subtask", () => this.addSubtask());
    if (!this.isTemplate) {
      const log = form.createDiv('tp-modal-worklog'); log.createEl('h3', { text: "Activity history" });
      for (const entry of [...(task?.worklog || [])].reverse()) { const row = log.createDiv('tp-log-entry'); row.createDiv({ text: entry.text, cls: 'tp-log-text' }); row.createDiv({ text: timeText(entry.at), cls: 'tp-muted' }); }
      const label = log.createEl('label', { text: "New activity entry · optional", cls: 'tp-field' }); this.logInput = label.createEl('textarea'); this.logInput.rows = 2;
    }
    const actions = form.createDiv('tp-inline-actions');
    this.saveButton = actions.createEl('button', { text: this.isTemplate ? "Save template" : (task ? "Save changes" : "Create task"), cls: 'mod-cta', type: 'submit' });
    if (!this.isTemplate && !this.taskId) this.fromTemplateButton = button(actions, "Create task from template", () => new TemplatePickerModal(this.app, this.plugin, this).open());
    button(actions, "Cancel", () => this.close());
    if (!this.isTemplate && task && !task.deletedAt && !task.archivedAt) this.deleteTaskButton = button(actions, "Delete", async () => {
      if (this.saving) return; this.saving = true; this.saveButton.disabled = true; this.deleteTaskButton.disabled = true; this.setSubtaskSaving(true);
      const ok = await this.plugin.trashTask(task.id);
      if (ok) this.close(); else { this.saving = false; this.saveButton.disabled = false; this.deleteTaskButton.disabled = false; this.setSubtaskSaving(false); }
    }, 'mod-warning');
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
          entry.check = row.createEl('input', { type: 'checkbox', attr: { 'aria-label': "Subtask completed" } });
          entry.check.onchange = () => { entry.item.done = entry.check.checked; entry.lastDone = entry.check.checked; };
        }
        entry.input = row.createEl('input', { type: 'text', attr: { placeholder: "Subtask title" } });
        entry.input.oninput = () => { entry.item.title = entry.input.value; entry.lastTitle = entry.input.value; };
        entry.input.onkeydown = e => {
          if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
          e.preventDefault(); e.stopPropagation(); this.addSubtask(entry.item.id);
        };
        entry.date = row.createEl('input', { type: this.isTemplate ? 'number' : 'date', cls: 'tp-subtask-date', attr: { 'aria-label': this.isTemplate ? "Subtask due in days from creation" : "Subtask due date", placeholder: this.isTemplate ? "Due in days" : '' } });
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
      entry.lastTitle = item.title; entry.input.setAttribute('aria-label', "Subtask title " + (index + 1));
      const dueValue = this.isTemplate ? (item.dueInDays == null ? '' : String(item.dueInDays)) : (item.due || '');
      if (entry.date.value !== dueValue) entry.date.value = dueValue; entry.lastDate = dueValue;
      entry.remove.setAttribute('aria-label', "Subtask " + (index + 1) + ' — remove');
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
    if (!source) { new Notice("This template no longer exists."); return false; }
    const values = templateFields(source);
    this.titleInput.value = values.title; this.noteInput.value = values.note;
    this.priorityInput.value = values.priority; this.statusInput.value = values.status; this.dueTimeInput.value = values.dueTime; this.startTimeInput.value = values.startTime;
    this.refreshProjects(values.projectId || ''); this.waitingForInput.value = values.waitingFor;
    this.followUpInput.value = values.followUpInDays == null ? '' : shiftDate(dayKey(), values.followUpInDays);
    this.repeatInput.value = values.repeat.frequency; this.weekdayInput.value=String(values.repeat.weekday??weekdayOf(dayKey())); this.repeatIntervalInput.value = String(values.repeat.interval); this.repeatInput.onchange(); this.statusInput.onchange();
    this.dueInput.value = values.dueInDays == null ? '' : dayKey(shiftDay(Date.now(), values.dueInDays)); this.startDateInput.value = values.startInDays == null ? '' : shiftDate(dayKey(),values.startInDays); if (values.dueTime && !this.startDateInput.value && !this.startTimeInput.value) this.dueTimeInput.onchange();
    this.subtaskRows = values.subtasks.map(s => ({ id: uid(), title: s.title, done: false, due: s.dueInDays == null ? '' : shiftDate(dayKey(), s.dueInDays), dueInDays: null })); this.renderSubtasks(); return true;
  }
  refreshProjects(selected) {
    this.projectInput.empty(); this.projectInput.createEl('option', { text: "No project", value: '' }).value = '';
    [...this.plugin.data.projects].sort((a, b) => a.name.localeCompare(b.name)).forEach(p => this.projectInput.createEl('option', { text: p.name, value: p.id }));
    this.projectInput.value = this.plugin.data.projects.some(p => p.id === selected) ? selected : '';
  }
  async submit() {
    if (this.saving) return;
    this.captureSubtasks();
    const title = this.titleInput.value.trim(), name = this.nameInput?.value.trim();
    if (this.isTemplate ? !name : !title) { new Notice(this.isTemplate ? "Enter a template name." : "Enter a task title."); (this.nameInput || this.titleInput).focus(); return; }
    if (this.isTemplate && this.plugin.data.templates.some(t => t.id !== this.options.templateId && t.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { new Notice("A template with this name already exists. Choose a different name."); return; }
    if (this.dueInput && (!this.dueInput.checkValidity() || (this.dueInput.value && !dateKeyValid(this.dueInput.value)))) { this.dueInput.reportValidity(); return; }
    if (!this.startTimeInput.checkValidity() || (this.startTimeInput.value && !validTime(this.startTimeInput.value))) { new Notice('Enter a valid start time in HH:mm format.'); return; }
    if (this.startDateInput && !this.startDateInput.checkValidity()) { this.startDateInput.reportValidity(); return; }
    if (this.startOffsetInput && !this.startOffsetInput.checkValidity()) { this.startOffsetInput.reportValidity(); return; }
    if (this.startOffsetInput && this.startOffsetInput.value !== '' && (!Number.isInteger(Number(this.startOffsetInput.value)) || Math.abs(Number(this.startOffsetInput.value)) > 3650)) { new Notice('Enter a valid start offset in days.'); return; }
    if (!this.dueTimeInput.checkValidity() || (this.dueTimeInput.value && !validTime(this.dueTimeInput.value))) { new Notice('Enter a valid time in HH:mm format.'); return; }
    if (!this.isTemplate && this.repeatInput.value!=='weekly' && this.dueTimeInput.value && !validDate(this.dueInput.value)) { new Notice('Set a due date before assigning a time.'); return; }
    if (this.offsetInput && !this.offsetInput.checkValidity()) { this.offsetInput.reportValidity(); return; }
    if (!this.followUpInput.checkValidity()) { this.followUpInput.reportValidity(); return; }
    const frequency = this.repeatInput.value, interval = Number(this.repeatIntervalInput.value);
    if (!REPEAT_OPTIONS.some(r => r.value === frequency) || (frequency !== 'none' && (!Number.isInteger(interval) || interval < 1 || interval > 365))) { new Notice("Enter a valid recurrence interval."); return; }
    const rule = repeatRule({ frequency, interval,weekday:Number(this.weekdayInput.value) });
    if(frequency==='weekly'&&this.weeklyFirstInput&&(!this.weeklyFirstInput.checkValidity()||(this.weeklyFirstInput.value&&!validDate(this.weeklyFirstInput.value)))){this.weeklyFirstInput.reportValidity();return;}
    const keepUnscheduledSeries = !this.isTemplate && !!this.taskId && !this.originalDue && frequency !== 'none' && frequency === this.originalRule.frequency && interval === this.originalRule.interval;
    if (!this.isTemplate && frequency !== 'none' && frequency !== 'weekly' && !validDate(this.dueInput.value) && !keepUnscheduledSeries) { new Notice("Set a due date for this recurring task."); return; }
    const dueInDays = this.offsetInput && this.offsetInput.value !== '' ? Number(this.offsetInput.value) : (this.isTemplate && (frequency !== 'none' || this.dueTimeInput.value) ? 0 : null);
    if (dueInDays != null && (!Number.isInteger(dueInDays) || dueInDays < 0 || dueInDays > 3650)) return;
    const followUpInDays = this.isTemplate && this.followUpInput.value !== '' ? Number(this.followUpInput.value) : null;
    if (this.isTemplate ? followUpInDays != null && (!Number.isInteger(followUpInDays) || followUpInDays < 0 || followUpInDays > 3650) : this.followUpInput.value && !dateKeyValid(this.followUpInput.value)) return;
    for (const item of this.subtaskRows.filter(s => s.title.trim())) {
      if (this.isTemplate ? item.dueInDays != null && (!Number.isInteger(item.dueInDays) || item.dueInDays < 0 || item.dueInDays > 3650) : item.due && !dateKeyValid(item.due)) { new Notice("Enter a valid date for each subtask."); return; }
    }
    let endDate = this.isTemplate ? (dueInDays == null ? '' : shiftDate(dayKey(),dueInDays)) : this.dueInput.value;
    const rawStartDate = this.isTemplate ? (this.startOffsetInput.value === '' ? '' : shiftDate(dayKey(),Number(this.startOffsetInput.value))) : this.startDateInput.value;
    let scheduleValues;
    try {
      if(frequency==='weekly'){
        const first=this.weeklyFirstInput?.value||rawStartDate||endDate||dayKey();
        const weekly=weeklyEventSchedule({startDate:first,startTime:this.startTimeInput.value,due:first,dueTime:this.dueTimeInput.value});
        endDate=weekly.due;scheduleValues={startDate:weekly.startDate,startTime:weekly.startTime};this.dueTimeInput.value=weekly.dueTime;
        if(this.dueInput)this.dueInput.value=endDate;
      }else scheduleValues=resolveSchedule({due:endDate,dueTime:this.dueTimeInput.value,startDate:rawStartDate,startTime:this.startTimeInput.value});
    } catch(error) { new Notice(error.message);return; }
    if (!PRIORITIES.some(p => p.name === this.priorityInput.value)) return;
    const status = frequency==='weekly'&&this.statusInput.value==='Done'?'ToDo':this.statusInput.value;
    if (!COLS.some(c => c.name === status) || ((!this.taskId || this.isTemplate) && status === 'Done')) return;
    this.saving = true; this.saveButton.disabled = true; if (this.deleteTaskButton) this.deleteTaskButton.disabled = true; this.setSubtaskSaving(true);
    const subtasks = this.subtaskRows.filter(s => s.title.trim()).map(s => this.isTemplate ? { title: s.title.trim(), dueInDays: s.dueInDays ?? null } : { id: s.id, title: s.title.trim(), done: !!s.done, due: s.due || '' });
    const values = { title, ...scheduleValues, dueTime: validTime(this.dueTimeInput.value), note: this.noteInput.value.trim(), priority: this.priorityInput.value, projectId: this.projectInput.value || null, waitingFor: this.waitingForInput.value.trim(), followUpDate: this.isTemplate ? '' : this.followUpInput.value, updatedAt: Date.now() };
    const ok = await this.plugin.mutate(data => {
      if (values.projectId && !data.projects.some(p => p.id === values.projectId)) throw new Error("This project has been removed.");
      if (this.isTemplate) {
        if (data.templates.some(t => t.id !== this.options.templateId && t.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error("A template with this name already exists.");
        const fields = { name, ...templateFields({ ...values, startInDays: scheduleValues.startDate ? daysBetween(dayKey(),scheduleValues.startDate) : null, startOffsetDays: scheduleValues.startDate && endDate ? daysBetween(endDate,scheduleValues.startDate) : null, status, dueInDays, followUpInDays, repeat: rule, subtasks }), updatedAt: Date.now() };
        if (this.options.templateId) {
          const template = data.templates.find(t => t.id === this.options.templateId); if (!template) throw new Error("Template not found."); Object.assign(template, fields);
        } else data.templates.push({ id: uid(), ...fields, createdAt: Date.now() });
      } else if (this.taskId) {
        const task = data.tasks.find(t => t.id === this.taskId); if (!task || task.deletedAt || task.archivedAt) throw new Error("This task can no longer be edited.");
        const subtasksChanged = JSON.stringify(subtasks) !== JSON.stringify(this.originalSubtasks);
        if (subtasksChanged && JSON.stringify(task.subtasks) !== JSON.stringify(this.originalSubtasks)) throw new Error("Subtasks have changed. Reopen the dialog before saving.");
        Object.assign(task, values, { due: this.dueInput.value }); if (subtasksChanged) task.subtasks = subtasks;
        if(rule.frequency!=='weekly'&&task.weeklyRecurrence){const s=continuousSeries(data,task);if(s)s.enabled=false;task.weeklyRecurrence.enabled=false;}
        if (status !== this.originalStatus) setStatus(task, status);
        if (this.logInput?.value.trim()) task.worklog.push({ id: uid(), text: this.logInput.value.trim(), at: Date.now() });
        if(task.due || rule.frequency==='none') configureRecurrence(data, task, rule);
      } else {
        const task = { id: uid(), ...values, status, due: this.dueInput.value, createdAt: Date.now(), completedAt: null, archivedAt: null, recurrenceId: null, occurrenceDate: '', subtasks, worklog: [] };
        if (this.logInput?.value.trim()) task.worklog.push({ id: uid(), text: this.logInput.value.trim(), at: Date.now() });
        data.tasks.push(task); configureRecurrence(data, task, rule);
      }
    });
    if (ok) this.close(); else { this.saving = false; this.saveButton.disabled = false; if (this.deleteTaskButton) this.deleteTaskButton.disabled = false; this.setSubtaskSaving(false); }
  }
  onClose() { this.contentEl.empty(); }
}
class TemplateModal extends TaskModal {
  constructor(app, plugin, templateId = null, seedTask = null) { super(app, plugin, null, { mode: 'template', templateId, seedTask: seedTask ? copy(seedTask) : null }); }
}
class TemplatePickerModal extends Modal {
  constructor(app, plugin, taskModal = null) { super(app); this.plugin = plugin; this.taskModal = taskModal; this.creating = false; this.templateButtons = []; }
  onOpen() {
    this.contentEl.addClass('tp-controls'); this.contentEl.setAttribute('lang', 'en-GB');
    this.contentEl.empty(); this.contentEl.addClass('tp-template-picker');
    this.contentEl.createEl('h2', { text: "Create task from template" });
    this.contentEl.createEl('p', { text: "Choose a template. The new task opens immediately for editing.", cls: 'tp-muted' });
    this.searchInput = this.contentEl.createEl('input', { type: 'search', attr: { placeholder: "Search templates …", 'aria-label': "Search templates" } });
    this.list = this.contentEl.createDiv('tp-template-picker-list');
    this.searchInput.oninput = () => this.renderOptions();
    this.cancelButton = button(this.contentEl, "Cancel", () => { if (!this.creating) this.close(); });
    this.renderOptions(); this.searchInput.focus();
  }
  renderOptions() {
    this.list.empty(); this.templateButtons = [];
    const search = this.searchInput.value.trim().toLocaleLowerCase();
    const templates = this.plugin.data.templates.filter(t => [t.name, t.title, t.note].join(' ').toLocaleLowerCase().includes(search)).sort((a, b) => a.name.localeCompare(b.name));
    for (const t of templates) {
      const row = this.list.createDiv('tp-template-picker-option'); row.setAttribute('data-template-id', t.id);
      const choose = button(row, t.name, () => this.choose(t.id), 'tp-template-choice');
      choose.setAttribute('aria-label', "Task from template " + t.name + ' — create'); choose.disabled = this.creating; this.templateButtons.push(choose);
      const meta = row.createDiv('tp-meta'); priorityBadge(meta, t.priority); statusBadge(meta, t.status);
      meta.createSpan({ text: t.subtasks.length + " subtasks", cls: 'tp-muted' });
      if (t.title) row.createDiv({ text: t.title, cls: 'tp-template-title' });
    }
    if (!templates.length) this.list.createDiv({ text: search ? "No matching templates." : "No templates yet. Create one using + Template next to + Task.", cls: 'tp-empty' });
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
    this.contentEl.addClass('tp-controls'); this.contentEl.setAttribute('lang', 'en-GB');
    this.contentEl.createEl('h2', { text: "Delete template?" });
    this.contentEl.createEl('p', { text: "The template will be removed. Tasks already created from it are kept." });
    const actions = this.contentEl.createDiv('tp-inline-actions');
    this.deleteButton = button(actions, "Delete template", () => this.confirm(), 'mod-warning'); button(actions, "Cancel", () => this.close());
  }
  async confirm() {
    if (this.saving) return; this.saving = true; this.deleteButton.disabled = true;
    const ok = await this.plugin.mutate(data => { data.templates = data.templates.filter(t => t.id !== this.templateId); });
    if (ok) this.close(); else { this.saving = false; this.deleteButton.disabled = false; }
  }
  onClose() { this.contentEl.empty(); }
}
class DeleteTaskForeverModal extends Modal {
  constructor(app, plugin, taskId) { super(app); this.plugin = plugin; this.taskId = taskId; this.saving = false; }
  onOpen() {
    this.contentEl.addClass('tp-controls'); this.contentEl.setAttribute('lang', 'en-GB');
    this.contentEl.createEl('h2', { text: "Permanently delete task?" });
    const task = this.plugin.data.tasks.find(t => t.id === this.taskId && t.deletedAt);
    this.contentEl.createEl('p', { text: task ? '„' + task.title + "” and all its subtasks and activity will be permanently removed. This cannot be undone." : "This task is no longer in Trash." });
    const actions = this.contentEl.createDiv('tp-inline-actions'); this.deleteButton = button(actions, "Delete permanently", () => this.confirm(), 'mod-warning'); this.deleteButton.disabled = !task; button(actions, "Cancel", () => this.close());
  }
  async confirm() {
    if (this.saving) return; this.saving = true; this.deleteButton.disabled = true;
    const ok = await this.plugin.deleteTaskForever(this.taskId);
    if (ok) this.close(); else { this.saving = false; this.deleteButton.disabled = false; }
  }
  onClose() { this.contentEl.empty(); }
}

class ProjectModal extends Modal {
  constructor(app, plugin, projectId = null, onSaved = null) { super(app); this.plugin = plugin; this.projectId = projectId; this.onSaved = onSaved; this.saving = false; }
  onOpen() {
    this.contentEl.addClass('tp-controls'); this.contentEl.setAttribute('lang', 'en-GB');
    const project = this.plugin.data.projects.find(p => p.id === this.projectId);
    this.contentEl.createEl('h2', { text: project ? "Edit project" : "New project" });
    const form = this.contentEl.createEl('form');
    const label = form.createEl('label', { text: "Project name", cls: 'tp-field' }); this.nameInput = label.createEl('input', { type: 'text' }); this.nameInput.required = true; this.nameInput.value = project?.name || '';
    const noteLabel = form.createEl('label', { text: "Description · optional", cls: 'tp-field' }); this.noteInput = noteLabel.createEl('textarea'); this.noteInput.value = project?.note || '';
    const visibility = form.createDiv('tp-project-visibility'); visibility.createEl('h3', { text: "Visibility" });
    const toggle = (text, checked) => { const label = visibility.createEl('label', { cls: 'tp-reminder-toggle' }); const input = label.createEl('input', { type: 'checkbox' }); input.checked = checked; label.createSpan({ text }); return input; };
    this.onlyInput = toggle("Show only in project view", !!project?.onlyInProjects);
    this.dashboardInput = toggle("Include in dashboard", project?.includeInDashboard !== false);
    this.remindersInput = toggle("Enable reminders for this project", project?.remindersEnabled !== false);
    visibility.createDiv({ text: "Hidden projects are excluded from task boards, Calendar and the general archive. Dashboard and reminders can be configured independently. Trash shows all deleted tasks.", cls: 'tp-help' });
    const actions = form.createDiv('tp-inline-actions'); this.saveButton = actions.createEl('button', { text: "Save project", cls: 'mod-cta', type: 'submit' }); button(actions, "Cancel", () => this.close());
    form.onsubmit = e => { e.preventDefault(); void this.submit(); }; this.nameInput.focus();
  }
  async submit() {
    if (this.saving) return;
    const name = this.nameInput.value.trim(), note = this.noteInput.value.trim(), visibility = { onlyInProjects: this.onlyInput.checked, includeInDashboard: this.dashboardInput.checked, remindersEnabled: this.remindersInput.checked };
    if (!name) { new Notice("Enter a project name."); return; }
    if (this.plugin.data.projects.some(p => p.id !== this.projectId && p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { new Notice("A project with this name already exists."); return; }
    this.saving = true; this.saveButton.disabled = true; let id = this.projectId;
    const ok = await this.plugin.mutate(data => {
      if (data.projects.some(p => p.id !== id && p.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error("Project name already exists.");
      if (id) { const project = data.projects.find(p => p.id === id); if (!project) throw new Error("Project has been removed."); Object.assign(project, { name, note, ...visibility }); }
      else { id = uid(); data.projects.push({ id, name, note, ...visibility, createdAt: Date.now() }); }
    });
    if (ok) { this.close(); this.onSaved?.(id); } else { this.saving = false; this.saveButton.disabled = false; }
  }
  onClose() { this.contentEl.empty(); }
}
class DeleteProjectModal extends Modal {
  constructor(app, plugin, projectId, onDeleted = null) { super(app); this.plugin = plugin; this.projectId = projectId; this.onDeleted = onDeleted; this.saving = false; }
  onOpen() {
    this.contentEl.addClass('tp-controls'); this.contentEl.setAttribute('lang', 'en-GB');
    this.contentEl.createEl('h2', { text: "Remove project?" });
    this.contentEl.createEl('p', { text: "Tasks are kept and assigned to No project. Templates and future recurring tasks also keep their contents and lose only the project assignment." });
    const actions = this.contentEl.createDiv('tp-inline-actions'); this.removeButton = button(actions, "Remove project", () => this.confirm(), 'mod-warning'); button(actions, "Cancel", () => this.close());
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
    this.contentEl.addClass('tp-controls'); this.contentEl.setAttribute('lang', 'en-GB');
    this.contentEl.createEl('h2', { text: "Due date reminders" });
    const label = this.contentEl.createEl('label', { cls: 'tp-reminder-toggle' }); this.enabledInput = label.createEl('input', { type: 'checkbox' }); this.enabledInput.checked = this.plugin.data.reminderSettings.enabled; label.createSpan({ text: "Show reminders in Obsidian" });
    const lead = this.contentEl.createEl('label', { text: "Advance notice", cls: 'tp-field' }); this.leadInput = lead.createEl('select');
    for (const days of [0, 1, 3, 7]) this.leadInput.createEl('option', { text: days === 0 ? "On the due date" : days + " day(s) before", value: String(days) }); this.leadInput.value = String(this.plugin.data.reminderSettings.leadDays);
    this.contentEl.createEl('p', { text: "Includes tasks, open subtasks and follow-ups. Each date is announced at most once a day. Timed tasks can also notify when their due time arrives. Reminders work while the plugin is loaded in Obsidian.", cls: 'tp-help' });
    const actions = this.contentEl.createDiv('tp-inline-actions'); this.saveButton = button(actions, "Save", () => this.submit(), 'mod-cta'); button(actions, "Cancel", () => this.close());
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
  constructor(app,plugin){super(app);this.plugin=plugin;this.busy=false;}
  onOpen(){this.contentEl.addClass('tp-modal');this.contentEl.addClass('tp-controls');this.contentEl.setAttribute('lang','en-GB');this.contentEl.createEl('h2',{text:'Manage recurrences'});this.contentEl.createEl('p',{text:'Weekly repeats use one continuously open task. Pick its weekday below; every calendar entry shares the same task, subtasks and activity. Daily and monthly recurrences still create separate tasks.',cls:'tp-help'});this.list=this.contentEl.createDiv('tp-series-list');this.renderList();button(this.contentEl,'Close',()=>this.close());}
  renderList(){
    this.list.empty();if(!this.plugin.data.recurrences.length)this.list.createDiv({text:'No recurring tasks yet. Choose a recurrence in the task dialog.',cls:'tp-empty'});
    for(const series of this.plugin.data.recurrences){
      const owner=this.plugin.data.tasks.find(t=>t.id===series.taskId),row=this.list.createDiv('tp-series-row');row.createEl('h3',{text:owner?.title||series.defaults.title});
      if(series.mode==='continuous-weekly'){
        row.createDiv({text:(series.enabled?'Active':'Paused')+' · One shared task · '+(series.interval===1?'Every '+WEEKDAYS[series.weekday]:'Every '+series.interval+' weeks on '+WEEKDAYS[series.weekday]),cls:'tp-muted'});
        const fields=row.createDiv('tp-weekly-rule-fields'),dayLabel=fields.createEl('label',{text:'Weekday',cls:'tp-field'}),day=dayLabel.createEl('select',{attr:{'aria-label':'Weekday for '+series.id}});WEEKDAYS.forEach((name,i)=>day.createEl('option',{text:name,value:String(i)}));day.value=String(series.weekday);
        const everyLabel=fields.createEl('label',{text:'Every … weeks',cls:'tp-field'}),every=everyLabel.createEl('input',{type:'number'});every.min='1';every.max='365';every.step='1';every.value=String(series.interval);
        const dateLabel=fields.createEl('label',{text:'First occurrence',cls:'tp-field'}),date=dateLabel.createEl('input',{type:'date'});date.value=series.anchorDate;
        const actions=row.createDiv('tp-inline-actions');button(actions,'Save weekly rule',()=>this.change(series.id,(s,data)=>{if(!validDate(date.value))throw new Error('Choose a first occurrence date.');changeWeeklyPattern(data,s,Number(day.value),Number(every.value),date.value);}));
        button(actions,series.enabled?'Pause':'Resume',()=>this.change(series.id,(s,data)=>{if(s.enabled)s.enabled=false;else resumeWeekly(data,s);}));
        if(owner&&!owner.deletedAt)button(actions,'Edit task',()=>new TaskModal(this.app,this.plugin,owner.id).open());
      }else{
        row.createDiv({text:(series.enabled?'Active':'Paused')+' · '+REPEAT_OPTIONS.find(r=>r.value===series.frequency)?.label+' · Interval '+series.interval+' · '+projectName(this.plugin.data,series.defaults.projectId),cls:'tp-muted'});
        const actions=row.createDiv('tp-inline-actions'),next=actions.createEl('input',{type:'date',attr:{'aria-label':'Next date for '+series.defaults.title}});next.value=series.nextDate;
        button(actions,'Save date',()=>this.change(series.id,s=>{if(!validDate(next.value))throw new Error('Invalid date.');s.nextDate=next.value;s.anchorDay=Number(next.value.slice(-2));}));button(actions,series.enabled?'Pause':'Resume',()=>this.change(series.id,s=>{if(s.enabled)s.enabled=false;else resumeSeries(s);}));
      }
    }
  }
  async change(id,action){if(this.busy)return false;this.busy=true;const ok=await this.plugin.mutate(data=>{const series=data.recurrences.find(s=>s.id===id);if(!series)throw new Error('Recurrence not found.');action(series,data);});this.busy=false;this.renderList();return ok;}
  onClose(){this.contentEl.empty();}
}

function isRecurringTask(data, task) { return !!task.recurrenceId && data.recurrences.some(series => series.id === task.recurrenceId); }

class PlannerView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf); this.plugin = plugin; this.sidebarOpen = false; this.sidebarId='tp-tools-'+uid(); this.tab = 'home'; this.taskBoard = 'status'; this.recurringBoard = 'status'; this.drafts = new Map();
    this.draftInputs = new Map(); this.draftControls = new Map(); this.pendingDrafts = new Set();
    this.expanded = new Set(); this.archiveSearch = ''; this.scrollPositions = new Map();
    this.filters = { query: '', status: '', priority: '', due: 'all', project: 'all' };
    this.selectedProject = 'all'; this.projectBoard = 'status'; this.calendarMode = 'week'; this.calendarDate = dayKey();
  }
  getViewType() { return VIEW; }
  getDisplayText() { return "Daily Planner"; }
  getIcon() { return 'layout-dashboard'; }
  async onOpen() { await this.plugin.runMaintenance(); await this.plugin.checkReminders(); this.render(); }
  async onClose() { this.drafts.clear();this.unbindBackNavigation(); }
  goHome() { this.sidebarOpen=false;this.tab='home';this.render(); }
  handleBackNavigation(event) {
    const keyboard=event.type==='keydown'&&event.altKey&&!event.ctrlKey&&!event.metaKey&&event.key==='ArrowLeft';
    if(!keyboard&&event.button!==3)return false;
    const pending=Date.now()<(this.backMouseUntil||0);
    if(this.tab==='home'&&!pending)return false;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
    if(!keyboard&&(event.type==='mousedown'||event.type==='pointerdown')){this.backMouseUntil=Date.now()+1000;return true;}
    if(this.tab!=='home'){this.backMouseUntil=Date.now()+1000;this.goHome();}
    return true;
  }
  bindBackNavigation(root) {
    if(this.backRoot===root)return;this.unbindBackNavigation();this.backRoot=root;
    this.backHandler=event=>this.handleBackNavigation(event);
    for(const type of ['pointerdown','pointerup','mousedown','mouseup','auxclick','keydown'])root.addEventListener?.(type,this.backHandler,true);
  }
  unbindBackNavigation() {
    if(this.backRoot&&this.backHandler)for(const type of ['pointerdown','pointerup','mousedown','mouseup','auxclick','keydown'])this.backRoot.removeEventListener?.(type,this.backHandler,true);
    this.backRoot=null;this.backHandler=null;this.backMouseUntil=0;
  }
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
    root.empty(); root.addClass('tp-root');root.removeClass('tp-home-root');if(this.tab==='home')root.addClass('tp-home-root'); root.setAttribute('lang', 'en-GB');
    this.bindBackNavigation(root);
    let content=root;
    if(this.tab!=='home'){
      const head=root.createDiv('tp-head tp-tool-header'),identity=head.createDiv('tp-head-identity');
      const home=button(identity,'',()=>this.goHome(),'tp-home-button');home.setAttribute('aria-label','Go to home');home.title='Go to home';addSymbol(home,{key:'home',icon:'home'});home.createSpan({text:'Home'});
      const toggle=button(identity,'',()=>{this.sidebarOpen=!this.sidebarOpen;sidebar.hidden=!this.sidebarOpen;toggle.setAttribute('aria-expanded',String(this.sidebarOpen));},'tp-sidebar-toggle');addSymbol(toggle,{key:'menu',icon:'menu'});toggle.createSpan({text:'Tools'});toggle.setAttribute('aria-label','Toggle tool sidebar');toggle.setAttribute('aria-expanded',String(this.sidebarOpen));toggle.setAttribute('aria-controls',this.sidebarId);toggle.title='Show or hide tools';
      const headActions=head.createDiv('tp-head-actions');button(headActions,this.tab==='recurring'?'+ Recurring task':'+ Task',()=>new TaskModal(this.app,this.plugin,null,{defaultRepeat:this.tab==='recurring'?'weekly':null,defaultProjectId:this.tab==='projects'&&this.plugin.data.projects.some(project=>project.id===this.selectedProject)?this.selectedProject:null}).open(),'mod-cta');button(headActions,'+ Template',()=>new TemplateModal(this.app,this.plugin).open());
      const workspace=root.createDiv('tp-tool-workspace'),sidebar=workspace.createDiv('tp-tabs tp-tool-sidebar');sidebar.hidden=!this.sidebarOpen;sidebar.setAttribute('id',this.sidebarId);sidebar.setAttribute('aria-label','Planner views');sidebar.createDiv({text:'TOOLS',cls:'tp-sidebar-heading'});
      const archiveCount=this.plugin.data.tasks.filter(task=>!task.deletedAt&&!projectOnlyTask(this.plugin.data,task)&&task.archivedAt).length;
      for(const [id,label] of [['board','Tasks'],['recurring','Recurring tasks'],['calendar','Calendar'],['projects','Projects'],['dashboard','Dashboard'],['templates','Templates'],['archive','Archive · '+archiveCount],['trash','Trash · '+this.plugin.data.tasks.filter(task=>task.deletedAt).length]]){
        const item=button(sidebar,label,()=>{this.sidebarOpen=false;this.tab=id;this.render();},this.tab===id?'tp-tab is-active':'tp-tab');item.setAttribute('aria-pressed',String(this.tab===id));
      }
      content=workspace.createDiv('tp-tool-content');
    }else this.sidebarOpen=false;
    if (this.tab === 'board' || this.tab === 'recurring') {
      const taskNav = content.createDiv('tp-task-navigation'); taskNav.setAttribute('aria-label', this.tab === 'recurring' ? "Views within Recurring tasks" : "Views within Tasks");
      taskNav.createSpan({ text: this.tab === 'recurring' ? "Recurring tasks" : "Tasks", cls: 'tp-task-group-label' });
      const segments = taskNav.createDiv('tp-task-segments'); segments.setAttribute('role', 'group'); segments.setAttribute('aria-label', "Choose task view");
      for (const [id, label] of [['status', 'Status'], ['priority', "Priorities"]]) {
        const b = button(segments, label, () => this.switchTaskBoard(id), (this.tab === 'recurring' ? this.recurringBoard : this.taskBoard) === id ? 'tp-task-segment is-active' : 'tp-task-segment');
        b.setAttribute('aria-pressed', String((this.tab === 'recurring' ? this.recurringBoard : this.taskBoard) === id)); b.setAttribute('data-task-board', id);
      }
    }
    const body = content.createDiv('tp-body');
    if (this.tab === 'home') this.renderHome(body); else if (this.tab === 'dashboard') this.renderDashboard(body); else if (this.tab === 'archive') this.renderArchive(body); else if (this.tab === 'templates') this.renderTemplates(body); else if (this.tab === 'calendar' || this.tab === 'today') this.renderCalendar(body); else if (this.tab === 'trash') this.renderTrash(body); else if (this.tab === 'projects') this.renderProjects(body); else this.renderBoard(body);
    const viewKey = this.tab === 'recurring' ? 'recurring:' + this.recurringBoard : this.tab === 'board' ? 'board:' + this.taskBoard : this.tab === 'projects' ? 'projects:' + this.selectedProject + ':' + this.projectBoard : this.tab;
    const position = this.scrollPositions.get(viewKey);
    if (position) {
      body.scrollTop = position.top;
      for (const group of root.querySelectorAll?.('[data-board]') || []) group.querySelector('.tp-board-scroll').scrollLeft = position.boards[group.getAttribute('data-board')] || 0;
    }
    this.renderedTab = viewKey;
  }
  renderHome(parent) {
    const page=parent.createDiv('tp-home');
    const intro=page.createDiv('tp-home-intro');intro.createSpan({text:'YOUR WORKSPACE',cls:'tp-home-eyebrow'});intro.createEl('h3',{text:'What would you like to work on?'});intro.createDiv({text:'Your plans, projects and routines. Everything in one place.',cls:'tp-home-subtitle'});
    const layout=page.createDiv('tp-home-layout'),summary=layout.createDiv('tp-home-summary'),center=layout.createDiv('tp-home-tools'),upcoming=layout.createDiv('tp-home-upcoming');
    summary.setAttribute('aria-label','Workspace overview');upcoming.setAttribute('aria-label','Upcoming tasks');
    this.renderHomeOverview(summary);this.renderHomeUpcoming(upcoming);
    const tasks=this.plugin.data.tasks.filter(task=>!task.deletedAt&&!task.archivedAt&&task.status!=='Done'&&!projectOnlyTask(this.plugin.data,task));
    const archive=this.plugin.data.tasks.filter(task=>!task.deletedAt&&task.archivedAt&&!projectOnlyTask(this.plugin.data,task)).length;
    const count=(n,one,many=one+'s')=>n+' '+(n===1?one:many);
    const tools=[
      {id:'board',name:'Tasks',icon:'tasks',tone:'blue',description:'Organise everyday work by status and priority.',detail:count(tasks.filter(task=>!isRecurringTask(this.plugin.data,task)).length,'open task')},
      {id:'recurring',name:'Recurring tasks',icon:'repeat',tone:'purple',description:'Keep your daily, weekly and monthly routines together.',detail:count(tasks.filter(task=>isRecurringTask(this.plugin.data,task)).length,'open routine')},
      {id:'calendar',name:'Calendar',icon:'calendar',tone:'green',description:'Plan your week, move appointments and shape your schedule.',detail:'Week & month views'},
      {id:'projects',name:'Projects',icon:'folder',tone:'amber',description:'Focus on a project and the work that belongs to it.',detail:count(this.plugin.data.projects.length,'project')},
      {id:'dashboard',name:'Dashboard',icon:'chart',tone:'rose',description:'See progress, completed work and what needs attention.',detail:'Progress & activity'},
      {id:'templates',name:'Templates',icon:'template',tone:'blue',description:'Build reusable tasks with ready-made subtasks.',detail:count(this.plugin.data.templates.length,'template')},
      {id:'archive',name:'Archive',icon:'archive',tone:'green',description:'Review finished work. Entries are kept for two months.',detail:count(archive,'archived task')},
      {id:'trash',name:'Trash',icon:'trash',tone:'rose',description:'Restore accidentally deleted tasks or remove them forever.',detail:count(this.plugin.data.tasks.filter(task=>task.deletedAt).length,'deleted task')}
    ];
    const grid=center.createDiv('tp-home-grid');grid.setAttribute('aria-label','Planner tools');
    const tile=(parent,tool,action)=>{const item=button(parent,'',action,'tp-tool-tile tp-tool-'+tool.tone);item.setAttribute('data-tool',tool.id);item.setAttribute('aria-label','Open '+tool.name);
      const top=item.createSpan({cls:'tp-tool-top'});addSymbol(top,{key:tool.icon,icon:tool.icon});top.createSpan({text:'↗',cls:'tp-tool-arrow',attr:{'aria-hidden':'true'}});
      item.createSpan({text:tool.name,cls:'tp-tool-name'});item.createSpan({text:tool.description,cls:'tp-tool-description'});item.createSpan({text:tool.detail,cls:'tp-tool-detail'});
    };
    for(const tool of tools)tile(grid,tool,()=>{this.tab=tool.id;this.render();});
    center.createEl('h4',{text:'Tools & settings',cls:'tp-home-settings-title'});const settings=center.createDiv('tp-home-settings');
    tile(settings,{id:'recurrence-settings',name:'Recurrence settings',icon:'repeat',tone:'purple',description:'Choose weekdays, adjust intervals and pause routines.',detail:'Manage repetition'},()=>new SeriesManagerModal(this.app,this.plugin).open());
    tile(settings,{id:'reminders',name:'Reminders',icon:'bell',tone:'amber',description:'Choose when to be notified about upcoming work.',detail:this.plugin.data.reminderSettings.enabled?'Reminders enabled':'Reminders disabled'},()=>new ReminderSettingsModal(this.app,this.plugin).open());
  }
  renderHomeOverview(parent) {
    const data={...this.plugin.data,tasks:this.plugin.data.tasks.filter(task=>!projectOnlyTask(this.plugin.data,task)&&this.plugin.data.projects.find(project=>project.id===task.projectId)?.includeInDashboard!==false)},m=metrics(data);
    const heading=parent.createDiv('tp-home-side-heading');addSymbol(heading,{key:'chart',icon:'chart'});heading.createEl('h4',{text:'At a glance'});
    parent.createDiv({text:new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'}),cls:'tp-home-side-subtitle'});
    const stats=parent.createDiv('tp-home-stat-grid');
    for(const [key,label,value,tone] of [['open','Open tasks',m.active.length,'blue'],['progress','In Progress',m.inProgress.length,'amber'],['today','Due today',m.dueToday.length,'purple'],['done','Completed · 7 days',m.done7,'green']]){
      const stat=stats.createDiv('tp-home-stat tp-tool-'+tone);stat.setAttribute('data-home-metric',key);stat.createSpan({text:String(value),cls:'tp-home-stat-value'});stat.createSpan({text:label,cls:'tp-home-stat-label'});
    }
    const attention=parent.createDiv('tp-home-attention');attention.createSpan({text:m.overdue.length+' overdue',cls:m.overdue.length?'tp-home-overdue':''});attention.createSpan({text:m.waiting.length+' waiting'});
    const activity=parent.createDiv('tp-home-mini-chart'),max=Math.max(1,...m.week.map(day=>day.count));activity.setAttribute('aria-label','Completed tasks in the last seven days');
    for(const day of m.week){const col=activity.createDiv('tp-home-mini-day');col.title=day.key+': '+day.count+' completed';col.createDiv('tp-home-mini-track').createDiv('tp-home-mini-bar').style.height=(day.count/max*100)+'%';col.createSpan({text:new Date(day.key+'T12:00:00').toLocaleDateString('en-GB',{weekday:'narrow'})});}
    button(parent,'Open dashboard →',()=>{this.tab='dashboard';this.render();},'tp-home-side-link');
  }
  renderHomeUpcoming(parent) {
    const now=Date.now(),today=dayKey(now),last=shiftDate(today,60),heading=parent.createDiv('tp-home-side-heading');addSymbol(heading,{key:'calendar',icon:'calendar'});heading.createEl('h4',{text:'Next up'});
    parent.createDiv({text:'Upcoming tasks · next 60 days',cls:'tp-home-side-subtitle'});
    const entries=attentionEntries(this.plugin.data,today,last).filter(entry=>entry.kind==='task'&&!projectOnlyTask(this.plugin.data,entry.task)).map(entry=>({...entry,range:taskRange(entry.task)})).filter(entry=>entry.range&&entry.range.endDate>=today&&entry.range.startDate<=last&&(!entry.range.timed||entry.range.end>=wallValue(today,new Date(now).toTimeString().slice(0,5)))).sort((a,b)=>a.range.start-b.range.start||a.range.end-b.range.end||a.task.title.localeCompare(b.task.title));
    const list=parent.createDiv('tp-home-preview-list'),seen=new Set();let shown=0;
    for(const entry of entries){if(seen.has(entry.task.id))continue;seen.add(entry.task.id);if(shown++>=6)break;
      const task=calendarSourceTask(entry),item=button(list,'',()=>{this.tab=isRecurringTask(this.plugin.data,task)?'recurring':'board';this.render();new TaskModal(this.app,this.plugin,task.id).open();},'tp-home-preview tp-priority-'+(PRIORITIES.find(priority=>priority.name===task.priority)?.key||'mid'));item.setAttribute('data-preview-task',task.id);item.setAttribute('aria-label','Open task: '+task.title);
      item.createSpan({text:entry.task.title,cls:'tp-home-preview-title'});const date=entry.range.startDate===today?'Today':new Date(entry.range.startDate+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'});item.createSpan({text:date+' · '+(entry.range.timed?entry.range.startTime+' – '+entry.range.endTime:'All day'),cls:'tp-home-preview-date'});
      item.createSpan({text:task.priority+' · '+projectName(this.plugin.data,task.projectId)+(task.weeklyRecurrence?' · ↻ Weekly':''),cls:'tp-home-preview-meta'});
    }
    if(!seen.size)list.createDiv({text:'Nothing scheduled yet. Open Calendar to plan your next task.',cls:'tp-home-empty'});
    button(parent,'Open calendar →',()=>{this.tab='calendar';this.render();},'tp-home-side-link');
  }
  switchTaskBoard(board) {
    if (!['status', 'priority'].includes(board)) return;
    if (this.tab === 'recurring') this.recurringBoard = board; else { this.tab = 'board'; this.taskBoard = board; } this.render();
  }
  renderBoard(parent) {
    const recurring = this.tab === 'recurring', board = recurring ? this.recurringBoard : this.taskBoard;
    if (recurring) {
      const head = parent.createDiv('tp-page-heading'), title = head.createDiv();title.createEl('h3',{text:'Recurring tasks'});
      title.createDiv({text:'Daily, weekly and monthly routines have their own boards. Paused routines stay here.',cls:'tp-muted'});
      button(head,'Manage recurrences',()=>new SeriesManagerModal(this.app,this.plugin).open());
    }
    const target = parent.createDiv('tp-filter-results');
    const draw = () => {
      target.empty(); this.draftInputs = new Map(); this.draftControls = new Map();
      if (board === 'priority') this.renderTaskBoard(target, recurring ? 'Recurring priorities' : 'Priorities', recurring ? 'Unfinished recurring tasks by urgency' : 'Unfinished tasks by urgency · Part of Tasks', 'priority', PRIORITIES);
      else this.renderTaskBoard(target, recurring ? 'Recurring status' : 'Status', recurring ? 'Organise recurring tasks by status' : 'Organise by status · Part of Tasks', 'status', COLS);
    };
    const filters = parent.createDiv('tp-filter-slot'); parent.insertBefore(filters, target); this.renderFilters(filters, draw); draw();
  }
  renderFilters(parent, onUpdate, options = {}) {
    const bar = parent.createDiv('tp-filters');
    const query = bar.createEl('input', { type: 'search', attr: { placeholder: "Search tasks, subtasks or activity …", 'aria-label': "Search tasks" } }); query.value = this.filters.query;
    query.oninput = () => { this.filters.query = query.value; onUpdate(); };
    const select = (label, key, entries) => {
      const field = bar.createEl('select', { attr: { 'aria-label': label } }); entries.forEach(([value, text]) => { field.createEl('option', { text, value }).value = value; }); field.value = this.filters[key];
      field.onchange = () => { this.filters[key] = field.value; onUpdate(); };
    };
    select("Filter by status", 'status', [['', "All statuses"], ...COLS.map(c => [c.name, c.name])]);
    select("Filter by priority", 'priority', [['', "All priorities"], ...PRIORITIES.map(p => [p.name, p.name])]);
    if (!options.hideDate) select("Filter by due date", 'due', [['all', "All dates"], ['today', "Due today"], ['overdue', "Overdue"], ['week', "Next 7 days"], ['none', "No due date"]]);
    if (!options.hideProject) select("Filter by project", 'project', [['all', "All projects"], ['none', "No project"], ...this.plugin.data.projects.map(p => [p.id, p.name])]);
    button(bar, "Reset filters", () => { this.filters = { query: '', status: '', priority: '', due: 'all', project: 'all' }; this.render(); }, 'tp-small-button');
  }
  visibleTasks(scope = null, archived = false, category = this.tab === 'recurring' ? 'recurring' : 'regular') {
    const filters = { ...this.filters, project: scope == null ? this.filters.project : scope };
    return this.plugin.data.tasks.filter(t => !t.deletedAt && !!t.archivedAt === archived && (archived || isRecurringTask(this.plugin.data,t) === (category === 'recurring')) && (scope != null || !projectOnlyTask(this.plugin.data, t)) && taskMatches(t, filters, this.plugin.data));
  }
  renderCalendar(parent) {
    const head = parent.createDiv('tp-page-heading'), title = head.createDiv(); title.createEl('h3', { text: "Week and calendar view" });
    title.createDiv({ text: this.calendarMode === 'week' ? 'Drag to move · Pull a time-block edge to resize (15 min)' : 'Drag to move · Drag date handles to extend a range · Click to edit times', cls: 'tp-muted' });
    const actions = head.createDiv('tp-inline-actions');
    button(actions, "Recurrences", () => new SeriesManagerModal(this.app, this.plugin).open());
    button(actions, "Reminders", () => new ReminderSettingsModal(this.app, this.plugin).open());
    button(actions, "Check now", () => this.plugin.checkReminders(Date.now(), true));
    const nav = parent.createDiv('tp-calendar-toolbar');
    for (const [mode, label] of [['week', "Week"], ['month', "Month"]]) {
      const b = button(nav, label, () => { this.calendarMode = mode; this.render(); }, this.calendarMode === mode ? 'mod-cta' : ''); b.setAttribute('aria-pressed', String(this.calendarMode === mode));
    }
    button(nav, '‹', () => this.moveCalendar(-1)).setAttribute('aria-label', "Previous period");
    button(nav, "Today", () => { this.calendarDate = dayKey(); this.render(); });
    button(nav, '›', () => this.moveCalendar(1)).setAttribute('aria-label', "Next period");
    const jump = nav.createEl('input', { type: 'date', attr: { 'aria-label': "Choose calendar date" } }); jump.value = this.calendarDate;
    jump.onchange = () => { if (validDate(jump.value)) { this.calendarDate = jump.value; this.render(); } };
    const filters = parent.createDiv(), target = parent.createDiv();
    const draw = () => {
      target.empty(); const range = calendarRange(this.calendarDate, this.calendarMode);
      const allowed = new Set(this.plugin.data.tasks.filter(t => !t.deletedAt && !projectOnlyTask(this.plugin.data, t) && taskMatches(t, { ...this.filters, due: 'all' }, this.plugin.data)).map(t => t.id));
      const entries = attentionEntries(this.plugin.data,range.start,shiftDate(range.start,range.days-1)).filter(e => allowed.has(e.task.id));
      const label = this.calendarMode === 'month' ? new Date(this.calendarDate + 'T12:00:00').toLocaleDateString("en-GB", { month: 'long', year: 'numeric' }) : shortDate(range.start) + ' – ' + shortDate(shiftDate(range.start, 6));
      target.createEl('h3', { text: label, cls: 'tp-calendar-period' });
      const workspace=target.createDiv('tp-calendar-workspace'),calendarHost=workspace.createDiv('tp-calendar-main'),sidebar=workspace.createDiv('tp-calendar-sidebar');
      if(this.calendarMode==='week') this.renderWeekTimeline(calendarHost,entries,range.start); else {
      const scroll = calendarHost.createDiv('tp-calendar-scroll'), grid = scroll.createDiv('tp-calendar-grid tp-calendar-' + this.calendarMode); grid.setAttribute('aria-label', label);
      for (const weekday of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) grid.createDiv({ text: weekday, cls: 'tp-calendar-weekday' });
      for (let i = 0; i < range.days; i++) {
        const date = shiftDate(range.start, i), day = grid.createDiv('tp-calendar-day' + (date === dayKey() ? ' is-today' : '') + (date.slice(0, 7) !== this.calendarDate.slice(0, 7) && this.calendarMode === 'month' ? ' is-other-month' : ''));
        day.setAttribute('data-calendar-date', date); day.createDiv({ text: new Date(date + 'T12:00:00').toLocaleDateString("en-GB", { day: 'numeric', month: 'short' }), cls: 'tp-calendar-day-label' });
        this.calendarDrop(day,date);
        for (const entry of calendarEntriesForDate(entries,date).sort((a,b)=>Number(a.timed)-Number(b.timed)||(a.startMinute||0)-(b.startMinute||0)||compareCalendarEntries(a,b))) this.renderCalendarEvent(day, entry);
      }
      }
      const extras = target.createDiv('tp-calendar-extras');
      const overdue = entries.filter(e => entryOverdue(e));
      const over = extras.createDiv('tp-panel'); over.createEl('h4', { text: "Overdue · " + overdue.length });
      for (const entry of overdue.sort((a,b) => a.date.localeCompare(b.date) || compareCalendarEntries(a,b))) this.renderCalendarEvent(over, entry, true);
      if (!overdue.length) over.createDiv({ text: "No overdue items.", cls: 'tp-muted' });
      const undated = this.plugin.data.tasks.filter(t => allowed.has(t.id) && !t.archivedAt && t.status !== 'Done' && !validDate(t.due));
      const none = sidebar.createDiv('tp-panel tp-unscheduled-zone'); none.createEl('h4', { text: 'No due date · ' + undated.length });
      none.setAttribute('data-unscheduled-dropzone','true');none.setAttribute('aria-label','Unscheduled tasks drop zone');
      none.createDiv({text:'Drag a task into a day or time slot. Drop an event here to remove its date.',cls:'tp-help'});
      none.ondragover=e=>{if(e.dataTransfer?.types.includes('application/x-tagesplaner-date')){e.preventDefault();none.addClass('tp-over');e.dataTransfer.dropEffect='move';}};
      none.ondragleave=e=>{if(!none.contains(e.relatedTarget))none.removeClass('tp-over');};
      none.ondrop=e=>{e.preventDefault();e.stopPropagation?.();none.removeClass('tp-over');try{const value=JSON.parse(e.dataTransfer?.getData('application/x-tagesplaner-date')||'null');if(value)void this.plugin.clearCalendarDate(value.id,value.kind,value.subtaskId);}catch{new Notice('Could not remove this date.');}};
      for (const task of undated) {
        const item=button(none,task.title,()=>new TaskModal(this.app,this.plugin,task.id).open(),'tp-calendar-undated');item.setAttribute('data-undated-task',task.id);item.draggable=true;item.title='Drag into the calendar to schedule this task, or click to edit.';
        item.ondragstart=e=>{e.dataTransfer.setData('application/x-tagesplaner-date',JSON.stringify({id:task.id,kind:'task'}));e.dataTransfer.effectAllowed='move';};
      }
      if (!undated.length) none.createDiv({ text: 'Drop a task here to remove its schedule.', cls: 'tp-empty' });
    };
    this.renderFilters(filters, draw, { hideDate: true }); draw();
  }
  moveCalendar(direction) {
    this.calendarDate = this.calendarMode === 'week' ? shiftDate(this.calendarDate, direction * 7) : shiftMonth(this.calendarDate, direction);
    this.render();
  }
  calendarDrop(day, date, timed = false) {
    day.ondragover = e => { if (e.dataTransfer?.types.some(type => ['application/x-tagesplaner-date', 'application/x-tagesplaner-range-edge'].includes(type))) { e.preventDefault(); day.addClass('tp-over'); } };
    day.ondragleave = () => day.removeClass('tp-over');
    day.ondrop = e => {
      e.preventDefault(); day.removeClass('tp-over');
      try {
        const resize = e.dataTransfer?.getData('application/x-tagesplaner-range-edge');
        if (resize) { const payload = JSON.parse(resize); void this.plugin.setScheduleEdgeDate(payload.id, payload.edge, date, payload.expected, payload.occurrenceStart); return; }
        const value = JSON.parse(e.dataTransfer?.getData('application/x-tagesplaner-date') || 'null'); if (!value) return;
        if (timed && value.kind === 'task') { const box = day.getBoundingClientRect(), minute = Math.max(0, Math.min(1425, Math.round((e.clientY - box.top) / CALENDAR_PX_PER_MINUTE / 15) * 15)); void this.plugin.moveTimedTask(value.id, date, minute); }
        else void this.plugin.reschedule(value.id, value.kind, value.subtaskId, date);
      } catch { new Notice('Could not move this event.'); }
    };
  }
  renderWeekTimeline(parent, entries, start) {
    const days = Array.from({length:7},(_,i) => shiftDate(start,i)), events = days.map(date => calendarEntriesForDate(entries,date)), layouts = events.map(items => layoutTimedEvents(items.filter(e => e.timed)));
    const widths = layouts.map(items => Math.max(210, Math.max(1,...items.map(e=>e.columns)) * 175));
    const scroller = parent.createDiv('tp-agenda-scroll'); scroller.setAttribute('aria-label','Weekly schedule');
    const grid = scroller.createDiv('tp-agenda-grid'); grid.style.gridTemplateColumns = '58px ' + widths.map(w=>'minmax('+w+'px,1fr)').join(' ');
    grid.style.minWidth=(58+widths.reduce((sum,w)=>sum+w,0))+'px';
    grid.createDiv({text:'Local time',cls:'tp-agenda-heading tp-agenda-corner'});
    for(const date of days) { const heading=grid.createDiv('tp-agenda-heading'+(date===dayKey()?' is-today':''));heading.createDiv({text:new Date(date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short'}),cls:'tp-agenda-weekday'});heading.createDiv({text:shortDate(date),cls:'tp-agenda-date'}); }
    grid.createDiv({text:'All day',cls:'tp-agenda-all-label'});
    for(let i=0;i<7;i++){const day=grid.createDiv('tp-agenda-all-day');day.setAttribute('data-all-day-date',days[i]);this.calendarDrop(day,days[i]);for(const entry of events[i].filter(e=>!e.timed))this.renderCalendarEvent(day,entry);}
    const hours = grid.createDiv('tp-agenda-hours');hours.style.height = (1440*CALENDAR_PX_PER_MINUTE)+'px';
    for(let h=0;h<24;h++){const label=hours.createDiv({text:String(h).padStart(2,'0')+':00',cls:'tp-agenda-hour'});label.style.top=(h*60*CALENDAR_PX_PER_MINUTE)+'px';}
    for(let i=0;i<7;i++){
      const day=grid.createDiv('tp-agenda-day'+(days[i]===dayKey()?' is-today':''));day.setAttribute('data-calendar-date',days[i]);day.style.height=(1440*CALENDAR_PX_PER_MINUTE)+'px';this.calendarDrop(day,days[i],true);
      for(const entry of layouts[i]) this.renderTimedEvent(day,entry);
    }
    const saved = this.calendarTimelineScroll;
    const firstStart = layouts.flat().length ? Math.floor(Math.min(...layouts.flat().map(e=>e.startMinute))/60)*60 : 7*60;
    scroller.scrollTop = saved == null ? firstStart*CALENDAR_PX_PER_MINUTE : saved;
    scroller.onscroll = () => { this.calendarTimelineScroll = scroller.scrollTop; };
  }
  eventText(item, entry, label, compact = false) {
    item.createDiv({text:entry.task.title,cls:'tp-calendar-event-title'});
    item.createDiv({text:label,cls:'tp-calendar-event-time'});
    if(!compact)item.createDiv({text:entry.task.priority+' · '+entry.task.status+' · '+projectName(this.plugin.data,entry.task.projectId),cls:'tp-calendar-event-detail'});
    item.title=entry.task.title+'\n'+label+'\n'+projectName(this.plugin.data,entry.task.projectId);
    item.setAttribute('data-event-task',entry.task.id);item.setAttribute('data-event-kind',entry.kind);item.setAttribute('data-event-time',entry.task.dueTime||'');
    item.draggable=true;item.ondragstart=e=>{e.dataTransfer.setData('application/x-tagesplaner-date',JSON.stringify({id:entry.task.id,kind:entry.kind,subtaskId:entry.subtaskId}));e.dataTransfer.effectAllowed='move';};
    this.bindCalendarPointerDrag(item,entry);
  }
  bindCalendarPointerDrag(item,entry) {
    const open=item.onclick,doc=item.ownerDocument;let drag=null,ghost=null,highlight=null;
    const clean=()=>{ghost?.remove();ghost=null;highlight?.removeClass('tp-over');highlight=null;item.removeClass('is-dragging');};
    const hit=(x,y)=>doc.elementFromPoint?.(x,y);
    item.onclick=e=>{if(Date.now()>=(this.suppressCalendarClickUntil||0))open?.(e);};
    item.onpointerdown=e=>{if(e.button!=null&&e.button!==0)return;e.preventDefault();drag={x:e.clientX,y:e.clientY,moved:false,pointerId:e.pointerId};try{item.setPointerCapture?.(e.pointerId);}catch{drag=null;}};
    item.onpointermove=e=>{
      if(!drag)return;
      if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5)return;
      e.preventDefault();drag.moved=true;item.addClass('is-dragging');
      if(!ghost&&doc.body?.createDiv)ghost=doc.body.createDiv({text:entry.task.title,cls:'tp-calendar-drag-ghost'});
      if(ghost){ghost.style.left=(e.clientX+14)+'px';ghost.style.top=(e.clientY+14)+'px';}
      const target=hit(e.clientX,e.clientY)?.closest('[data-unscheduled-dropzone], [data-calendar-date], [data-all-day-date]');
      if(target!==highlight){highlight?.removeClass('tp-over');highlight=target;highlight?.addClass('tp-over');}
    };
    item.onpointerup=async e=>{
      if(!drag)return;const state=drag;drag=null;e.preventDefault();clean();try{item.releasePointerCapture?.(state.pointerId);}catch{}
      if(!state.moved){open?.(e);this.suppressCalendarClickUntil=Date.now()+300;return;}
      this.suppressCalendarClickUntil=Date.now()+300;
      const target=hit(e.clientX,e.clientY);if(!target)return;
      if(target.closest('[data-unscheduled-dropzone]')){await this.plugin.clearCalendarDate(entry.task.id,entry.kind,entry.subtaskId);return;}
      const day=target.closest('[data-calendar-date], [data-all-day-date]');if(!day)return;
      const date=day.getAttribute('data-calendar-date')||day.getAttribute('data-all-day-date');
      if(day.classList.contains('tp-agenda-day')&&entry.kind==='task'){const box=day.getBoundingClientRect(),minute=Math.max(0,Math.min(1425,Math.round((e.clientY-box.top)/CALENDAR_PX_PER_MINUTE/15)*15));await this.plugin.moveTimedTask(entry.task.id,date,minute);}
      else await this.plugin.reschedule(entry.task.id,entry.kind,entry.subtaskId,date);
    };
    item.onpointercancel=()=>{drag=null;clean();};item.onlostpointercapture=()=>{if(drag){drag=null;clean();}};
  }
  renderTimedEvent(parent, entry) {
    const box=parent.createDiv('tp-scheduled-event tp-priority-'+(PRIORITIES.find(p=>p.name===entry.task.priority)?.key||'mid'));box.setAttribute('data-schedule-id',entry.task.id);
    const paint=(start,end)=>{box.style.top=(start*CALENDAR_PX_PER_MINUTE)+'px';box.style.height=((end-start)*CALENDAR_PX_PER_MINUTE)+'px';if(end-start<30)box.addClass('is-short');else box.removeClass('is-short');};paint(entry.startMinute,entry.endMinute);
    box.style.left='calc('+100*entry.column/entry.columns+'% + 5px)';box.style.width='calc('+100/entry.columns+'% - 10px)';
    const item=button(box,'',()=>{if(Date.now()<(this.suppressCalendarClickUntil||0))return;new TaskModal(this.app,this.plugin,entry.task.id).open();},'tp-calendar-event tp-timed-event'+(taskOverdue(entry.task)?' is-overdue':''));
    const range=entry.range,label=(entry.continuesBefore?'← '+shortDate(range.startDate)+' ':'')+(entry.continuesBefore?'00:00':range.startTime)+' – '+(entry.continuesAfter?'24:00 → '+shortDate(range.endDate):range.endTime);
    this.eventText(item,entry,label,true);
    for(const edge of ['start','end'].filter(edge=>edge==='start'?!entry.continuesBefore:!entry.continuesAfter)){
      const handle=button(box,'',()=>{},'tp-resize-handle tp-resize-'+edge);handle.setAttribute('aria-label','Resize '+edge+' of '+entry.task.title);handle.title='Drag to resize '+edge+' · 15-minute steps. Arrow keys adjust by 15 minutes.';handle.draggable=false;
      let drag=null;
      const cancel=()=>{if(!drag)return;drag=null;box.removeClass('is-resizing');paint(entry.startMinute,entry.endMinute);const time=item.querySelector('.tp-calendar-event-time');if(time)time.textContent=label;item.title=entry.task.title+'\n'+label;};
      handle.onpointerdown=e=>{if(e.button!=null&&e.button!==0)return;e.preventDefault();e.stopPropagation();drag={y:e.clientY,delta:0,expected:scheduleKey(calendarSourceTask(entry)),id:e.pointerId};try{handle.setPointerCapture?.(e.pointerId);}catch{cancel();return;}box.addClass('is-resizing');};
      handle.onpointermove=e=>{if(!drag)return;e.preventDefault();drag.delta=Math.round((e.clientY-drag.y)/CALENDAR_PX_PER_MINUTE/15)*15;const updated=resizeRange(entry.task,edge,drag.delta),current=calendarEntriesForDate([{...entry,task:{...entry.task,...updated}}],entry.date)[0];if(current)paint(current.startMinute,current.endMinute);const time=item.querySelector('.tp-calendar-event-time');if(time)time.textContent=updated.startTime+' – '+updated.dueTime;item.title=updated.startDate+' '+updated.startTime+' – '+updated.due+' '+updated.dueTime;};
      handle.onpointerup=async e=>{if(!drag)return;e.preventDefault();e.stopPropagation();const change=drag;drag=null;box.removeClass('is-resizing');try{handle.releasePointerCapture?.(change.id);}catch{}this.suppressCalendarClickUntil=Date.now()+300;if(change.delta)await this.plugin.resizeTask(entry.task.id,edge,change.delta,change.expected);else paint(entry.startMinute,entry.endMinute);};
      handle.onpointercancel=cancel;handle.onlostpointercapture=cancel;
      handle.onkeydown=e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();void this.plugin.resizeTask(entry.task.id,edge,e.key==='ArrowUp'?-15:15,scheduleKey(calendarSourceTask(entry)));}};
    }
  }
  renderCalendarEvent(parent, entry, showDate = false) {
    const wrap=parent.createDiv('tp-calendar-entry'),item=button(wrap,'',()=>new TaskModal(this.app,this.plugin,entry.task.id).open(),'tp-calendar-event tp-priority-'+(PRIORITIES.find(p=>p.name===entry.task.priority)?.key||'mid')+((entry.kind==='task'?taskOverdue(entry.task):entryOverdue(entry))?' is-overdue':''));
    const range=entry.kind==='task'?taskRange(entry.task):null;
    const span=range&&range.startDate!==range.endDate;
    const label=(showDate?shortDate(entry.date)+' · ':'')+(range?.timed?(span?shortDate(range.startDate)+' ':'')+range.startTime+' – '+(span?shortDate(range.endDate)+' ':'')+range.endTime:'All day'+(span?' · '+shortDate(range.startDate)+' – '+shortDate(range.endDate):''))+' · '+entry.label;
    this.eventText(item,entry,label);
    if(range){for(const edge of ['start','end']){const handle=button(wrap,edge==='end'?'↔':'',()=>new TaskModal(this.app,this.plugin,entry.task.id).open(),'tp-date-resize tp-date-resize-'+edge);handle.setAttribute('aria-label','Resize '+edge+' date of '+entry.task.title);handle.title='Drag to another day to change the '+edge+' date';handle.draggable=true;handle.ondragstart=e=>{e.stopPropagation();e.dataTransfer.setData('application/x-tagesplaner-range-edge',JSON.stringify({id:entry.task.id,edge,expected:scheduleKey(calendarSourceTask(entry)),occurrenceStart:entry.sourceTask?entry.task.startDate:null}));};}}
  }
  renderTrash(parent) {
    const title = parent.createDiv('tp-page-heading'); title.createEl('h3', { text: "Trash" });
    parent.createDiv({ text: "Deleted tasks stay here until restored or permanently deleted. Project filters do not apply. Recurrences continue until paused under Calendar → Recurrences.", cls: 'tp-help' });
    const tasks = this.plugin.data.tasks.filter(t => t.deletedAt).sort((a,b) => b.deletedAt - a.deletedAt), grid = parent.createDiv('tp-archive-grid');
    for (const task of tasks) {
      const card = grid.createDiv('tp-card tp-trash-card'); card.setAttribute('data-trash-id', task.id);
      card.createEl('h4', { text: task.title }); const meta = card.createDiv('tp-meta'); priorityBadge(meta, task.priority); statusBadge(meta, task.status); meta.createSpan({ text: projectName(this.plugin.data, task.projectId), cls: 'tp-badge' });
      card.createDiv({ text: "Deleted " + timeText(task.deletedAt), cls: 'tp-muted' });
      if (task.note) card.createDiv({ text: task.note, cls: 'tp-description' });
      const actions = card.createDiv('tp-inline-actions'); button(actions, "Restore", () => this.plugin.restoreTask(task.id));
      button(actions, "Delete permanently", () => new DeleteTaskForeverModal(this.app, this.plugin, task.id).open(), 'mod-warning');
    }
    if (!tasks.length) grid.createDiv({ text: "Trash is empty.", cls: 'tp-empty' });
  }
  renderProjects(parent) {
    if (this.selectedProject !== 'all' && this.selectedProject !== 'none' && !this.plugin.data.projects.some(p => p.id === this.selectedProject)) this.selectedProject = 'none';
    const head = parent.createDiv('tp-page-heading'), title = head.createDiv(); title.createEl('h3', { text: "Project view" }); title.createDiv({ text: "Select a project or view tasks without a project.", cls: 'tp-muted' });
    const actions = head.createDiv('tp-inline-actions'); button(actions, "+ Project", () => new ProjectModal(this.app, this.plugin, null, id => { this.selectedProject = id; this.render(); }).open(), 'mod-cta');
    const select = parent.createEl('select', { cls: 'tp-project-picker', attr: { 'aria-label': "Select project to display" } });
    [['all', "All projects"], ['none', "No project"], ...this.plugin.data.projects.map(p => [p.id, p.name])].forEach(([value, text]) => select.createEl('option', { text, value })); select.value = this.selectedProject; select.onchange = () => { this.selectedProject = select.value; this.render(); };
    const project = this.plugin.data.projects.find(p => p.id === this.selectedProject);
    if (project) {
      if (project.note) parent.createDiv({ text: project.note, cls: 'tp-description' });
      button(actions, "Edit project", () => new ProjectModal(this.app, this.plugin, project.id).open());
      button(actions, "Remove project", () => new DeleteProjectModal(this.app, this.plugin, project.id, () => { this.selectedProject = 'none'; this.render(); }).open());
    }
    const scopeTasks = this.plugin.data.tasks.filter(t => !t.deletedAt && (this.selectedProject === 'all' || (this.selectedProject === 'none' ? !t.projectId : t.projectId === this.selectedProject)));
    const summary = parent.createDiv('tp-brief-stats'); summary.createSpan({ text: scopeTasks.filter(t => t.status !== 'Done').length + ' open' }); summary.createSpan({ text: scopeTasks.filter(t => t.status === 'Done').length + " completed (including archive)" });
    const total = scopeTasks.length, done = scopeTasks.filter(t => t.status === 'Done').length; progress(parent, done / Math.max(1, total) * 100, "Project progress");
    const nav = parent.createDiv('tp-task-segments'); for (const [key, label] of [['status', 'Status'], ['priority', "Priorities"]]) button(nav, label, () => { this.projectBoard = key; this.render(); }, 'tp-task-segment' + (this.projectBoard === key ? ' is-active' : ''));
    const filters = parent.createDiv(), target = parent.createDiv();
    const draw = () => {
      target.empty(); this.draftInputs = new Map(); this.draftControls = new Map(); this.renderTaskBoard(target, this.projectBoard === 'status' ? "Project tasks by status" : "Project tasks by priority", project?.name || (this.selectedProject === 'none' ? "No project" : "All projects"), this.projectBoard, this.projectBoard === 'status' ? COLS : PRIORITIES, this.selectedProject);
      const recurring = this.visibleTasks(this.selectedProject, false, 'recurring');
      if (recurring.length) {
        const section = target.createDiv('tp-project-recurring');section.createEl('h3',{text:'Recurring tasks · '+recurring.length});section.createDiv({text:'Project routines are separate from regular project tasks.',cls:'tp-muted'});
        const list=section.createDiv('tp-list-grid');recurring.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')).forEach(task=>this.renderCard(list,task,false));
      }
      const archived = this.visibleTasks(this.selectedProject, true);
      if (archived.length) { const details = target.createEl('details', { cls: 'tp-project-archive' }); details.createEl('summary', { text: archived.length + " archived tasks in this project" }); const list = details.createDiv('tp-list-grid'); archived.sort((a, b) => b.archivedAt - a.archivedAt).forEach(t => this.renderCard(list, t, true)); }
    };
    this.renderFilters(filters, draw, { hideProject: true }); draw();
  }
  renderTemplates(parent) {
    const head = parent.createDiv('tp-template-heading');
    const heading = head.createDiv(); heading.createEl('h3', { text: "Task templates" });
    heading.createDiv({ text: "Prepare recurring workflows. Each new task remains fully editable.", cls: 'tp-muted' });
    const grid = parent.createDiv('tp-template-grid');
    const templates = [...this.plugin.data.templates].sort((a, b) => a.name.localeCompare(b.name));
    if (!templates.length) grid.createDiv({ text: "No templates yet. Use + Template next to + Task to create one.", cls: 'tp-empty' });
    for (const template of templates) {
      const card = grid.createDiv('tp-template-card'); card.setAttribute('data-template-id', template.id);
      card.createEl('h4', { text: template.name });
      const meta = card.createDiv('tp-meta'); priorityBadge(meta, template.priority); statusBadge(meta, template.status);
      if (template.dueInDays != null) meta.createSpan({ text: template.dueInDays === 0 ? "Due on creation day" : "Due after " + template.dueInDays + " days", cls: 'tp-badge' });
      if (template.title) card.createDiv({ text: template.title, cls: 'tp-template-title' });
      if (template.note) card.createDiv({ text: template.note, cls: 'tp-description' });
      if (template.subtasks.length) {
        card.createDiv({ text: template.subtasks.length + " subtasks", cls: 'tp-section-title' });
        const list = card.createEl('ul', { cls: 'tp-template-subtasks' }); template.subtasks.forEach(s => list.createEl('li', { text: s.title }));
      }
      const actions = card.createDiv('tp-template-actions');
      button(actions, "Edit", () => new TemplateModal(this.app, this.plugin, template.id).open());
      button(actions, "Rename", () => new TemplateModal(this.app, this.plugin, template.id).open());
      button(actions, "Delete", () => new DeleteTemplateModal(this.app, this.plugin, template.id).open());
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
      if (field === 'status' && col.key === 'done') lane.createDiv({ text: "Automatically archived after 24 hours", cls: 'tp-lane-hint' });
      lane.ondragover = e => { if (e.dataTransfer?.types.includes('application/x-tagesplaner')) { e.preventDefault(); lane.addClass('tp-over'); } };
      lane.ondragleave = e => { if (!lane.contains(e.relatedTarget)) lane.removeClass('tp-over'); };
      lane.ondrop = e => {
        e.preventDefault(); lane.removeClass('tp-over'); const id = e.dataTransfer?.getData('application/x-tagesplaner');
        if (id) void (field === 'priority' ? this.plugin.changePriority(id, col.name) : this.plugin.changeStatus(id, col.name));
      };
      if (!tasks.length) lane.createDiv({ text: "No tasks here yet.", cls: 'tp-empty-lane' });
      tasks.sort((a, b) => {
        if (field === 'status') {
          const priorityDifference = (PRIORITIES.find(p => p.name === b.priority)?.rank ?? 2) - (PRIORITIES.find(p => p.name === a.priority)?.rank ?? 2);
          if (priorityDifference) return priorityDifference;
        }
        return (a.due || '9999').localeCompare(b.due || '9999') || (a.dueTime || '').localeCompare(b.dueTime || '');
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
      const task = data.tasks.find(t => t.id === id); if (!task || task.deletedAt || task.archivedAt) throw new Error("This task is no longer available for editing.");
      change(task); task.updatedAt = Date.now();
    });
  }
  renderCard(parent, task, archived) {
    const expanded = this.expanded.has(task.id), card = parent.createDiv('tp-card tp-card-compact' + (expanded ? ' is-expanded' : ' is-collapsed'));
    card.setAttribute('data-task-id', task.id);
    const title = card.createDiv('tp-card-head'); title.createEl('h4', { text: task.title, cls: 'tp-title' });
    if (!archived) {
      title.draggable = true; title.title = 'Drag the title to change status or priority';
      title.ondragstart = e => { e.dataTransfer.setData('application/x-tagesplaner', task.id); e.dataTransfer.effectAllowed = 'move'; };
    }
    const meta = card.createDiv('tp-meta'); priorityBadge(meta, task.priority); statusBadge(meta, task.status);
    meta.createSpan({ text: projectName(this.plugin.data, task.projectId), cls: 'tp-badge tp-project-badge' });
    if (task.due && !task.weeklyRecurrence) meta.createSpan({ text: shortDate(task.due) + (task.dueTime ? " · " + task.dueTime : ''), cls: 'tp-badge' + (!archived && task.status !== 'Done' && taskOverdue(task) ? ' tp-overdue' : '') });
    const series = this.plugin.data.recurrences.find(s => s.id === task.recurrenceId);
    if (series) meta.createSpan({ text: series.enabled ? (series.mode==='continuous-weekly'?'↻ '+WEEKDAYS[series.weekday]:'↻ Recurring') : '↻ Paused', cls: 'tp-badge' });
    const description = card.createDiv('tp-description-section'); description.createDiv({ text: task.note || 'No description yet.', cls: 'tp-description' });
    const sub = card.createDiv('tp-compact-subtasks');
    if (task.subtasks.length) {
      sub.createDiv({ text: 'Subtasks · ' + task.subtasks.filter(s => s.done).length + '/' + task.subtasks.length, cls: 'tp-section-title' });
      for (const item of task.subtasks) {
        const row = sub.createDiv('tp-subtask'), label = row.createEl('label'), check = label.createEl('input', { type: 'checkbox', attr: { 'aria-label': 'Complete subtask: ' + item.title } });
        check.checked = item.done; check.disabled = archived;
        label.createSpan({ text: item.title, cls: item.done ? 'tp-sub-done' : '' });
        check.onchange = async () => {
          check.disabled = true;
          await this.editTask(task.id, current => { const child = current.subtasks.find(s => s.id === item.id); if (!child) throw new Error('Subtask no longer exists.'); child.done = check.checked; });
        };
        if (item.due) row.createSpan({ text: shortDate(item.due), cls: 'tp-badge' + (!archived && !item.done && item.due < dayKey() ? ' tp-overdue' : '') });
        if (!archived) {
          const remove = button(row,'🗑',()=>this.saveDraft(task.id,'remove-subtask-'+item.id,current=>{
            const index=current.subtasks.findIndex(child=>child.id===item.id);if(index<0)throw new Error('Subtask no longer exists.');current.subtasks.splice(index,1);
          }),'tp-icon-button tp-delete-subtask');
          remove.setAttribute('aria-label','Delete subtask: '+item.title);remove.title='Delete subtask';this.registerDraftControl(task.id+':remove-subtask-'+item.id,remove);
        }
      }
    } else sub.createDiv({ text: 'No subtasks.', cls: 'tp-muted' });
    if (!archived) {
      const key=task.id+':subtask',form=sub.createEl('form',{cls:'tp-card-subtask-form'});
      const input=form.createEl('input',{type:'text',attr:{placeholder:'New subtask…','aria-label':'New subtask for '+task.title}});this.bindDraft(input,key);
      const add=form.createEl('button',{text:'+',type:'submit',cls:'tp-add-subtask'});add.setAttribute('aria-label','Add subtask to '+task.title);add.title='Add subtask';this.registerDraftControl(key,add);
      form.onsubmit=async e=>{
        e.preventDefault();const title=input.value.trim();if(!title||this.pendingDrafts.has(key))return false;
        this.drafts.set(key,input.value);
        const ok=await this.saveDraft(task.id,'subtask',current=>current.subtasks.push({id:uid(),title,done:false,due:''}));
        if(ok)for(const control of this.draftInputs.get(key)||[]){control.focus();break;}return ok;
      };
    }
    if (expanded) {
      const details = card.createDiv('tp-card-details'); details.setAttribute('id', 'tp-details-' + task.id);
      if (task.status === 'Waiting') details.createDiv({ text: 'Waiting for: ' + (task.waitingFor || 'Pending response') + (task.followUpDate ? ' · Follow up ' + shortDate(task.followUpDate) : ''), cls: 'tp-muted' });
      if (task.createdAt) details.createDiv({ text: 'Created ' + timeText(task.createdAt), cls: 'tp-muted' });
      if (task.completedAt) details.createDiv({ text: task.completionDateEstimated ? 'Completed before the update' : 'Completed ' + timeText(task.completedAt), cls: 'tp-muted' });
      if (archived) { details.createDiv({ text: 'Archived ' + timeText(task.archivedAt), cls: 'tp-muted' }); details.createDiv({text:'Permanently deleted after '+timeText(archiveDeleteAt(task.archivedAt)),cls:'tp-muted'}); }
      details.createDiv({ text: 'Activity history', cls: 'tp-section-title' });
      if (!task.worklog.length) details.createDiv({ text: 'No activity recorded yet.', cls: 'tp-muted' });
      for (const entry of [...task.worklog].reverse()) { const row = details.createDiv('tp-log-entry'); row.createDiv({ text: entry.text, cls: 'tp-log-text' }); row.createEl('time', { text: timeText(entry.at), cls: 'tp-muted' }); }
    }
    const actions = card.createDiv('tp-card-actions');
    const more = button(actions, expanded ? 'Show Less' : 'Show More', () => { if (this.expanded.has(task.id)) this.expanded.delete(task.id); else this.expanded.add(task.id); this.render(); }, 'tp-small-button tp-show-more');
    more.setAttribute('aria-expanded', String(expanded));
    if (archived) button(actions, 'Reopen', () => this.plugin.changeStatus(task.id, 'ToDo'), 'tp-small-button');
    else button(actions, 'Edit', () => new TaskModal(this.app, this.plugin, task.id).open(), 'tp-small-button');
    button(actions, 'Delete', () => this.plugin.trashTask(task.id), 'tp-small-button tp-delete-task');
  }
  renderArchive(parent) {
    const tools = parent.createDiv('tp-archive-tools'); tools.createEl('h3', { text: "Your archive" });
    tools.createDiv({ text: "Archived tasks are permanently deleted two calendar months after archiving, including their subtasks and activity. Cleanup runs while the plugin is open, or on the next start.", cls: 'tp-muted' });
    const input = tools.createEl('input', { type: 'search', attr: { placeholder: "Search archive …", 'aria-label': "Search archive" } }); input.value = this.archiveSearch;
    const grid = parent.createDiv('tp-archive-grid');
    const draw = () => {
      grid.empty(); const q = this.archiveSearch.toLocaleLowerCase();
      const tasks = this.plugin.data.tasks.filter(t => !t.deletedAt && !projectOnlyTask(this.plugin.data, t) && t.archivedAt && [t.title, t.note, ...t.worklog.map(e => e.text), ...t.subtasks.map(s => s.title)].join(' ').toLocaleLowerCase().includes(q));
      tasks.sort((a, b) => b.archivedAt - a.archivedAt).forEach(t => this.renderCard(grid, t, true));
      if (!tasks.length) grid.createDiv({ text: q ? "No matching tasks found." : "No archived tasks yet. Completed tasks appear here after 24 hours.", cls: 'tp-empty' });
    };
    input.oninput = () => { this.archiveSearch = input.value; draw(); }; draw();
  }
  renderDashboard(parent) {
    const data = { ...this.plugin.data, tasks: this.plugin.data.tasks.filter(t => !t.deletedAt && this.plugin.data.projects.find(p => p.id === t.projectId)?.includeInDashboard !== false) };
    const m = metrics(data), intro = parent.createDiv('tp-dashboard-intro'); intro.createEl('h3', { text: "Your week at a glance" });
    intro.createDiv({ text: new Date().toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'long' }), cls: 'tp-muted' });
    const kpis = parent.createDiv('tp-kpis');
    const metric = (label, value, hint, tone = '', symbol = COLS[0]) => {
      const tile = kpis.createDiv('tp-kpi ' + tone), header = tile.createDiv('tp-kpi-header'); addSymbol(header, symbol); header.createDiv({ text: label, cls: 'tp-muted' }); tile.createDiv({ text: String(value), cls: 'tp-kpi-value' }); tile.createDiv({ text: hint, cls: 'tp-kpi-hint' });
    };
    metric("Open tasks", m.active.length, "All unfinished tasks"); metric('In Progress', m.inProgress.length, "Currently in focus", 'tp-progress', COLS[1]);
    metric("Due today", m.dueToday.length, "Still to complete", '', COLS[2]); metric("Overdue", m.overdue.length, "Past the due date or time", m.overdue.length ? 'tp-risk' : '', PRIORITIES[3]);
    metric("Completed · 7 days", m.done7, "Today and the previous 6 days", 'tp-done', COLS.find(c => c.name === 'Done')); metric("Completed · 30 days", m.done30, "Including archived tasks", 'tp-done', COLS.find(c => c.name === 'Done'));
    metric('Waiting', m.waiting.length, "May need attention", 'tp-waiting', COLS[2]); metric("Subtasks", m.subtasksDone + '/' + m.subtasks, "Completed / total, including archive", '', COLS.find(c => c.name === 'Done'));
    const grid = parent.createDiv('tp-dashboard-grid');
    const panel = title => { const box = grid.createDiv('tp-panel'); box.createEl('h4', { text: title }); return box; };
    const priorities = panel("Open tasks by priority");
    for (const p of PRIORITIES) {
      const count = m.active.filter(t => t.priority === p.name).length, row = priorities.createDiv('tp-distribution tp-priority-' + p.key);
      symbolLabel(row, p); row.createSpan({ text: String(count), cls: 'tp-count' }); progress(row, count / Math.max(1, m.active.length) * 100, "Priority " + p.name);
    }
    const activity = panel("Completed tasks · Last 7 days"), chart = activity.createDiv('tp-chart'), max = Math.max(1, ...m.week.map(d => d.count));
    for (const day of m.week) {
      const col = chart.createDiv('tp-chart-column'); col.createSpan({ text: String(day.count), cls: 'tp-chart-count' });
      col.createDiv('tp-chart-track').createDiv('tp-chart-bar').style.height = day.count / max * 100 + '%';
      col.createSpan({ text: shortDate(day.key), cls: 'tp-muted' }); col.setAttribute('aria-label', day.key + ': ' + day.count + ' completed');
    }
    activity.createDiv({ text: "Archived tasks are included. Reopened tasks count when completed again. Older tasks without a completion date are excluded from this chart.", cls: 'tp-help' });
    const distribution = panel("Status distribution");
    for (const col of COLS) {
      const count = data.tasks.filter(t => !t.archivedAt && t.status === col.name).length, row = distribution.createDiv('tp-distribution tp-' + col.key);
      symbolLabel(row, col); row.createSpan({ text: String(count), cls: 'tp-count' }); progress(row, count / Math.max(1, data.tasks.filter(t => !t.archivedAt).length) * 100, col.name);
    }
    const due = panel("Coming up · Due dates"), upcoming = m.active.filter(t => t.due && t.due <= dayKey(shiftDay(Date.now(), 7))).sort((a, b) => a.due.localeCompare(b.due) || (a.dueTime || '').localeCompare(b.dueTime || ''));
    for (const t of upcoming.slice(0, 6)) {
      const row = due.createDiv('tp-summary-row'); button(row, t.title, () => new TaskModal(this.app, this.plugin, t.id).open(), 'tp-text-button'); row.createSpan({ text: shortDate(t.due) + (t.dueTime ? ' · ' + t.dueTime : ''), cls: taskOverdue(t) ? 'tp-overdue tp-badge' : 'tp-badge' });
    }
    if (!upcoming.length) due.createDiv({ text: "No open due dates in the next 7 days.", cls: 'tp-muted' });
    if (upcoming.length > 6) due.createDiv({ text: '+ ' + (upcoming.length - 6) + " more tasks on the board", cls: 'tp-help' });
    const recent = panel("Recently completed"), completed = [...m.done].sort((a, b) => b.completedAt - a.completedAt).slice(0, 5);
    for (const t of completed) {
      const row = recent.createDiv('tp-summary-row'); row.createSpan({ text: t.title }); row.createSpan({ text: (t.archivedAt ? "Archive · " : '') + (t.completionDateEstimated ? "Completed before the update" : timeText(t.completedAt)), cls: 'tp-muted' });
    }
    if (!completed.length) recent.createDiv({ text: "Your completed tasks will appear here.", cls: 'tp-muted' });
    const logs = panel("Recent activity"), entries = data.tasks.flatMap(t => t.worklog.map(e => ({ ...e, title: t.title }))).sort((a, b) => b.at - a.at).slice(0, 4);
    for (const e of entries) {
      const row = logs.createDiv('tp-log-entry'); row.createDiv({ text: e.title, cls: 'tp-section-title' }); row.createDiv({ text: e.text, cls: 'tp-log-text' }); row.createDiv({ text: timeText(e.at), cls: 'tp-muted' });
    }
    if (!entries.length) logs.createDiv({ text: "Record activity in a task's edit dialog.", cls: 'tp-muted' });
  }
}

module.exports = class TagesplanerPlugin extends Plugin {
  async onload() {
    this.queue = Promise.resolve(); this.data = normalize(await this.loadData()); await this.saveData(copy(this.data));
    this.registerView(VIEW, leaf => new PlannerView(leaf, this));
    this.addRibbonIcon('layout-dashboard', "Open Daily Planner", () => this.activate());
    this.addCommand({ id: 'open', name: "Open Daily Planner", callback: () => this.activate() });
    this.addCommand({ id: 'dashboard', name: "Open dashboard", callback: () => this.activate('dashboard') });
    this.addCommand({ id: 'calendar', name: "Open week and calendar view", callback: () => this.activate('calendar') });
    this.addCommand({ id: 'trash', name: "Open Trash", callback: () => this.activate('trash') });
    this.addCommand({ id: 'projects', name: "Open project view", callback: () => this.activate('projects') });
    this.addCommand({ id: 'reminders', name: "Check reminders now", callback: () => this.checkReminders(Date.now(), true) });
    await this.runMaintenance(); await this.checkReminders(); this.lastDay = dayKey();
    this.registerInterval(window.setInterval(() => {
      void this.tick();
    }, 60000));
  }
  refreshViews() { this.app.workspace.getLeavesOfType(VIEW).forEach(leaf => leaf.view.render()); }
  mutate(change) {
    const operation = this.queue.then(async () => {
      const before = copy(this.data);
      try { change(this.data); syncWeeklyData(this.data); await this.saveData(copy(this.data)); }
      catch (error) { this.data = before; console.error("Daily Planner: Save failed", error); new Notice("Change not saved. Please try again."); this.refreshViews(); return false; }
      this.refreshViews(); return true;
    });
    this.queue = operation.catch(error => { console.error("Daily Planner: Could not update view", error); }); return operation;
  }
  async archiveExpired(now = Date.now()) {
    // Check inside the write queue to serialize archival with status changes.
    const operation = this.queue.then(async () => {
      const before = copy(this.data), archived = archiveDue(this.data, now), purged = purgeExpiredArchive(this.data, now); if (!archived && !purged) return false;
      try { await this.saveData(copy(this.data)); }
      catch (error) { this.data = before; console.error("Daily Planner: Archiving failed", error); new Notice("Could not save the archive update."); return false; }
      this.refreshViews(); return true;
    });
    this.queue = operation.catch(error => console.error(error)); return operation;
  }
  async runMaintenance(now = Date.now()) {
    const operation = this.queue.then(async () => {
      const before = copy(this.data), archived = archiveDue(this.data, now), purged = purgeExpiredArchive(this.data, now), generated = generateRecurring(this.data, now);
      if (!generated.changed && !archived && !purged) return false;
      try { await this.saveData(copy(this.data)); }
      catch (error) { this.data = before; console.error("Daily Planner: Automatic update failed", error); new Notice("Could not save automatic task updates. The plugin will retry automatically."); return false; }
      this.refreshViews(); return true;
    });
    this.queue = operation.catch(error => console.error(error)); return operation;
  }
  async checkReminders(now = Date.now(), force = false) {
    const operation = this.queue.then(async () => {
      if (!this.data.reminderSettings.enabled) { if (force) new Notice("Due date reminders are disabled."); return false; }
      const today = dayKey(now), lastDate = shiftDate(today, this.data.reminderSettings.leadDays);
      const seen = new Set(this.data.reminderState.day === today ? this.data.reminderState.seen : []);
      const eligible = attentionEntries(this.data,today,lastDate).filter(e => e.date <= lastDate && (!e.time || this.data.reminderSettings.leadDays > 0 || entryOverdue(e, now)) && this.data.projects.find(p => p.id === e.task.projectId)?.remindersEnabled !== false);
      const fresh = force ? eligible : eligible.filter(e => !seen.has(reminderKey(e, now)));
      if (!fresh.length) { if (force) new Notice("No upcoming or overdue items."); return false; }
      const before = copy(this.data.reminderState); fresh.forEach(e => seen.add(reminderKey(e, now)));
      this.data.reminderState = { day: today, seen: [...seen] };
      try { await this.saveData(copy(this.data)); }
      catch (error) { this.data.reminderState = before; console.error("Daily Planner: Could not save reminder state", error); return false; }
      const overdue = fresh.filter(e => entryOverdue(e, now)).length, dueToday = fresh.filter(e => e.date === today && !entryOverdue(e, now)).length, upcoming = fresh.length - overdue - dueToday;
      new Notice("Daily Planner: " + overdue + " overdue · " + dueToday + " due today · " + upcoming + " upcoming. View dates in Calendar and overdue items below it. Hidden projects remain in Projects.", 10000);
      return true;
    });
    this.queue = operation.catch(error => console.error(error)); return operation;
  }
  async tick(now = Date.now()) {
    await this.runMaintenance(now); await this.checkReminders(now);
    const minute = Math.floor(now / 60000), today = dayKey(now);
    if (this.lastDay !== today || (this.lastMinute !== minute && this.app.workspace.getLeavesOfType(VIEW).some(leaf=>leaf.view.tab==='home')) || (this.lastMinute !== minute && this.data.tasks.some(t => !t.deletedAt && !t.archivedAt && t.status !== 'Done' && t.due === today && t.dueTime))) this.refreshViews();
    this.lastDay = today; this.lastMinute = minute;
  }
  trashTask(id) {
    return this.mutate(data => { const task = data.tasks.find(t => t.id === id); if (!task || task.deletedAt) throw new Error("Task not found."); const s=continuousSeries(data,task);if(s){task.weeklyWasEnabled=!!s.enabled;s.enabled=false;}task.deletedAt = Date.now(); task.updatedAt = task.deletedAt; });
  }
  restoreTask(id) {
    return this.mutate(data => { const task = data.tasks.find(t => t.id === id && t.deletedAt); if (!task) throw new Error("Task is not in Trash."); task.deletedAt = null; task.updatedAt = Date.now();const s=continuousSeries(data,task);if(s&&task.weeklyWasEnabled)s.enabled=true;delete task.weeklyWasEnabled; });
  }
  deleteTaskForever(id) {
    return this.mutate(data => { const task = data.tasks.find(t => t.id === id && t.deletedAt); if (!task) throw new Error("Task is not in Trash."); if (task.recurrenceId && task.occurrenceDate) { const key = task.recurrenceId + ':' + task.occurrenceDate; if (!data.deletedOccurrences.includes(key)) data.deletedOccurrences.push(key); } data.tasks = data.tasks.filter(t => t.id !== id);data.recurrences=data.recurrences.filter(s=>!(s.mode==='continuous-weekly'&&s.taskId===id)); });
  }
  reschedule(id, kind, subtaskId, date) {
    return this.mutate(data => {
      if (!validDate(date)) throw new Error("Invalid date.");
      const task = data.tasks.find(t => t.id === id); if (!task || task.deletedAt || task.archivedAt || task.status === 'Done') throw new Error("Task is no longer open.");
      if (kind === 'task') { const range=taskRange(task),delta=range?daysBetween(range.startDate,date):0; task.startDate=range?shiftDate(range.startDate,delta):'';task.due=range?shiftDate(range.endDate,delta):date;syncChangedWeeklyRange(data,task,range); }
      else if (kind === 'followup' && task.status === 'Waiting') task.followUpDate = date;
      else if (kind === 'subtask') { const sub = task.subtasks.find(s => s.id === subtaskId && !s.done); if (!sub) throw new Error("Subtask is no longer open."); sub.due = date; }
      else throw new Error("Unknown date type.");
      task.updatedAt = Date.now();
    });
  }
  clearCalendarDate(id,kind='task',subtaskId=null) {
    return this.mutate(data=>{
      const task=data.tasks.find(t=>t.id===id);if(!task||task.deletedAt||task.archivedAt||task.status==='Done')throw new Error('This event is no longer editable.');
      if(kind==='task') {Object.assign(task,{startDate:'',startTime:'',due:'',dueTime:''});const s=continuousSeries(data,task);if(s)s.enabled=false;}
      else if(kind==='subtask'){const sub=task.subtasks.find(s=>s.id===subtaskId&&!s.done);if(!sub)throw new Error('Subtask is no longer open.');sub.due='';}
      else if(kind==='followup'&&task.status==='Waiting')task.followUpDate='';
      else throw new Error('Unknown date type.');
      task.updatedAt=Date.now();
    });
  }
  resizeTask(id, edge, delta, expected = null) {
    return this.mutate(data=>{const task=data.tasks.find(t=>t.id===id);if(!task||task.deletedAt||task.archivedAt||task.status==='Done')throw new Error('This event is no longer editable.');if(expected&&scheduleKey(task)!==expected)throw new Error('This schedule has changed. Please try again.');const previous=taskRange(task);Object.assign(task,resizeRange(task,edge,delta),{updatedAt:Date.now()});syncChangedWeeklyRange(data,task,previous);});
  }
  setScheduleEdgeDate(id, edge, date, expected = null, occurrenceStart = null) {
    return this.mutate(data=>{const task=data.tasks.find(t=>t.id===id);if(!task||task.deletedAt||task.archivedAt||task.status==='Done'||!validDate(date)||!['start','end'].includes(edge))throw new Error('This event cannot be resized.');if(expected&&scheduleKey(task)!==expected)throw new Error('This schedule has changed.');const range=taskRange(task);if(!range)throw new Error('An end date is required.');if(task.weeklyRecurrence&&validDate(occurrenceStart))date=shiftDate(date,-daysBetween(range.startDate,occurrenceStart));const next={...task,startDate:range.startDate,...(edge==='start'?{startDate:date}:{due:date})};Object.assign(task,resolveSchedule(next),edge==='start'?{startDate:date}:{due:date},{updatedAt:Date.now()});syncChangedWeeklyRange(data,task,range);});
  }
  moveTimedTask(id,date,minute) {
    return this.mutate(data=>{const task=data.tasks.find(t=>t.id===id);if(!task||task.deletedAt||task.archivedAt||task.status==='Done'||!validDate(date)||!Number.isInteger(minute)||minute<0||minute>1425)throw new Error('This event cannot be moved.');const range=taskRange(task),start=wallValue(date)+minute,end=start+(range?.timed?range.end-range.start:60),a=wallParts(start),b=wallParts(end);Object.assign(task,{startDate:a.date,startTime:a.time,due:b.date,dueTime:b.time,updatedAt:Date.now()});syncChangedWeeklyRange(data,task,range);});
  }
  changeStatus(id, status) { if(status==='Done'&&this.data.tasks.find(t=>t.id===id)?.weeklyRecurrence?.enabled){new Notice('Weekly tasks stay open. Pause the recurrence before completing this task.');return Promise.resolve(false);}return this.mutate(data => { const task = data.tasks.find(t => t.id === id); if (!task || task.deletedAt) throw new Error("Task not found."); setStatus(task, status); }); }
  changePriority(id, priority) {
    return this.mutate(data => {
      if (!PRIORITIES.some(p => p.name === priority)) throw new Error("Unknown priority.");
      const task = data.tasks.find(t => t.id === id);
      if (!task || task.deletedAt || task.archivedAt) throw new Error("This task can no longer be edited.");
      task.priority = priority; task.updatedAt = Date.now();
    });
  }
  async createTaskFromTemplate(id, defaultProjectId = null) {
    let taskId = null;
    const ok = await this.mutate(data => {
      const template = data.templates.find(t => t.id === id); if (!template) throw new Error("Template not found.");
      const values = templateFields(template), now = Date.now();
      const endDate = values.dueInDays == null ? (values.repeat.frequency !== 'none' || values.dueTime ? dayKey(now) : '') : dayKey(shiftDay(now,values.dueInDays));
      const scheduleValues = resolveSchedule({due:endDate,dueTime:values.dueTime,startDate:values.startInDays==null?'':shiftDate(dayKey(now),values.startInDays),startTime:values.startTime});
      taskId = uid(); data.tasks.push({ ...scheduleValues,
        id: taskId, title: values.title.trim() || template.name, note: values.note, priority: values.priority,
        status: values.status, projectId: data.projects.some(p => p.id === values.projectId) ? values.projectId : (data.projects.some(p => p.id === defaultProjectId) ? defaultProjectId : null),
        waitingFor: values.waitingFor, followUpDate: values.followUpInDays == null ? '' : shiftDate(dayKey(now), values.followUpInDays),
        dueTime: values.dueTime, due: endDate,
        subtasks: values.subtasks.map(s => ({ id: uid(), title: s.title, done: false, due: s.dueInDays == null ? '' : shiftDate(dayKey(now), s.dueInDays) })), worklog: [],
        recurrenceId: null, occurrenceDate: '',
        createdAt: now, updatedAt: now, completedAt: null, archivedAt: null, completionDateEstimated: false
      });
      configureRecurrence(data, data.tasks[data.tasks.length - 1], values.repeat, now);
    });
    return ok ? taskId : false;
  }
  async activate(tab = 'home') {
    let leaf = this.app.workspace.getLeavesOfType(VIEW)[0];
    if (!leaf) { leaf = this.app.workspace.getLeaf(true); await leaf.setViewState({ type: VIEW, active: true }); }
    leaf.view.tab = tab; leaf.view.render(); await this.app.workspace.revealLeaf(leaf);
  }
  onunload() { this.app.workspace.detachLeavesOfType(VIEW); }
};
