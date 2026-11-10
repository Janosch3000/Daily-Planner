const {Plugin, ItemView, Notice, Modal}=require('obsidian');
const VIEW='tagesplaner-view'; const COLS=['In Bearbeitung','Offen','Warten auf Person','Delayed','Fertig'];

class TaskModal extends Modal {
  constructor(app, plugin, onSaved) {
    super(app);
    this.plugin = plugin;
    this.onSaved = onSaved;
    this.saving = false;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Neue Aufgabe' });
    const form = contentEl.createEl('form');
    const titleLabel = form.createEl('label', { text: 'Aufgabe' });
    this.titleInput = titleLabel.createEl('input', { type: 'text' });
    this.titleInput.placeholder = 'Was ist zu erledigen?';
    this.titleInput.required = true;
    this.titleInput.style.width = '100%';
    const dueLabel = form.createEl('label', { text: 'Fällig am (optional)' });
    dueLabel.style.display = 'block';
    dueLabel.style.marginTop = '12px';
    this.dueInput = dueLabel.createEl('input', { type: 'date' });
    this.dueInput.style.display = 'block';
    const noteLabel = form.createEl('label', { text: 'Notiz (optional)' });
    noteLabel.style.display = 'block';
    noteLabel.style.marginTop = '12px';
    this.noteInput = noteLabel.createEl('textarea');
    this.noteInput.style.width = '100%';
    const actions = form.createDiv();
    actions.style.marginTop = '16px';
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    this.saveButton = actions.createEl('button', { text: 'Aufgabe erstellen', cls: 'mod-cta', type: 'submit' });
    const cancel = actions.createEl('button', { text: 'Abbrechen', type: 'button' });
    cancel.onclick = () => this.close();
    form.onsubmit = event => { event.preventDefault(); void this.submit(); };
    this.titleInput.focus();
  }
  async submit() {
    if (this.saving) return;
    const title = this.titleInput.value.trim();
    if (!title) {
      new Notice('Bitte gib einen Aufgabentitel ein.');
      this.titleInput.focus();
      return;
    }
    if (!this.dueInput.checkValidity()) {
      this.dueInput.reportValidity();
      return;
    }
    this.saving = true;
    this.saveButton.disabled = true;
    const task = {
      id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 10),
      title,
      status: 'Offen',
      due: this.dueInput.value,
      note: this.noteInput.value.trim()
    };
    this.plugin.tasks.push(task);
    try {
      await this.plugin.persist();
    } catch (error) {
      this.plugin.tasks = this.plugin.tasks.filter(item => item.id !== task.id);
      this.saving = false;
      this.saveButton.disabled = false;
      console.error('Tagesplaner: Aufgabe konnte nicht gespeichert werden', error);
      new Notice('Aufgabe konnte nicht gespeichert werden. Bitte erneut versuchen.');
      return;
    }
    this.close();
    await this.onSaved();
  }
  onClose() { this.contentEl.empty(); }
}

class PlannerView extends ItemView { constructor(leaf,plugin){super(leaf);this.plugin=plugin;} getViewType(){return VIEW} getDisplayText(){return 'Tagesplaner'} getIcon(){return 'layout-dashboard'} async onOpen(){this.render()} async render(){const root=this.containerEl.children[1];root.empty();root.addClass('tp-root'); const head=root.createDiv('tp-head'); head.createEl('h2',{text:'Tagesplaner'}); const add=head.createEl('button',{text:'+ Aufgabe',cls:'mod-cta'}); add.onclick=()=>this.addTask(); const board=root.createDiv('tp-board'); for(const col of COLS){const lane=board.createDiv('tp-lane'); lane.dataset.status=col; const bar=lane.createDiv('tp-lane-head');bar.createEl('h3',{text:col});bar.createSpan({text:String(this.plugin.tasks.filter(t=>t.status===col).length),cls:'tp-count'}); lane.ondragover=e=>{e.preventDefault();lane.addClass('tp-over')};lane.ondragleave=()=>lane.removeClass('tp-over');lane.ondrop=e=>{e.preventDefault();lane.removeClass('tp-over');const t=this.plugin.tasks.find(x=>x.id===e.dataTransfer.getData('text/plain'));if(t){t.status=col;this.plugin.persist();this.render()}}; for(const task of this.plugin.tasks.filter(t=>t.status===col)){const card=lane.createDiv('tp-card');card.draggable=true;card.ondragstart=e=>e.dataTransfer.setData('text/plain',task.id);card.createDiv({text:task.title,cls:'tp-title'});if(task.due)card.createDiv({text:'◷ '+task.due,cls:'tp-due'});if(task.note)card.createDiv({text:task.note,cls:'tp-note'});const actions=card.createDiv('tp-actions');const sel=actions.createEl('select');for(const c of COLS)sel.createEl('option',{text:c,value:c});sel.value=task.status;sel.onchange=()=>{task.status=sel.value;this.plugin.persist();this.render()};const del=actions.createEl('button',{text:'×',attr:{'aria-label':'Aufgabe löschen'}});del.onclick=()=>{this.plugin.tasks=this.plugin.tasks.filter(x=>x.id!==task.id);this.plugin.persist();this.render()}}} } addTask(){new TaskModal(this.app,this.plugin,()=>this.render()).open()} }

module.exports=class extends Plugin {async onload(){this.tasks=(await this.loadData())||[];this.registerView(VIEW,leaf=>new PlannerView(leaf,this));this.addRibbonIcon('layout-dashboard','Tagesplaner öffnen',()=>this.activate());this.addCommand({id:'open',name:'Tagesplaner öffnen',callback:()=>this.activate()})}async activate(){const leaf=this.app.workspace.getLeaf(true);await leaf.setViewState({type:VIEW,active:true});this.app.workspace.revealLeaf(leaf)}async persist(){await this.saveData(this.tasks)}async onunload(){this.app.workspace.detachLeavesOfType(VIEW)}};