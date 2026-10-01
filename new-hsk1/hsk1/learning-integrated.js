(function(){
'use strict';
const root=document.getElementById('integratedRoot');
const nav=document.getElementById('integratedNav');
const noticeBox=document.getElementById('integratedNotice');
const mini=document.getElementById('integratedMiniProgress');
const params=new URL(location.href).searchParams;
const allowed=new Set(['homework','listening','vocab','review','progress']);
let mode=allowed.has(params.get('mode'))?params.get('mode'):'homework';
let lesson=Number(params.get('lesson'));if(!Number.isInteger(lesson)||lesson<1||lesson>15)lesson=1;
const directed=Number.isInteger(Number(params.get('lesson')))&&Number(params.get('lesson'))>=1&&Number(params.get('lesson'))<=15&&params.get('intent')!=='resume';
const requestedStage=['choice','sort','translation'].includes(params.get('stage'))?params.get('stage'):null;
const NAV_KEY='ran_hsk1_integrated_nav_v1';
const LEGACY_KEY='ran_hsk1_learning_v2';
function showNotice(message,warning){
  noticeBox.hidden=!message;noticeBox.textContent=message||'';
  noticeBox.classList.toggle('integrated-legacy',!!warning);
}
function addStyle(href,id){
  if(id&&document.getElementById(id))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;if(id)link.id=id;document.head.appendChild(link);
}
function loadScript(src){
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');s.src=src;s.async=false;s.onload=()=>resolve(s);s.onerror=()=>reject(new Error('Không tải được '+src));document.body.appendChild(s);
  });
}
function safeRead(key){try{return localStorage.getItem(key);}catch(_e){return null;}}
function safeWrite(key,value){try{localStorage.setItem(key,value);return true;}catch(_e){return false;}}
function activeLesson(){
  if(mode==='homework'){
    const p=new URLSearchParams(location.hash.replace(/^#/,''));
    const n=Number(p.get('lesson'));if(Number.isInteger(n)&&n>=1&&n<=15)return n;
  }
  const checks=[...document.querySelectorAll('#lesson-checks input:checked')].map(x=>Number(x.dataset.lesson)).filter(Number.isFinite);
  return checks.length===1?checks[0]:lesson;
}
function readNav(){try{return JSON.parse(safeRead(NAV_KEY)||'{}')||{};}catch(_e){return {};}}
function routeHref(nextMode,l){
  const savedHomework=readNav().homeworkLesson;
  if(nextMode==='homework'&&mode!=='homework'&&Number.isInteger(savedHomework)&&savedHomework>=1&&savedHomework<=15)l=savedHomework;
  const n=Number.isInteger(l)&&l>=1&&l<=15?l:lesson;
  return 'learning.html?mode='+encodeURIComponent(nextMode)+'&lesson='+n+'&intent=resume';
}
function updateNav(l){
  const n=Number.isInteger(l)&&l>=1&&l<=15?l:lesson;
  nav.querySelectorAll('a[data-mode]').forEach(a=>{
    const m=a.dataset.mode;a.href=routeHref(m,n);
    if(m===mode)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  const textbook=document.getElementById('openTextbook');if(textbook)textbook.href='lesson.html?id='+n+'&sec=vocab';
}
function saveLast(l,extra){
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
function updateMini(){
  let submitted=0,done=0,s2=null,s3=null;
  try{s2=JSON.parse(safeRead('ran_hsk1_stage2_v3')||'null');}catch(_e){}
  try{s3=JSON.parse(safeRead('ran_hsk1_stage3_v1')||'null');}catch(_e){}
  for(let i=1;i<=15;i++){
    const row=s2&&s2.lessons&&s2.lessons[i]||{};
    let hw=0;for(const k of ['choice','sort','translation']){const g=row[k];if(g&&g.first&&g.completed){submitted+=5;hw++;}}
    const prefix='l'+String(i).padStart(2,'0')+'-listen-';
    const records=s3&&s3.listening&&s3.listening.records||{};
    const heard=Object.keys(records).filter(id=>/^0[1-5]$/.test(id.slice(prefix.length))&&id.startsWith(prefix)&&records[id]&&records[id].first).length;
    submitted+=heard;if(hw===3&&heard===5)done++;
  }
  mini.textContent=submitted+'/300 mục đã nộp · '+done+'/15 bài đủ bài tập + nghe';
}
function stage2Markup(){
 return [
 '<div class="integrated-module" id="stage2Module">',
 '<main class="la-main" id="main">',
 '<section class="la-panel s2-course-picker" aria-labelledby="course-title"><div class="s2-course-head"><h2 id="course-title">Chọn bài để luyện</h2><p id="course-overview" aria-live="polite"></p></div><nav id="lesson-list" class="s2-lesson-list" aria-label="Chọn một trong 15 bài"></nav><p class="s2-course-help">Bạn có thể chọn bất kỳ bài nào. Trong mỗi bài, nộp đủ phần trước để mở phần tiếp theo.</p></section>',
 '<section class="la-hero" aria-labelledby="page-title"><div><p class="la-eyebrow">HSK 1 · Bài tập sau giờ học</p><h1 id="page-title" tabindex="-1"></h1><p id="lesson-goal"></p><p>Hoàn thành 5 câu rồi nộp bài để mở phần tiếp theo. Bạn có thể làm lại để luyện thêm.</p></div><div class="s1-hero-count"><strong>15</strong><span>câu trong bài</span><small>10 câu chấm tự động · 5 câu gửi cô</small></div></section>',
 '<div id="storage-notice" class="la-alert" role="status" hidden></div>',
 '<div id="storage-sync" class="la-panel" hidden><p class="la-small">Bài đang làm trong tab này vẫn còn. Tải bản sao để giữ riêng, hoặc kiểm tra bản mới được lưu từ tab khác.</p><button type="button" class="la-ghost" id="export-conflict">Tải bản bài đang làm</button> <button type="button" class="la-ghost" id="inspect-latest">Kiểm tra bản ở tab khác</button></div>',
 '<section class="s1-overview" id="overview" aria-label="Tiến độ bài đang chọn"></section><nav class="la-steps" id="stages" aria-label="Các phần bài tập"></nav><section id="exercise" tabindex="-1" aria-label="Bài tập"></section>',
 '<section class="s1-tools la-panel" id="backup-panel"><details id="backup-details"><summary>Lưu bản sao / mở lại bài đã lưu</summary><p class="la-muted">Bài được lưu trên trình duyệt này. Hãy tải bản sao nếu bạn muốn chuyển sang thiết bị khác hoặc giữ bài trước khi đổi trình duyệt.</p><button type="button" class="la-ghost" id="export-backup">Tải bản sao bài làm</button><button type="button" class="la-ghost" id="restore-previous" hidden>Khôi phục bản trước khi mở bản sao</button><label class="s1-label" for="backup-file">Mở tệp bản sao (.json)</label><input type="file" id="backup-file" accept=".json,application/json" aria-describedby="backup-help"><p class="la-small" id="backup-help">Chọn tệp hoặc dán nội dung bên dưới, rồi kiểm tra trước khi mở.</p><label class="s1-label" for="backup-input">Dán nội dung tệp bản sao (JSON)</label><textarea id="backup-input" rows="4" spellcheck="false"></textarea><button type="button" class="la-ghost" id="inspect-backup">Kiểm tra bản sao</button><div id="backup-result" aria-live="polite"></div></details></section>',
 '<p class="integrated-progress-note"><span id="lesson-scope"></span> <span id="lesson-source"></span></p>',
 '</main><section id="receipt" class="s1-receipt" hidden aria-label="Bài dịch để chụp gửi cô" tabindex="-1"></section><div id="save-status" class="s1-save" role="status" aria-live="polite"></div></div>'
 ].join('');
}
function stage3Markup(){
 return [
 '<div class="integrated-module" id="stage3Module"><main class="la-main">',
 '<nav class="s3-modules" aria-label="Chọn cách luyện"><button type="button" id="module-listening" aria-pressed="true"><span aria-hidden="true">♪</span> Luyện nghe<small>Nghe tiếng Trung · chọn nghĩa tiếng Việt</small></button><button type="button" id="module-vocabulary" aria-pressed="false"><span aria-hidden="true">字</span> Ôn từ vựng<small>Chọn nhiều bài · nhớ lại theo lịch</small></button></nav>',
 '<section class="la-hero s3-hero"><div><p class="la-eyebrow">Học cùng cô Nhiên · HSK 1</p><h1 id="page-title">Luyện nghe theo bài</h1><p id="page-intro">Chọn một hoặc nhiều bài. Nghe lại tùy ý, rồi chọn nghĩa phù hợp bằng tiếng Việt.</p></div><div class="s3-hero-number"><strong id="hero-number">75</strong><span id="hero-unit">câu nghe trong 15 bài</span></div></section>',
 '<section class="la-panel s3-picker" aria-labelledby="picker-title"><div class="s3-section-head"><h2 id="picker-title">Chọn bài đã học</h2><div class="s3-inline"><button type="button" class="s3-text-button" id="select-all">Chọn tất cả</button><button type="button" class="s3-text-button" id="clear-lessons">Bỏ chọn</button></div></div><fieldset class="s3-lessons" id="lesson-checks"><legend class="s3-sr-only">Chọn bài từ 1 đến 15</legend></fieldset><p class="s3-selection" id="selection-summary" aria-live="polite"></p>',
 '<div class="s3-settings"><label id="listening-mode-label">Nội dung nghe<select id="listening-mode"><option value="all">Tất cả câu trong bài đã chọn</option><option value="wrong">Câu nghe cần làm lại</option></select></label><label id="vocab-filter-label" hidden>Nhóm từ cần ôn<select id="vocab-filter"><option value="all">Tất cả từ đã chọn</option><option value="unfamiliar">Chưa quen</option><option value="wrong">Cần luyện lại</option><option value="due">Đến lượt ôn / từ mới</option></select></label><label id="review-direction-label" hidden>Hướng nhớ lại<select id="review-direction"><option value="zh-vi">Tiếng Trung → tiếng Việt</option><option value="vi-zh">Tiếng Việt → tiếng Trung</option></select></label><label class="s3-checkbox"><input type="checkbox" id="shuffle-items" checked> Trộn thứ tự</label></div>',
 '<div class="s3-start-row"><button type="button" class="la-button" id="start-listening">Bắt đầu lượt nghe</button><button type="button" class="la-button" id="start-review" hidden>Bắt đầu ôn từ</button><span class="la-small" id="selection-help">Mỗi bài có 5 câu nghe. Chọn nhiều bài để luyện xen kẽ.</span></div><p id="session-scope-note" class="la-small" hidden></p></section>',
 '<div class="s3-overview" id="overview" aria-label="Tiến độ đã lưu"></div><div class="s3-notice" id="action-notice" role="status" hidden></div><div class="s3-notice s3-warning" id="storage-notice" role="status" hidden></div>',
 '<section class="la-panel" id="storage-sync" hidden><p>Bài đang làm trong tab này vẫn còn. Tải bản sao để giữ riêng, hoặc kiểm tra bản mới từ tab khác.</p><div class="s3-inline"><button type="button" class="la-ghost" id="export-conflict">Tải bản đang làm</button><button type="button" class="la-ghost" id="inspect-latest">Kiểm tra bản ở tab khác</button></div></section>',
 '<section id="audio-controls" class="s3-audio" aria-label="Điều khiển âm thanh" hidden><div class="s3-audio-top"><div><span class="s3-audio-label" id="audio-label">Âm thanh giáo trình</span><p id="audio-status" role="status">Nhấn phát để nghe.</p></div><label>Tốc độ<select id="audio-rate"><option value="0.65">0.65× · chậm</option><option value="0.75">0.75×</option><option value="1" selected>1× · bình thường</option><option value="1.25">1.25×</option><option value="1.5">1.5× · nhanh</option></select></label></div><div class="s3-audio-buttons"><button type="button" class="la-button" id="play-audio">▶ Phát âm thanh</button><button type="button" class="la-ghost" id="pause-audio">Tạm dừng</button><button type="button" class="la-ghost" id="replay-audio">Nghe từ đầu</button></div><div class="s3-audio-progress"><progress id="audio-progress" max="1" value="0" aria-label="Tiến độ đoạn âm"></progress><span id="audio-time">0:00 / 0:00</span></div><p class="s3-audio-note">Bạn có thể nghe lại nhiều lần. Số lần nghe không làm giảm điểm.</p><audio id="lesson-audio" preload="none"></audio></section>',
 '<section id="work-content" tabindex="-1" aria-label="Nội dung luyện tập"></section>',
 '<section class="la-panel s3-backup" id="backup-panel"><details id="backup-details"><summary>Lưu bản sao / mở lại tiến độ</summary><p class="la-muted">Tiến độ nghe và lịch ôn được lưu trên trình duyệt này. Tải bản sao để giữ riêng hoặc chuyển thiết bị.</p><div class="s3-inline"><button type="button" class="la-ghost" id="export-backup">Tải bản sao (.json)</button><button type="button" class="la-ghost" id="restore-previous" hidden>Khôi phục bản trước</button><button type="button" class="la-ghost" id="export-raw" hidden>Tải dữ liệu gốc chưa mở được</button></div><label for="backup-file">Chọn tệp tiến độ nghe và ôn từ</label><input type="file" id="backup-file" accept=".json,application/json"><label for="backup-input">Hoặc dán nội dung JSON</label><textarea id="backup-input" rows="4" spellcheck="false"></textarea><button type="button" class="la-ghost" id="inspect-backup">Kiểm tra trước khi mở</button><div id="backup-result" aria-live="polite"></div></details></section>',
 '</main><div class="s3-save-status" id="save-status" aria-live="polite"></div></div>'
 ].join('');
}
function migrateStage2(){
 const E=window.HSKStep2Engine,bank=window.HSKStep2Bank;
 if(!E||!bank)return;
 try{
   if(localStorage.getItem(E.KEY))return;
   const step1=localStorage.getItem(E.STEP1_KEY);
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
   }
 }catch(error){
   showNotice('Không tự chuyển bản cũ vì dữ liệu không khớp phiên bản. Bản cũ vẫn được giữ nguyên và chưa bị ghi đè.',true);
 }
}
function prepareStage3(){
  const entry={module:mode==='listening'?'listening':'vocabulary'};
  if(directed)entry.lessons=[lesson];
  if(mode==='review')entry.filter='due';
  window.HSKStep3Entry=entry;
}
async function runHomework(){
 document.body.classList.add('stage2-app');addStyle('stage2/styles.css?v=20261001-i1','stage2Style');
 root.innerHTML=stage2Markup();
 if(!/^#lesson=/.test(location.hash)){
   const remembered=readNav().homeworkParts?.[lesson];
   const part=requestedStage||(['choice','sort','translation'].includes(remembered)?remembered:'');
   history.replaceState(null,'',location.pathname+location.search+'#lesson='+lesson+(part?'&part='+part:''));
 }
 await loadScript('stage2/bank.js?v=20261001-i1');await loadScript('stage2/engine.js?v=20261001-i1');migrateStage2();
 await loadScript('stage2/app.js?v=20261001-i1');
 saveLast(activeLesson(),'homework');
}
async function runStage3(){
 document.body.classList.add('stage3-app');addStyle('stage3/styles.css?v=20261001-i1','stage3Style');
 root.innerHTML=stage3Markup();
 await loadScript('stage3/catalog.js?v=20261001-i1');await loadScript('stage3/media-index.js?v=20261001-i1');await loadScript('stage3/engine.js?v=20261001-i1');
 prepareStage3();
 await loadScript('stage3/player.js?v=20261001-i1');await loadScript('stage3/app.js?v=20261001-i1');
 saveLast(lesson,mode);
}
async function runProgress(){
 addStyle('stage2/styles.css?v=20261001-i1','stage2Style');addStyle('stage3/styles.css?v=20261001-i1','stage3Style');
 await loadScript('stage2/bank.js?v=20261001-i1');await loadScript('stage2/engine.js?v=20261001-i1');migrateStage2();
 await loadScript('stage3/catalog.js?v=20261001-i1');await loadScript('stage3/engine.js?v=20261001-i1');
 const E2=window.HSKStep2Engine,B=window.HSKStep2Bank,E3=window.HSKStep3Engine,C=window.HSKStep3Catalog;
 let s2=E2.blank(),s3=E3.blank(),invalid=[];
 try{const raw=localStorage.getItem(E2.KEY);if(raw)s2=E2.validateImport(JSON.parse(raw),B);}catch(_e){invalid.push('bài tập');}
 try{const raw=localStorage.getItem(E3.KEY);if(raw)s3=E3.importBackup(JSON.parse(raw),C);}catch(_e){invalid.push('nghe / ôn từ');}
 if(invalid.length)showNotice('Chưa đọc được bản lưu '+invalid.join(', ')+'. Các số của phần đó chưa được xác nhận; dữ liệu gốc vẫn được giữ. Hãy mở công cụ bản sao trong mô-đun tương ứng.',true);
 const all2=E2.courseTotals(s2,B),all3=E3.listeningSummary(s3,C).overall,cards=E3.cardSummary(s3,C,Date.now());
 const rows=[];
 for(let i=1;i<=15;i++){
   const t=E2.totals(s2,i,B.find(x=>x.id===i));
   const qs=C.listening.filter(q=>q.lesson===i);
   const rec=qs.map(q=>s3.listening.records[q.id]).filter(Boolean);
   const first=rec.filter(x=>x.first&&x.first.correct).length,latest=rec.filter(x=>x.latest&&x.latest.correct).length;
   rows.push('<tr><td><a href="lesson.html?id='+i+'&sec=vocab">Bài '+i+'</a></td><td>'+t.homework.submitted+'/15</td><td>'+t.automatic.firstCorrect+'/'+t.automatic.submitted+'</td><td>'+t.manual.submitted+'/5</td><td>'+rec.length+'/5</td><td>'+first+'/'+rec.length+' · gần nhất '+latest+'/'+rec.length+'</td></tr>');
 }
 const legacy=!!safeRead(LEGACY_KEY);
 root.innerHTML='<main class="integrated-progress"><section class="la-hero"><div><p class="la-eyebrow">Tiến độ · 记录</p><h1>Nhìn riêng từng loại kết quả</h1><p>Bài tập chấm tự động, bài dịch gửi cô, nghe và tự đánh giá từ vựng không được trộn thành một điểm.</p></div><div class="la-hero-number">'+all2.homework.completedLessons+'<small>/15 bài tập</small></div></section>'+
 '<div class="integrated-progress-grid"><div class="integrated-progress-card"><strong>'+all2.homework.submitted+'/225</strong><span>Câu bài tập đã nộp</span></div><div class="integrated-progress-card"><strong>'+all2.automatic.firstCorrect+'/'+all2.automatic.submitted+'</strong><span>Đúng lần đầu trong phần chấm tự động</span></div><div class="integrated-progress-card"><strong>'+all3.answered+'/75</strong><span>Câu nghe đã nộp</span></div><div class="integrated-progress-card"><strong>'+cards.rated+'</strong><span>Thẻ nghĩa đã tự đánh giá</span></div></div>'+
 (legacy?'<section class="la-panel integrated-legacy"><b>Bản học cũ vẫn được giữ nguyên.</b><p class="integrated-progress-note">Khi tạo tiến độ bài tập mới, chỉ các nhóm khách quan có thể xác minh mới được chuyển. Bài dịch bốn lựa chọn cũ không được tính thành bài dịch tự viết. Tiến độ nghe cũ không tự gán vào bộ nghe mới vì câu hỏi và âm đoạn đã được hiệu chỉnh.</p></section>':'')+
 '<div class="integrated-progress-actions"><a class="la-button" href="'+routeHref('homework',lesson)+'">Tiếp tục bài tập</a><a class="la-ghost" href="'+routeHref('listening',lesson)+'">Luyện nghe</a><a class="la-ghost" href="'+routeHref('vocab',lesson)+'">Ôn từ</a></div>'+
 '<div class="integrated-progress-table-wrap"><table class="integrated-progress-table"><thead><tr><th>Bài</th><th>Đã nộp</th><th>Chấm tự động: lần đầu</th><th>Dịch gửi cô</th><th>Nghe</th><th>Điểm nghe</th></tr></thead><tbody>'+rows.join('')+'</tbody></table></div><p class="integrated-progress-note">“Thẻ đã tự đánh giá” là tự nhận xét mức nhớ, không phải điểm. Điểm nghe và điểm bài tập được lưu độc lập.</p></main>';
 saveLast(lesson,'progress');
}
window.addEventListener('hsk-learning-state',event=>{
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
function initializeSessionGate(){if(typeof window.initGate==='function')window.initGate();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeSessionGate,{once:true});else initializeSessionGate();
async function boot(){
 updateNav(lesson);updateMini();
 try{
   if(mode==='homework')await runHomework();
   else if(mode==='progress')await runProgress();
   else await runStage3();
 }catch(error){
   console.error(error);root.innerHTML='<div class="la-alert"><b>Chưa mở được mô-đun học.</b><p>'+String(error&&error.message||error)+'</p><p>Dữ liệu đã lưu chưa bị xóa. Hãy tải lại trang hoặc quay về giáo trình.</p></div>';
 }
}
boot();
})();