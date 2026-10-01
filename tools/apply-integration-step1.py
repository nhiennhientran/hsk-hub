from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[1]
if 'const mediaBase = new URL' in (ROOT/'new-hsk1/hsk1/stage3/player.js').read_text():
    print('Initial integration repairs already applied.'); raise SystemExit(0)
def change(path,old,new):
    p=ROOT/path;s=p.read_text();assert old in s,(path,old[:80]);p.write_text(s.replace(old,new,1))
change('tools/tests/stage3-engine.test.cjs',"const dataDirectory = path.join(__dirname, '../../new-hsk1/hsk1/stage3/data');\nconst actualFiles = ['01-05', '06-10', '11-15'].flatMap(range => [`listening-${range}.json`, `vocabulary-${range}.json`]);\ntest('the actual 75 listening questions and every authored sense run through submit, reveal, rate and backup',\n  {skip: !actualFiles.every(file => fs.existsSync(path.join(dataDirectory, file))) && 'Third-step content is still being authored.'}, () => {\n    const actual = {listening: [], vocabulary: []};\n    for (const file of actualFiles) actual[file.startsWith('listening') ? 'listening' : 'vocabulary'].push(\n      ...JSON.parse(fs.readFileSync(path.join(dataDirectory, file), 'utf8')));", """test('the shipped catalog: all 75 listening questions and 344 vocabulary records run through the real engine', () => {
    const shipped = path.join(__dirname, '../../new-hsk1/hsk1/stage3/catalog.js');
    assert.ok(fs.existsSync(shipped), 'Mandatory shipped catalog is missing');
    const sandbox = {window: {}};
    vm.runInNewContext(fs.readFileSync(shipped, 'utf8'), sandbox, {filename: shipped});
    const actual = JSON.parse(JSON.stringify(sandbox.window.HSKStep3Catalog));
    assert.equal(actual.vocabulary.length, 344);
    assert.equal(new Set(actual.vocabulary.map(v => v.zh)).size, 319);""")
change('new-hsk1/hsk1/stage3/player.js',"  const lessonLoads = new Map();", """  const scriptURL = document.currentScript && document.currentScript.src;
  const mediaBase = new URL('media/', scriptURL || document.baseURI).href;
  const lessonLoads = new Map();""")
change('new-hsk1/hsk1/stage3/player.js',"element.async = true; element.src = `media/lesson-${String(lesson).padStart(2, '0')}.js`;", "element.async = true; element.src = new URL(`lesson-${String(lesson).padStart(2, '0')}.js`, mediaBase).href;")
change('new-hsk1/hsk1/stage3/app.js',"  function serialize() { return JSON.stringify(E.exportBackup(state, C)); }", """  let entryChanged = false;
  const entry = window.HSKStep3Entry;
  if (entry && typeof entry === 'object') {
    const patch = {};
    if (['listening', 'vocabulary'].includes(entry.module)) patch.module = entry.module;
    if (Array.isArray(entry.lessons) && entry.lessons.every(n => Number.isInteger(n) && n >= 1 && n <= 15)) patch.lessons = entry.lessons;
    if (entry.filter === 'due') patch.vocabularyFilter = 'due';
    // Keep the saved question/card queues, answers, scores and schedules intact.
    entryChanged = Object.keys(patch).some(k => !same(state.preferences[k], patch[k]));
    if (entryChanged) E.setPreferences(state, patch, Date.now());
  }
  function emitState() {
    window.dispatchEvent(new CustomEvent('hsk-learning-state', {detail: {
      app: E.APP, preferences: {...state.preferences, lessons: state.preferences.lessons.slice()},
      listening: E.listeningSummary(state, C).overall,
      stored: storageAvailable && !storageBlocked
    }}));
  }
  function serialize() { return JSON.stringify(E.exportBackup(state, C)); }""")
change('new-hsk1/hsk1/stage3/app.js',"      action(); mutationVersion++; save();", "      action(); mutationVersion++; save(); emitState();")
change('new-hsk1/hsk1/stage3/app.js',"    if (state.preferences.module === 'listening') renderListening(); else renderVocabulary();\n  }", "    if (state.preferences.module === 'listening') renderListening(); else renderVocabulary();\n    emitState();\n  }")
change('new-hsk1/hsk1/stage3/app.js',"  render();\n  if (!storageMessage)","  if (entryChanged && !storageBlocked && storageAvailable) save();\n  render();\n  if (!storageMessage)")
change('new-hsk1/hsk1/stage2/app.js',"  let candidate = null;", "  let candidate = null;\n  let candidateMeta = null;\n  let backupReadVersion = 0;")
change('new-hsk1/hsk1/stage2/app.js',"  function save() {", """  function emitState() {
    window.dispatchEvent(new CustomEvent('hsk-learning-state', {detail: {
      app: E.APP, lesson: lessonId, part: kind, totals: E.courseTotals(state, bank),
      stored: storageAvailable && !storageConflict && !writeFailed && !dirty
    }}));
  }
  function save() {""")
change('new-hsk1/hsk1/stage2/app.js',"      byId('save-status').textContent = 'Đã lưu trên trình duyệt này';", "      byId('save-status').textContent = 'Đã lưu trên trình duyệt này';\n      emitState();")
change('new-hsk1/hsk1/stage2/app.js',"  function render() { renderCoursePicker(); renderOverview(); renderStages(); renderExercise(); flushSave(); }", "  function render() { renderCoursePicker(); renderOverview(); renderStages(); renderStages; renderExercise(); flushSave(); emitState(); }")
change('new-hsk1/hsk1/stage2/app.js',"renderStages(); renderStages; renderExercise();","renderStages(); renderExercise();")
change('new-hsk1/hsk1/stage2/app.js',"byId('backup-input').addEventListener('input',()=>{candidate=null;", "byId('backup-input').addEventListener('input',()=>{backupReadVersion++;candidateMeta=null;candidate=null;")
change('new-hsk1/hsk1/stage2/app.js',"    candidate=null;backupFileText=null;byId('backup-input').value='';", "    const readVersion=++backupReadVersion;\n    candidateMeta=null;candidate=null;backupFileText=null;byId('backup-input').value='';")
change('new-hsk1/hsk1/stage2/app.js',"      if(byId('backup-file').files[0]!==file)return;", "      if(readVersion!==backupReadVersion||byId('backup-file').files[0]!==file)return;")
change('new-hsk1/hsk1/stage2/app.js',"    candidate=null;\n    try{\n      const raw=backupFileText", "    flushSave();candidateMeta=null;candidate=null;\n    try{\n      const raw=backupFileText")
change('new-hsk1/hsk1/stage2/app.js',"      candidate=E.importBackup(input,bank);", """      candidate=E.importBackup(input,bank);
      let expectedRaw;try{expectedRaw=localStorage.getItem(E.KEY);}catch(_e){}
      candidateMeta={state:JSON.stringify(state),expectedRaw};""")
change('new-hsk1/hsk1/stage2/app.js',"    if(event.target.id!=='apply-backup'||!candidate)return;\n    let recoveryInMemory=false;", """    if(event.target.id!=='apply-backup'||!candidate)return;
    let currentRaw;try{currentRaw=localStorage.getItem(E.KEY);}catch(_e){}
    if(!candidateMeta || candidateMeta.state!==JSON.stringify(state) || candidateMeta.expectedRaw!==currentRaw){
      candidate=null;candidateMeta=null;
      byId('backup-result').textContent='Bài làm đã thay đổi từ lúc kiểm tra. Hãy kiểm tra lại bản sao trước khi mở; bài đang làm vẫn được giữ.';
      return;
    }
    candidateMeta=null;backupReadVersion++;
    let recoveryInMemory=false;""")
change('new-hsk1/hsk1/stage2/app.js',"  window.addEventListener('pagehide',flushSave);", """  window.addEventListener('pagehide',flushSave);
  window.addEventListener('beforeunload',event=>{
    flushSave();
    if((dirty&&(!storageAvailable||storageConflict||writeFailed))||memoryRecovery){event.preventDefault();event.returnValue='';}
  });""")
p=ROOT/'new-hsk1/hsk1/learning-integrated.js';s=p.read_text()
s=s.replace("const requestedStage=", "const directed=Number.isInteger(Number(params.get('lesson')))&&Number(params.get('lesson'))>=1&&Number(params.get('lesson'))<=15&&params.get('intent')!=='resume';\nconst requestedStage=",1)
a=s.index('function routeHref(');b=s.index('function updateNav(',a)
s=s[:a]+"""function readNav(){try{return JSON.parse(safeRead(NAV_KEY)||'{}')||{};}catch(_e){return {};}}
function routeHref(nextMode,l){
  const n=Number.isInteger(l)&&l>=1&&l<=15?l:lesson;
  return 'learning.html?mode='+encodeURIComponent(nextMode)+'&lesson='+n+'&intent=resume';
}
"""+s[b:]
a=s.index('function saveLast(');b=s.index('function updateMini(',a)
s=s[:a]+"""function saveLast(l,extra){
  const n=Number.isInteger(l)&&l>=1&&l<=15?l:lesson;
  if(mode==='progress'){updateNav(n);updateMini();return;}
  const previous=readNav();
  const data={...previous,mode,lesson:n,href:routeHref(mode,n)+(mode==='homework'?location.hash:''),at:Date.now(),extra:extra||''};
  if(mode==='homework'){
    const part=new URLSearchParams(location.hash.slice(1)).get('part')||'choice';
    const parts=previous.homeworkParts&&typeof previous.homeworkParts==='object'?previous.homeworkParts:{};
    data.homeworkParts={...parts,[n]:part};data.homeworkLesson=n;
  }
  safeWrite(NAV_KEY,JSON.stringify(data));updateNav(n);updateMini();
}
"""+s[b:]
s=s.replace("submitted+=Number(g.first.total)||5", "submitted+=5")
s=s.replace("id.startsWith(prefix)&&records[id]&&records[id].first", "/^0[1-5]$/.test(id.slice(prefix.length))&&id.startsWith(prefix)&&records[id]&&records[id].first")
a=s.index('function prepareStage3(');b=s.index('async function runHomework(',a)
s=s[:a]+"""function prepareStage3(){
  const entry={module:mode==='listening'?'listening':'vocabulary'};
  if(directed)entry.lessons=[lesson];
  if(mode==='review')entry.filter='due';
  window.HSKStep3Entry=entry;
}
"""+s[b:]
s=s.replace("   const part=requestedStage||'choice';", "   const remembered=readNav().homeworkParts?.[lesson];\n   const part=requestedStage||(['choice','sort','translation'].includes(remembered)?remembered:'');")
s=s.replace("+'#lesson='+lesson+'&part='+part", "+'#lesson='+lesson+(part?'&part='+part:'')")
a=s.index(' const sync=()=>{',s.index('async function runHomework'));b=s.index('\n}',a)
s=s[:a]+" saveLast(activeLesson(),'homework');"+s[b:]
s=s.replace(" const prepared=prepareStage3();", " prepareStage3();")
a=s.index(' if(!prepared){');b=s.index('\n}',a)
s=s[:a]+" saveLast(lesson,mode);"+s[b:]
s=s.replace("let s2=E2.blank(),s3=E3.blank();", "let s2=E2.blank(),s3=E3.blank(),invalid=[];")
s=s.replace("if(raw)s2=E2.validateImport(JSON.parse(raw),B);}catch(_e){}", "if(raw)s2=E2.validateImport(JSON.parse(raw),B);}catch(_e){invalid.push('bài tập');}")
s=s.replace("if(raw)s3=E3.importBackup(JSON.parse(raw),C);}catch(_e){}", "if(raw)s3=E3.importBackup(JSON.parse(raw),C);}catch(_e){invalid.push('nghe / ôn từ');}\n if(invalid.length)showNotice('Chưa đọc được bản lưu '+invalid.join(', ')+'. Các số của phần đó chưa được xác nhận; dữ liệu gốc vẫn được giữ. Hãy mở công cụ bản sao trong mô-đun tương ứng.',true);")
s=s.replace("Đúng lần đầu trong phần tự chấm", "Đúng lần đầu trong phần chấm tự động").replace("Tự chấm lần đầu", "Chấm tự động: lần đầu")
a=s.index('   const legacy=localStorage.getItem(E.LEGACY_KEY);');b=s.index('\n }catch(error)',a)
s=s[:a]+"""   const step1=localStorage.getItem(E.STEP1_KEY);
   const legacy=localStorage.getItem(E.LEGACY_KEY);
   if(step1){
     const migrated=E.migrateStep1(JSON.parse(step1),bank,Date.now());
     if(localStorage.getItem(E.KEY))return;
     localStorage.setItem(E.KEY,JSON.stringify(migrated));
     showNotice('Đã mở lại bài tập Bài 3 đã lưu. Các bản học cũ vẫn được giữ riêng.',false);
   }else if(legacy){
     const migrated=E.migrateLegacy(JSON.parse(legacy),bank,Date.now());
     if(localStorage.getItem(E.KEY))return;
     localStorage.setItem(E.KEY,JSON.stringify(migrated));
     showNotice('Đã tạo bản tiến độ mới từ các phần cũ có thể xác minh. Bài dịch chọn đáp án cũ chỉ được lưu trong phần lưu trữ, không được tính là bài dịch tự viết đã hoàn thành.',true);
   }"""+s[b:]
insert="""window.addEventListener('hsk-learning-state',event=>{
 const d=event.detail||{};
 if(d.app==='hsk1-stage2'){
   lesson=d.lesson;saveLast(lesson,d.part);
 }else if(d.app==='hsk1-stage3'){
   const p=d.preferences;
   if(!p)return;
   mode=p.module==='listening'?'listening':(p.vocabularyFilter==='due'?'review':'vocab');
   // Retain the textbook/homework lesson when the selected review range is mixed.
   if(p.lessons.length===1)lesson=p.lessons[0];
   history.replaceState(null,'',routeHref(mode,lesson));
   saveLast(lesson,mode);
 }
});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
window.addEventListener('storage',event=>{if(event.key!=='ran_hsk1_integrated_nav_v1')updateMini();});
"""
s=s.replace('async function boot(){',insert+'async function boot(){',1).replace('20261001-41','20261001-i1');p.write_text(s)
p=ROOT/'new-hsk1/hsk1/learning-links.js';s=p.read_text()
s=s.replace("Number(g.first.total)||5", "5")
s=s.replace("qid.startsWith(prefix)&&records[qid]", "qid.startsWith(prefix)&&/^0[1-5]$/.test(qid.slice(prefix.length))&&records[qid]")
s=s.replace("điểm nghe và từ vựng được lưu riêng", "điểm nghe và tự đánh giá từ vựng được lưu riêng")
s=s.replace("  const all=totals(s2,s3);", """  if(home){
    document.querySelectorAll('#learningModuleLinks a[href*="learning.html"]').forEach(a=>{const u=new URL(a.href,location.href);u.searchParams.set('intent','resume');if(last&&Number.isInteger(last.lesson)&&last.lesson>=1&&last.lesson<=15)u.searchParams.set('lesson',last.lesson);a.href=u.pathname+u.search+u.hash;});
  }
  const all=totals(s2,s3);""")
s=s.replace("a.href=u.pathname+u.search+u.hash;a.textContent='Tiếp tục lần trước →';", "u.searchParams.set('intent','resume');a.href=u.pathname+u.search+u.hash;a.textContent='Tiếp tục lần trước →';")
s=s.replace("if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();", "function start(){enhance();const grid=document.getElementById('lessonGrid');if(grid)new MutationObserver(enhance).observe(grid,{childList:true});}\nif(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();")
p.write_text(s)
p=ROOT/'new-hsk1/hsk1/learning-integrated.css';p.write_text(p.read_text()+"\n.is-receipt .integrated-header,.is-receipt .integrated-nav,.is-receipt .integrated-footer,.is-receipt #integratedNotice{display:none!important}\n.integrated-root, .integrated-module {min-width:0}\n@media print{.integrated-header,.integrated-nav,.integrated-footer,#integratedNotice{display:none!important}}\n")
for name in ['learning.html','index.html','lesson.html']:
 p=ROOT/'new-hsk1/hsk1'/name;s=p.read_text();s=s.replace('learning-integrated.js?v=20261001-41','learning-integrated.js?v=20261001-i1').replace('learning-integrated.css?v=20261001-41','learning-integrated.css?v=20261001-i1').replace('learning-links.js?v=20260930-1','learning-links.js?v=20261001-i1');p.write_text(s)
print('Integration repairs applied; no production branch or frozen corpus modified.')
