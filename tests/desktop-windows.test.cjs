'use strict';
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
const FACTORY = new Function("const logs=[];const console={error(...args){logs.push(args.map(a=>a?.stack||String(a)).join(' '));},log(){}};\n\nclass Element {\n constructor(tag='div',doc){this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.attrs={};this.style={setProperty(k,v){this[k]=v;}};this.value='';this.classes=new Set();this.textContent='';this.hidden=false;this.disabled=false;this.checked=false;}\n createEl(tag,opts={}){const e=new Element(tag,this.ownerDocument);if(typeof opts==='string')opts={cls:opts};e.textContent=opts.text||'';if(opts.value!==undefined)e.value=opts.value;if(opts.type)e.type=opts.type;if(opts.cls)e.addClass(...opts.cls.split(' '));for(const [k,v]of Object.entries(opts.attr||{}))e.setAttribute(k,v);this.appendChild(e);return e;}\n createDiv(opts={}){if(typeof opts==='string')opts={cls:opts};return this.createEl('div',opts);}\n createSpan(opts={}){return this.createEl('span',opts);}\n addClass(...names){names.forEach(n=>this.classes.add(n));}\n removeClass(...names){names.forEach(n=>this.classes.delete(n));}\n toggleClass(n,on){on?this.classes.add(n):this.classes.delete(n);}\n hasClass(n){return this.classes.has(n);}\n setAttribute(k,v){this.attrs[k]=String(v);if(k==='value')this.value=String(v);}\n getAttribute(k){return this.attrs[k]??null;}\n appendChild(e){e.parentElement?.children.splice(e.parentElement.children.indexOf(e),1);this.children.push(e);e.parentElement=this;return e;}\n insertBefore(e,b){e.remove();const i=this.children.indexOf(b);this.children.splice(i<0?this.children.length:i,0,e);e.parentElement=this;}\n empty(){this.children=[];this.textContent='';}\n remove(){if(this.parentElement){const p=this.parentElement;p.children.splice(p.children.indexOf(this),1);this.parentElement=null;}}\n contains(e){return this===e||this.children.some(c=>c.contains(e));}\n focus(){this.ownerDocument.activeElement=this;}\n checkValidity(){return true;} reportValidity(){return true;}\n addEventListener(){} removeEventListener(){}\n setText(s){this.textContent=s;}\n querySelectorAll(selector){const match=e=>selector[0]==='.'?e.classes.has(selector.slice(1)):e.tagName===selector.toUpperCase();return this.children.flatMap(e=>[...(match(e)?[e]:[]),...e.querySelectorAll(selector)]);}\n querySelector(s){return this.querySelectorAll(s)[0]||null;}\n}\nfunction makeWindow(){const win={screenX:80,screenY:90,outerWidth:480,outerHeight:700,closed:false,listeners:{},timers:new Map(),nextTimer:0,focus(){this.focused=true;},setTimeout(fn){const id=++this.nextTimer;this.timers.set(id,fn);return id;},clearTimeout(id){this.timers.delete(id);},addEventListener(k,fn){(this.listeners[k]??=new Set()).add(fn);},removeEventListener(k,fn){this.listeners[k]?.delete(fn);}};win.document={defaultView:win,createElementNS(ns,t){return new Element(t,this);}};return win;}\nconst mainWindow=makeWindow(),notices=[];const window={setInterval(){return 1;}};\nclass Plugin {constructor(app){this.app=app;}registerView(t,f){this.app.factories[t]=f;} addCommand(c){(this.commands??=[]).push(c);} addRibbonIcon(){} registerInterval(){} async loadData(){return null;}async saveData(d){this.saved=d;}}\nclass ItemView {constructor(leaf){this.leaf=leaf;this.app=leaf.app;this.contentEl=new Element('div',leaf.win.document);this.containerEl=this.contentEl;}registerEvent(){} async setState(){}}\nclass Modal {constructor(app){this.app=app;this.contentEl=new Element('div',app.activeWindow.document);}open(){this.onOpen?.();}close(){this.onClose?.();}}\nclass Notice {constructor(s){notices.push(s);}}\nlet remote=null;\nconst requireMock=name=>{if(name==='obsidian')return {Plugin,ItemView,Modal,Notice};if(name==='@electron/remote'&&remote)return remote;throw new Error('Module unavailable');};\nconst module={exports:{}};\n\nreturn (function(require,module){\n" + source + "\n\nreturn {logs,PluginClass:module.exports,Element,makeWindow,mainWindow,notices,normaliseSettings,normalize,desktopBounds,popoutWindow,nativeDesktopWindow,setDesktopOnTop,startDesktopView,stopDesktopView,QuickAddView,PinnedTaskView,PlannerView,TaskModal,VIEW,QUICK_VIEW,PIN_VIEW,setRemote:r=>{remote=r;}};\n\n})(requireMock,module);");

(async () => {

const api=FACTORY(),{PluginClass:P,normaliseSettings,normalize,desktopBounds,QuickAddView,PinnedTaskView,mainWindow,makeWindow,VIEW,QUICK_VIEW,PIN_VIEW}=api;
let count=0;const check=(condition,label)=>{if(!condition)throw new Error(label);count++;};
const app={factories:{},activeWindow:mainWindow},leaves=[];
app.workspace={rootSplit:{win:mainWindow},on(){return {};},
getLeavesOfType:type=>leaves.filter(l=>l.view.getViewType()===type&&!l.detached),
async revealLeaf(l){l.revealed=true;},
openPopoutLeaf(options){this.created=(this.created||0)+1;this.lastOptions=options;const win=makeWindow();const leaf={app,win,getContainer(){return {win:this.win};},async setViewState(state){this.view=app.factories[state.type](this);if(state.state)await this.view.setState?.(state.state,{});await this.view.onOpen?.();},detach(){this.detached=true;this.view?.onClose?.();}};leaves.push(leaf);return leaf;},
moveLeafToPopout(leaf){leaf.win=makeWindow();leaf.view.contentEl.ownerDocument=leaf.win.document;}
};
const p=new P(app);p.queue=Promise.resolve();p.desktopOpening=new Map();p.desktopUnloading=false;p.data=normalize({schemaVersion:4,tasks:[{id:'a',title:'Desktop test',status:'ToDo',priority:'high',subtasks:[{id:'s',title:'Child',done:false}],worklog:[]}]});p.saveData=async d=>{p.saved=JSON.parse(JSON.stringify(d));};
app.factories[QUICK_VIEW]=leaf=>new QuickAddView(leaf,p);app.factories[PIN_VIEW]=leaf=>new PinnedTaskView(leaf,p);
check(normaliseSettings({}).pinOnTop===true,'Pinned windows default to top');
check(normaliseSettings({}).quickOnTop===false,'Quick Add top default');
check(normaliseSettings({quickWidth:1,pinHeight:9999}).quickWidth===320,'Width clamped');
check(normaliseSettings({quickWidth:1,pinHeight:9999}).pinHeight===1600,'Height clamped');
check(normaliseSettings({desktopX:-1200}).desktopX===-1200,'Negative monitor coordinate');
check(normaliseSettings({homeOrder:['board']}).homeOrder.includes('quick-add'),'Home tile migration');
check(desktopBounds({x:0,y:1,width:400,height:600}).width===400,'Valid bounds');
check(!desktopBounds({x:NaN,y:1,width:400,height:600}),'Invalid bounds rejected');
check(!desktopBounds({x:0,y:1,width:12,height:600}),'Tiny bounds rejected');
check(!desktopBounds({x:0,y:1,width:400,height:Infinity}),'Infinite bounds rejected');
const opened=await p.openDesktop('pin','a');if(!opened)throw new Error(api.logs.join('\n'));check(opened,'Pin opens');
check(app.workspace.created===1,'One popout created');
const pin=leaves[0].view;
check(pin.taskId==='a','Pinned task state applied');
check(pin.getState().taskId==='a','Pinned state persists');
check(pin.getDisplayText()==='Desktop test','Task title in window tab');
check(pin.contentEl.querySelector('.tp-title').textContent==='Desktop test','Card rendered');
check(pin.contentEl.querySelectorAll('button').some(b=>b.textContent==='Add entry'),'Activity action rendered');
check(!pin.contentEl.querySelectorAll('button').some(b=>b.textContent==='📌 Pin'),'No recursive pin button');
check(await p.openDesktop('pin','a'),'Existing pin focused');
check(app.workspace.created===1,'No duplicate pinned window');
check(await p.openDesktop('quick'),'Quick Add opens');
const quick=leaves[1].view;
check(!!quick.form.titleInput,'Quick task form ready');
check(quick.form.priorityInput.value==='mid','Quick Add uses defaults');
quick.form.titleInput.value='Preserved draft';
p.refreshViews();
check(quick.form.titleInput.value==='Preserved draft','Background refresh preserves draft');
check(quick.form.titleInput.ownerDocument===leaves[1].win.document,'Quick form uses popout document');
const creation=quick.form;creation.titleInput.value='Captured task';
await creation.submit();
check(p.data.tasks.some(t=>t.title==='Captured task'),'Quick Add saves to same data');
check(quick.form!==creation,'Successful save resets form');
check(quick.form.titleInput.value==='','Quick Add ready for next task');
check(p.data.tasks.filter(t=>t.title==='Captured task').length===1,'Task saved once');
const activity=pin.contentEl.querySelector('.tp-card-activity-form');
const input=activity.querySelector('textarea');input.value='Worked from desktop';input.oninput?.();
await activity.onsubmit({preventDefault(){}});
check(p.data.tasks.find(t=>t.id==='a').worklog.some(e=>e.text==='Worked from desktop'),'Pinned activity saves');
await pin.editTask('a',t=>t.subtasks[0].done=true);
check(p.data.tasks[0].subtasks[0].done,'Pinned subtasks update shared task');
check(await p.saveDesktopBounds('pin','a',{x:-100,y:50,width:400,height:600}),'Bounds persisted');
check(p.data.desktopWindows['pin:a'].x===-100,'Per-task position saved');
check(p.desktopOptions('pin','a').x===-100,'Remembered position used');
p.data.settings.rememberDesktopBounds=false;
check(p.desktopOptions('pin','a').x===100,'Remember off uses settings');
check(!(await p.saveDesktopBounds('pin','a',{x:0,y:0,width:400,height:600})),'Remember off skips saving');
p.data.settings.rememberDesktopBounds=true;
const same=await Promise.all([p.openDesktop('pin',p.data.tasks[1].id),p.openDesktop('pin',p.data.tasks[1].id)]);
check(same.every(Boolean),'Concurrent pin requests succeed');
check(app.workspace.created===3,'Concurrent requests deduplicate');
check(!(await p.openDesktop('pin','missing')),'Missing task not pinned');
check(!(await p.openDesktop('invalid')),'Unknown window kind rejected');
p.data.tasks[0].deletedAt=Date.now();p.refreshViews();
check(!!pin.contentEl.querySelector('.tp-empty'),'Deleted pinned task shows unavailable state');
check(!(await p.openDesktop('pin','a')),'Deleted task not pinnable');
let rollback=p.data.tasks.length;
const failed=quick.form;failed.titleInput.value='Save failure';
p.saveData=async()=>{throw new Error('Expected save failure');};
await failed.submit();
check(p.data.tasks.length===rollback,'Failed Quick Add save rolled back');
check(quick.form===failed&&failed.titleInput.value==='Save failure','Failed save keeps draft');
check(failed.saving===false&&!failed.saveButton.disabled,'Retry enabled after failed save');
p.saveData=async()=>{};
const oldOpen=app.workspace.openPopoutLeaf;app.workspace.openPopoutLeaf=null;
check(!(await p.openDesktop('quick')),'Mobile/unavailable popout safely handled');app.workspace.openPopoutLeaf=oldOpen;

const target=leaves[1],other=makeWindow(),changed=[];
function nativeFor(win,label){return {top:false,isDestroyed(){return false;},webContents:{async executeJavaScript(js){return new Function('window','return '+js)(win);}},setAlwaysOnTop(value){this.top=value;changed.push(label);},isAlwaysOnTop(){return this.top;},getBounds(){return {x:4,y:5,width:420,height:680};},on(){},removeListener(){}};}
const nativeMain=nativeFor(mainWindow,'main'),nativeOther=nativeFor(other,'other'),nativeTarget=nativeFor(target.win,'target');
api.setRemote({BrowserWindow:{getAllWindows:()=>[nativeMain,nativeOther,nativeTarget]}});
check(await api.setDesktopOnTop(quick,true,true),'Native top operation succeeds');
check(nativeTarget.top===true,'Target native window set on top');
check(changed.join(',')==='target','Main and unrelated windows untouched');
check(quick.desktopTopButton.getAttribute('aria-pressed')==='true','Top toggle reflects native state');
check(!Object.keys(target.win).some(k=>k.startsWith('__dailyPlannerWindow_')),'Temporary renderer marker removed');
check(await api.setDesktopOnTop(quick,false,true),'Native unpin succeeds');
check(nativeTarget.top===false,'Target top disabled');
const originalWin=target.win,originalDoc=quick.contentEl.ownerDocument;
target.win=mainWindow;quick.contentEl.ownerDocument=mainWindow.document;
check(api.popoutWindow(quick)===null,'Docked main window excluded');
check(!(await api.setDesktopOnTop(quick,true)),'Main window cannot be pinned');
check(nativeMain.top===false,'Main window remains unchanged');
target.win=originalWin;quick.contentEl.ownerDocument=originalDoc;
await api.setDesktopOnTop(quick,true);
api.stopDesktopView(quick);
check(nativeTarget.top===false,'Closing releases native top flag');
check(quick.desktopClosed===true,'Closed lifecycle recorded');
check([...originalWin.listeners.resize||[]].length===0,'Resize listener removed');
check([...originalWin.listeners.blur||[]].length===0,'Blur listener removed');
api.setRemote(null);
quick.desktopClosed=false;quick.desktopNative=null;
check(!(await api.setDesktopOnTop(quick,true,true)),'Missing native bridge handled');
check(api.notices.some(n=>n.includes('Toggle always on top')),'Fallback command explained');
const oldData=JSON.parse(JSON.stringify(p.data));
const imported=normalize(oldData);
check(imported.desktopWindows['pin:a'].x===-100,'Bounds survive reload/normalization');
check(imported.tasks.length===p.data.tasks.length,'Existing tasks preserved');
check(imported.settings.homeOrder.includes('quick-add'),'Quick Add tile survives reload');


const loaded=new P(app);loaded.runMaintenance=async()=>{};loaded.checkReminders=async()=>{};await loaded.onload();
check(!!app.factories[QUICK_VIEW]&&!!app.factories[PIN_VIEW]&&!!app.factories[VIEW],'All view factories registered');
check(loaded.commands.some(c=>c.id==='quick-add'),'Quick Add hotkey command registered');
check(loaded.commands.some(c=>c.id==='pin-task'),'Pin picker command registered');
check(loaded.data.settings.quickWidth===480,'Fresh install desktop defaults');
const detached=[];app.workspace.detachLeavesOfType=t=>detached.push(t);loaded.onunload();
check(loaded.desktopUnloading===true,'Unloading stops new desktop work');
check([VIEW,QUICK_VIEW,PIN_VIEW].every(t=>detached.includes(t)),'All three view types detached');
return {count};

})().then(result => console.log(result.count + ' desktop-window assertions passed.')).catch(error => { console.error(error); process.exitCode = 1; });
