/* Links to the new learning modules; legacy reading records stay separate. */
(function(){
  'use strict';
  const read=()=>{try{return JSON.parse(localStorage.getItem('ran_hsk1_learning_v2')||'{}');}catch(_e){return {};}};
  function enhance(){
    const state=read(),id=Number(new URL(location.href).searchParams.get('id'))||1,home=!!document.querySelector('#lessonGrid');
    const host=document.querySelector(home?'main.container':'.lesson-hero');if(!host)return;
    if(!document.querySelector('#learningModuleLinks')){
      const box=document.createElement('section');box.id='learningModuleLinks';box.className='learning-module-links';box.setAttribute('aria-label','Bài tập và ôn tập mới');
      box.innerHTML=`<div><span class="learning-module-kicker">HỌC · LUYỆN · NHỚ LÂU</span><h2>${home?'Hôm nay bạn muốn luyện gì?':'Luyện thêm sau bài học'}</h2><p>15 câu bài tập + 5 câu nghe mỗi bài. Lưu câu trả lời, sửa bài và tiếp tục vào lần sau.</p></div><div class="learning-module-actions"><a class="learning-primary" id="learningContinue" href="learning.html?mode=homework&lesson=${id}">Làm bài tập →</a><a href="learning.html?mode=listening&lesson=${id}">🎧 Luyện nghe</a><a href="learning.html?mode=vocab&lesson=${id}">Ghép bài ôn từ</a><a href="learning.html?mode=review&lesson=${id}">Ôn lại</a><a href="learning.html?mode=progress&lesson=${id}">Tiến độ</a></div><p class="learning-module-progress" id="learningModuleProgress"></p>`;
      if(home)host.prepend(box);else host.insertAdjacentElement('afterend',box);
    }
    const kinds=['choice','sort','translation','listening'],rows=Object.values(state.lessons||{}),done=rows.filter(r=>kinds.every(k=>r[k]?.completed)).length,submitted=rows.reduce((n,r)=>n+kinds.filter(k=>r[k]?.first).length*5,0);
    document.querySelector('#learningModuleProgress').textContent=`Bài tập mới: ${submitted}/300 câu đã nộp · ${done}/15 bài hoàn thành cả bài tập và nghe.`;
    if(home&&state.preferences?.lastRoute){try{const u=new URL(state.preferences.lastRoute,location.href);if(u.origin===location.origin&&u.pathname.endsWith('/hsk1/learning.html')){const a=document.querySelector('#learningContinue');a.href=u.pathname+u.search;a.textContent='Tiếp tục lần trước →';}}catch(_e){}}
    document.querySelectorAll('#lessonGrid .lesson-card').forEach(card=>{
      const link=card.querySelector('a[href*="id="]');if(!link)return;const lid=Number(new URL(link.href).searchParams.get('id')),row=state.lessons?.[lid]||{};
      let bar=card.querySelector('.learning-card-actions');if(!bar){bar=document.createElement('div');bar.className='learning-card-actions';bar.innerHTML=`<a href="learning.html?mode=homework&lesson=${lid}">Bài tập · 15 câu</a><a href="learning.html?mode=listening&lesson=${lid}">Nghe · 5 câu</a><span></span>`;card.appendChild(bar);}
      const count=kinds.filter(k=>row[k]?.completed).length;bar.querySelector('span').textContent=`Đã hoàn thành ${count}/4 nhóm mới`;
    });
    const c=document.querySelector('.complete-card');if(c){const h=c.querySelector('h3'),p=c.querySelector('p');if(h)h.textContent='Đã đọc tài liệu của bài?';if(p)p.textContent='Tự đánh dấu việc đọc. Điểm bài tập và nghe được lưu riêng ở mục Tiến độ mới.';}
    const p=document.querySelector('#practice .practice-note');if(p&&!p.querySelector('a')){const a=document.createElement('a');a.href=`learning.html?mode=homework&lesson=${id}`;a.textContent=' Mở 15 câu bài tập mới có lưu điểm và mở khoá từng phần →';a.className='learning-inline-link';p.appendChild(a);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
  window.addEventListener('pageshow',enhance);window.addEventListener('storage',enhance);
})();
