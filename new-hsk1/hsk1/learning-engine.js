/* Learning state is separate from the legacy reading/self-assessment records. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HSKLearnEngine=api;})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const KEY='ran_hsk1_learning_v2';
  const KINDS=['choice','sort','translation','listening'];
  const PATH=['choice','sort','translation'];
  const copy=value=>JSON.parse(JSON.stringify(value));
  const normal=value=>String(value??'').normalize('NFKC').replace(/[\s，。！？,.!?；;：:、"“”‘’]/gu,'');
  function blank(){return {schema:2,lessons:{},words:{},questionReviews:{},preferences:{},updatedAt:null};}
  function group(state,lesson,kind){
    if(!KINDS.includes(kind)||!Number.isInteger(Number(lesson))||lesson<1||lesson>15)throw new Error('Nhóm bài không hợp lệ.');
    state.lessons[lesson]??={};
    return state.lessons[lesson][kind]??={draft:{},orders:{},first:null,attempt:null,corrections:{},completed:false,history:[]};
  }
  function isAnswered(q,value){
    if(q.kind==='sort')return Array.isArray(value)&&value.length===q.tokens.length&&new Set(value).size===q.tokens.length&&value.every(n=>Number.isInteger(n)&&n>=0&&n<q.tokens.length);
    return Number.isInteger(value)&&value>=0&&value<q.options.length;
  }
  function check(q,value){
    if(!isAnswered(q,value))return false;
    if(q.kind==='sort'){const sentence=value.map(i=>q.tokens[i]).join('');return q.answers.some(a=>normal(a)===normal(sentence));}
    return value===q.answer;
  }
  function canOpen(state,lesson,kind){
    if(kind==='listening'||kind==='choice')return true;
    const i=PATH.indexOf(kind);return i>0&&PATH.slice(0,i).every(k=>state.lessons[lesson]?.[k]?.completed===true);
  }
  function remember(state,q,correct,now,lesson){
    const old=state.questionReviews[q.id]||{streak:0,attempts:0,mistakes:0};
    const streak=correct?old.streak+1:0,days=correct?[1,3,7,14][Math.min(streak-1,3)]:0;
    state.questionReviews[q.id]={...old,lesson:Number(lesson),kind:q.kind,streak,attempts:old.attempts+1,mistakes:old.mistakes+(correct?0:1),lastCorrect:correct,lastAt:now,dueAt:now+days*86400000};
  }
  function submit(state,lesson,kind,questions,now=Date.now()){
    if(!canOpen(state,lesson,kind))return {ok:false,reason:'locked'};
    const g=group(state,lesson,kind);
    if(g.attempt)return {ok:false,reason:'submitted'};
    const missing=questions.filter(q=>!isAnswered(q,g.draft[q.id])).map(q=>q.id);
    if(missing.length)return {ok:false,reason:'missing',missing};
    const results=Object.fromEntries(questions.map(q=>[q.id,check(q,g.draft[q.id])])),correct=Object.values(results).filter(Boolean).length;
    const attempt={answers:copy(g.draft),results,correct,total:questions.length,at:now};
    g.attempt=attempt;if(!g.first)g.first=copy(attempt);
    g.history.push({correct,total:questions.length,at:now});g.history=g.history.slice(-20);
    g.corrections={};if(correct===questions.length)g.completed=true;
    questions.forEach(q=>remember(state,q,results[q.id],now,lesson));
    return {ok:true,correct,total:questions.length,completed:g.completed};
  }
  function correct(state,lesson,kind,questions){
    if(!canOpen(state,lesson,kind))return {ok:false,reason:'locked'};
    const g=group(state,lesson,kind);if(!g.attempt)return {ok:false,reason:'not-submitted'};
    questions.forEach(q=>{if(!g.attempt.results[q.id]&&check(q,g.draft[q.id]))g.corrections[q.id]=true;});
    const remaining=questions.filter(q=>!g.attempt.results[q.id]&&!g.corrections[q.id]).map(q=>q.id);
    if(!remaining.length)g.completed=true;
    return {ok:true,remaining,completed:g.completed};
  }
  function restart(state,lesson,kind){const g=group(state,lesson,kind);g.draft={};g.orders={};g.attempt=null;g.corrections={};return g;}
  function totals(state,lesson){
    let correct=0,answered=0,completed=0;
    KINDS.forEach(k=>{const g=state.lessons[lesson]?.[k];if(g?.first){correct+=g.first.correct;answered+=g.first.total;}if(g?.completed)completed++;});
    return {correct,answered,total:20,completed,done:completed===4};
  }
  function validateImport(input,bank){
    if(!input||input.schema!==2||typeof input.lessons!=='object'||!input.lessons||Array.isArray(input.lessons))throw new Error('Tệp không phải bản sao lưu học tập HSK 1 phiên bản này.');
    const state=blank(),lookup=new Map(bank.flatMap(L=>KINDS.flatMap(k=>L[k].map(q=>[q.id,q]))));
    for(const [id,row] of Object.entries(input.lessons)){
      if(!/^([1-9]|1[0-5])$/.test(id)||!row||typeof row!=='object')throw new Error('Dữ liệu bài học không hợp lệ.');
      for(const [kind,g] of Object.entries(row)){
        if(!KINDS.includes(kind)||!g||typeof g!=='object')throw new Error('Dữ liệu nhóm bài không hợp lệ.');
        const target=group(state,Number(id),kind),qs=bank.find(x=>x.lesson===Number(id))[kind];
        for(const [qid,v] of Object.entries(g.draft||{})){
          const q=qs.find(q=>q.id===qid);if(!q)throw new Error('Câu hỏi không thuộc bài.');
          if(q.kind==='sort'){if(!Array.isArray(v)||new Set(v).size!==v.length||v.some(n=>!Number.isInteger(n)||n<0||n>=q.tokens.length))throw new Error('Thứ tự từ không hợp lệ.');}
          else if(!isAnswered(q,v))throw new Error('Lựa chọn không hợp lệ.');target.draft[qid]=v;
        }
        target.orders={};target.completed=g.completed===true;
        for(const which of ['first','attempt'])if(g[which]){
          const a=g[which];if(!a.answers||!qs.every(q=>isAnswered(q,a.answers[q.id])))throw new Error('Lần nộp bài không đầy đủ.');
          const results=Object.fromEntries(qs.map(q=>[q.id,check(q,a.answers[q.id])]));target[which]={answers:copy(a.answers),results,correct:Object.values(results).filter(Boolean).length,total:5,at:Number(a.at)||Date.now()};
        }
        target.corrections={};for(const q of qs)if(g.corrections?.[q.id]===true&&check(q,target.draft[q.id]))target.corrections[q.id]=true;
        if(target.completed&&!target.first)throw new Error('Thiếu kết quả lần đầu.');
        target.history=Array.isArray(g.history)?g.history.filter(h=>h&&Number.isInteger(h.correct)&&h.correct>=0&&h.correct<=5&&h.total===5&&Number.isFinite(h.at)).slice(-20):[];
      }
    }
    for(const [id,row] of Object.entries(state.lessons))for(const kind of PATH)if(row[kind]?.first&&!canOpen(state,Number(id),kind))throw new Error('Thứ tự hoàn thành các nhóm bài không hợp lệ.');
    for(const [key,v] of Object.entries(input.words||{}))if(key!=='__proto__'&&key!=='constructor'&&v&&typeof v==='object')state.words[key]=copy(v);
    for(const [key,v] of Object.entries(input.questionReviews||{}))if(lookup.has(key)&&v&&typeof v==='object'&&Number.isFinite(v.dueAt))state.questionReviews[key]=copy(v);
    if(input.preferences&&typeof input.preferences==='object'&&!Array.isArray(input.preferences))state.preferences=copy(input.preferences);
    state.updatedAt=Date.now();return state;
  }
  return {KEY,KINDS,PATH,blank,group,isAnswered,check,canOpen,submit,correct,restart,totals,remember,validateImport,normal};
});
