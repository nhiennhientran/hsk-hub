(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;else root.HSK1_PILOT_ENGINE=api;
})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  const normalize=x=>String(x??'').normalize('NFKC').replace(/[\s，。！？,.!?；;：:、“”‘’'"（）()]/gu,'');
  const empty=bank=>({version:1,bankVersion:bank.version,groups:{},words:{},selectedLessons:[9]});
  const groupState=(state,id)=>state.groups[id]??(state.groups[id]={attempts:[],draft:{},editing:true,attemptCount:0});
  const unlocked=(bank,state,index)=>bank.groups.slice(0,index).every(g=>state.groups[g.id]?.attempts?.length>0);
  function validAnswer(q,a){
    if(q.type==='choice')return typeof a==='string'&&q.options.includes(a);
    if(q.type==='order')return Array.isArray(a)&&a.length===q.tokens.length&&a.every(x=>Number.isInteger(x)&&x>=0&&x<q.tokens.length)&&new Set(a).size===q.tokens.length;
    return typeof a==='string'&&a.trim().length>0&&a.length<=240&&/[\p{Script=Han}]/u.test(a)&&!/[A-Za-z]/.test(a);
  }
  function grade(q,a){
    if(!validAnswer(q,a))return {status:'missing',why:'Hoàn thành câu trả lời bằng chữ Hán / chọn đủ thẻ hoặc một đáp án.'};
    if(q.type==='choice')return {status:a===q.answer?'correct':'incorrect'};
    const text=q.type==='order'?a.map(i=>q.tokens[i]).join(''):a;
    if(q.accepted.some(x=>normalize(x)===normalize(text)))return {status:'correct'};
    if(q.type==='order')return {status:'incorrect'};
    const known=q.incorrect?.find(x=>normalize(x.text)===normalize(text));
    return known?{status:'incorrect',why:known.why}:{status:'review',why:'Cách viết này chưa có trong danh sách đã duyệt. Giữ nguyên câu trả lời để giáo viên đối chiếu; chưa kết luận sai.'};
  }
  function summary(results){
    const s={correct:0,incorrect:0,review:0,total:results.length};
    for(const r of results){if(r.status==='correct')s.correct++;else if(r.status==='incorrect')s.incorrect++;else if(r.status==='review')s.review++;}
    return s;
  }
  function submit(bank,state,groupId,now=Date.now()){
    const index=bank.groups.findIndex(g=>g.id===groupId);
    if(index<0||!unlocked(bank,state,index))return {ok:false,reason:'locked'};
    const group=bank.groups[index],saved=groupState(state,groupId);
    if(saved.editing===false)return {ok:false,reason:'submitted'};
    const missing=group.questions.filter(q=>!validAnswer(q,saved.draft[q.id])).map(q=>q.id);
    if(missing.length)return {ok:false,reason:'missing',missing};
    const answers=JSON.parse(JSON.stringify(saved.draft));
    const results=group.questions.map(q=>({id:q.id,...grade(q,answers[q.id])}));
    const attempt={submittedAt:now,answers,results,...summary(results)};
    saved.attempts.push(attempt);saved.attemptCount=(saved.attemptCount||0)+1;
    if(saved.attempts.length>20)saved.attempts.splice(1,saved.attempts.length-20);
    saved.editing=false;saved.draft={};
    return {ok:true,attempt};
  }
  function retry(state,id){const s=groupState(state,id);s.editing=true;s.draft={};}
  function totals(bank,state,kind='latest'){
    const out={correct:0,incorrect:0,review:0,total:0,groups:0};
    for(const g of bank.groups){
      const list=state.groups[g.id]?.attempts||[];if(!list.length)continue;
      const a=kind==='first'?list[0]:kind==='best'?list.reduce((best,x)=>x.correct>best.correct?x:best):list[list.length-1];
      const s=summary(g.questions.map(q=>grade(q,a.answers[q.id])));
      for(const k of ['correct','incorrect','review','total'])out[k]+=s[k];out.groups++;
    }
    return out;
  }
  function restore(bank,raw){
    if(!raw||raw.version!==1||raw.bankVersion!==bank.version||!raw.groups||typeof raw.groups!=='object')throw Error('Tệp không đúng phiên bản Bài 9.');
    const clean=empty(bank);
    for(let index=0;index<bank.groups.length;index++){
      const g=bank.groups[index],old=raw.groups[g.id];if(!old)continue;
      if(!unlocked(bank,clean,index))continue;
      const s=groupState(clean,g.id);
      const attempts=Array.isArray(old.attempts)?old.attempts:[];
      const selected=attempts.length>20?[attempts[0],...attempts.slice(-19)]:attempts;
      for(const a of selected){
        if(!a?.answers||!g.questions.every(q=>validAnswer(q,a.answers[q.id])))continue;
        const answers={};for(const q of g.questions)answers[q.id]=JSON.parse(JSON.stringify(a.answers[q.id]));
        const results=g.questions.map(q=>({id:q.id,...grade(q,answers[q.id])}));
        s.attempts.push({answers,results,submittedAt:Number(a.submittedAt)||0,...summary(results)});
      }
      s.attemptCount=Math.max(s.attempts.length,Math.min(10000,Number(old.attemptCount)||0));
      s.editing=old.editing!==false||!s.attempts.length;
      if(s.editing&&old.draft&&typeof old.draft==='object'){
        for(const q of g.questions){const a=old.draft[q.id];
          if(q.type==='order'&&Array.isArray(a)&&a.length<=q.tokens.length&&a.every(x=>Number.isInteger(x)&&x>=0&&x<q.tokens.length)&&new Set(a).size===a.length)s.draft[q.id]=[...a];
          else if(q.type==='translation'&&typeof a==='string')s.draft[q.id]=a.slice(0,240);
          else if(q.type==='choice'&&q.options.includes(a))s.draft[q.id]=a;
        }
      }
    }
    clean.selectedLessons=Array.isArray(raw.selectedLessons)?[...new Set(raw.selectedLessons.filter(x=>Number.isInteger(x)&&x>=1&&x<=15))]:[9];
    if(raw.words&&typeof raw.words==='object')for(const [key,w] of Object.entries(raw.words).slice(0,500)){
      if(key.length>400||!key.includes('|')||!w||typeof w!=='object')continue;
      clean.words[key]={known:!!w.known,step:Math.max(0,Math.min(4,Number(w.step)||0)),due:Math.max(0,Math.min(8640000000000000,Number(w.due)||0))};
    }
    return clean;
  }
  function mergedWords(lessons,ids){
    const map=new Map();
    for(const l of lessons.filter(x=>ids.includes(x.id)))for(const w of l.vocab){
      const key=[normalize(w.zh),normalize(w.py).toLowerCase(),String(w.vn).trim()].join('|');
      if(map.has(key))map.get(key).lessons.push(l.id);else map.set(key,{...w,key,lessons:[l.id]});
    }
    return [...map.values()];
  }
  function markWord(state,key,known,now=Date.now()){
    const previous=state.words[key]||{step:0};const step=known?Math.min(previous.step+1,4):0;
    state.words[key]={known,step,due:known?now+[1,3,7,14][Math.max(0,step-1)]*86400000:now};
  }
  return {normalize,empty,groupState,unlocked,validAnswer,grade,summary,submit,retry,totals,restore,mergedWords,markWord};
});
