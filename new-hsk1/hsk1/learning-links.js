/* Canonical links for the integrated HSK1 learning center. Legacy reading records remain separate. */
(function(){
'use strict';
const S2='ran_hsk1_stage2_v3',S3='ran_hsk1_stage3_v1',NAV='ran_hsk1_integrated_nav_v1';
const json=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_e){return null;}};
function groupDone(row,k){return !!(row&&row[k]&&row[k].completed&&row[k].first);}
function lessonStats(id,s2,s3){
  const row=s2&&s2.lessons&&s2.lessons[id]||{};let homework=0,groups=0;
  for(const k of ['choice','sort','translation']){const g=row[k];if(g&&g.first){homework+=5;if(g.completed)groups++;}}
  const prefix='l'+String(id).padStart(2,'0')+'-listen-',records=s3&&s3.listening&&s3.listening.records||{};
  const listening=Object.keys(records).filter(qid=>qid.startsWith(prefix)&&/^0[1-5]$/.test(qid.slice(prefix.length))&&records[qid]&&records[qid].first).length;
  return {homework,listening,groups,done:groups===3&&listening===5};
}
function totals(s2,s3){
  let submitted=0,done=0;for(let id=1;id<=15;id++){const s=lessonStats(id,s2,s3);submitted+=s.homework+s.listening;if(s.done)done++;}
  return {submitted,done};
}
function enhance(){
  const s2=json(S2),s3=json(S3),last=json(NAV);
  const id=Number(new URL(location.href).searchParams.get('id'))||1,home=!!document.querySelector('#lessonGrid');
  const host=document.querySelector(home?'main.container':'.lesson-hero');if(!host)return;
  if(!document.querySelector('#learningModuleLinks')){
    const box=document.createElement('section');box.id='learningModuleLinks';box.className='learning-module-links';box.setAttribute('aria-label','Bài tập và ôn tập mới');
    box.innerHTML='<div><span class="learning-module-kicker">HỌC · LUYỆN · NHỚ LÂU</span><h2>'+(home?'Hôm nay bạn muốn luyện gì?':'Luyện thêm sau bài học')+'</h2><p>15 câu bài tập + 5 câu nghe mỗi bài. Bài dịch tự viết được lưu để chụp gửi cô; điểm nghe và tự đánh giá từ vựng được lưu riêng.</p></div><div class="learning-module-actions"><a class="learning-primary" id="learningContinue" href="learning.html?mode=homework&lesson='+id+'">Làm bài tập →</a><a href="learning.html?mode=listening&lesson='+id+'">🎧 Luyện nghe</a><a href="learning.html?mode=vocab&lesson='+id+'">Ghép bài ôn từ</a><a href="learning.html?mode=review&lesson='+id+'">Ôn đến hạn</a><a href="learning.html?mode=progress&lesson='+id+'">Tiến độ</a></div><p class="learning-module-progress" id="learningModuleProgress"></p>';
    if(home)host.prepend(box);else host.insertAdjacentElement('afterend',box);
  }
  if(home){
    document.querySelectorAll('#learningModuleLinks a[href*="learning.html"]').forEach(a=>{const u=new URL(a.href,location.href);u.searchParams.set('intent','resume');if(last&&Number.isInteger(last.lesson)&&last.lesson>=1&&last.lesson<=15)u.searchParams.set('lesson',last.lesson);a.href=u.pathname+u.search+u.hash;});
  }
  const all=totals(s2,s3);document.querySelector('#learningModuleProgress').textContent='Bộ luyện mới: '+all.submitted+'/300 mục đã nộp · '+all.done+'/15 bài hoàn thành cả bài tập và nghe.';
  if(home&&last&&typeof last.href==='string'){
    try{const u=new URL(last.href,location.href);if(u.origin===location.origin&&u.pathname.endsWith('/hsk1/learning.html')){const a=document.querySelector('#learningContinue');u.searchParams.set('intent','resume');a.href=u.pathname+u.search+u.hash;a.textContent='Tiếp tục lần trước →';}}catch(_e){}
  }
  document.querySelectorAll('#lessonGrid .lesson-card').forEach(card=>{
    const link=card.querySelector('a[href*="id="]');if(!link)return;const lid=Number(new URL(link.href).searchParams.get('id')),s=lessonStats(lid,s2,s3);
    let bar=card.querySelector('.learning-card-actions');if(!bar){bar=document.createElement('div');bar.className='learning-card-actions';bar.innerHTML='<a href="learning.html?mode=homework&lesson='+lid+'">Bài tập · 15 câu</a><a href="learning.html?mode=listening&lesson='+lid+'">Nghe · 5 câu</a><span></span>';card.appendChild(bar);}
    bar.querySelector('span').textContent='Đã nộp '+(s.homework+s.listening)+'/20 mục · '+(s.done?'✓ đủ bài tập + nghe':s.groups+'/3 phần bài tập');
  });
  const c=document.querySelector('.complete-card');if(c){const h=c.querySelector('h3'),p=c.querySelector('p');if(h)h.textContent='Đã đọc tài liệu của bài?';if(p)p.textContent='Tự đánh dấu việc đọc. Điểm bài tập, bài dịch và nghe được lưu riêng ở mục Tiến độ.';}
  const p=document.querySelector('#practice .practice-note');if(p&&!p.querySelector('.learning-inline-link')){const a=document.createElement('a');a.href='learning.html?mode=homework&lesson='+id;a.textContent=' Mở 15 câu bài tập mới: 5 chọn đáp án + 5 xếp câu + 5 dịch tự viết →';a.className='learning-inline-link';p.appendChild(a);}
}
function start(){enhance();const grid=document.getElementById('lessonGrid');if(grid)new MutationObserver(enhance).observe(grid,{childList:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.addEventListener('pageshow',enhance);window.addEventListener('storage',enhance);
})();