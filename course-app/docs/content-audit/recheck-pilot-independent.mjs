import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url)).replace(/\/$/,'');
class Element {
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attributes={};this.listeners={};this.value='';this.className='';this.classList={add:(...xs)=>{this.className+=' '+xs.join(' ')},toggle:()=>{}}}
 set textContent(v){this._text=String(v);this.children=[]} get textContent(){return (this._text??'')+this.children.map(c=>c.textContent??String(c)).join('')}
 append(...xs){this.children.push(...xs);for(const x of xs)if(x&&typeof x==='object')x.parent=this}
 prepend(...xs){this.children.unshift(...xs)}
 replaceChildren(...xs){this.children=[];this._text='';this.append(...xs)}
 setAttribute(k,v){this.attributes[k]=v} getAttribute(k){return this.attributes[k]}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f)}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this)}
 focus(){} querySelector(){return null}
}
class Textarea extends Element{}
globalThis.HTMLTextAreaElement=Textarea;globalThis.document={createElement:t=>t==='textarea'?new Textarea(t):new Element(t)};globalThis.location={href:'https://example.com/new/hsk2/'};globalThis.window=new EventTarget();
const {mountLesson}=await import(root+'/course-app/src/lesson-view.ts');
const {mountListening}=await import(root+'/course-app/src/listening-view.ts');
const {blank,validateState}=await import(root+'/course-app/src/state.ts');
const {configs}=await import(root+'/course-app/src/config.ts');
const {parseRoute}=await import(root+'/course-app/src/router.ts');
const walk=n=>[n,...n.children.flatMap(c=>typeof c==='object'?walk(c):[])];
let results=[];
for(const level of [2,3]){
 let state=blank(configs[level]);const data=JSON.parse(fs.readFileSync(root+`/course-app/content/hsk${level}/lesson-01.json`));const seen=new Map(),pics=new Map();let listeningInstructions=0,roleplayInstructions=0,readAloudInstructions=0;
 for(const section of ['overview','vocab','text','grammar','practice','culture'])for(const scene of (section==='text'?[1,2,3,4]:[1])){
  const host=new Element('div');const dispose=mountLesson(host,data,{route:{view:'lesson',lesson:1,part:'vocabGrammar',level,section,scene},level,assetBase:'./',state:()=>structuredClone(state),edit:fn=>{fn(state);state=validateState(state,configs[level])},flush:async()=>true,audio:{speak:async()=>{}},audioControl:()=>new Element('div'),message:()=>{}});
  const nodes=walk(host),acts=nodes.filter(n=>n.dataset.activityId),images=nodes.filter(n=>n.dataset.illustrationId);
  for(const n of acts)seen.set(n.dataset.activityId,(seen.get(n.dataset.activityId)??0)+1);
  for(const n of images)pics.set(n.dataset.illustrationId,(pics.get(n.dataset.illustrationId)??0)+1);
  if(section==='text'){
    assert.ok(host.textContent.includes('先听2遍，再回答问题。'));assert.ok(host.textContent.includes('Nghe 2 lần rồi trả lời câu hỏi.'));listeningInstructions++;
    if(scene<4){assert.ok(host.textContent.includes('分角色朗读对话，读后回答问题。'));assert.ok(host.textContent.includes('Đọc hội thoại theo vai rồi trả lời câu hỏi.'));roleplayInstructions++;}
    else {assert.ok(host.textContent.includes('朗读课文，读后回答问题。'));readAloudInstructions++;}
  }
  dispose();
 }
 assert.equal(seen.size,data.activities.length);assert.ok([...seen.values()].every(n=>n===1));assert.equal(pics.size,data.illustrationManifest.length);assert.ok([...pics.values()].every(n=>n===1));
 results.push({level,activities:seen.size,illustrations:pics.size,allRenderedExactlyOnce:true,listeningInstructions,roleplayInstructions,readAloudInstructions});
 // Direct-call malformed scene also must render first text without throwing.
 const host=new Element('div');mountLesson(host,data,{route:{view:'lesson',lesson:1,part:'vocabGrammar',level,section:'text',scene:1.5},level,assetBase:'./',state:()=>structuredClone(state),edit:fn=>{fn(state)},flush:async()=>true,audio:{},audioControl:()=>new Element('div'),message:()=>{}});assert.ok(host.textContent.includes(data.texts[0].lines[0].zh));
}
assert.equal(parseRoute('#view=lesson&level=2&scene=1.5').scene,undefined);
const data=JSON.parse(fs.readFileSync(root+'/course-app/content/hsk2/lesson-01.json')),data2=JSON.parse(fs.readFileSync(root+'/course-app/content/hsk2/lesson-02.json'));let state=blank(configs[2]);const oldId=data.listening[0].id;state.listeningRound={selected:[1],limit:5,wrongOnly:false,queue:[oldId],index:0,answers:{},submitted:{},playCounts:{},startedAt:1};
const host=new Element('div'),pendingFlush=[];let editedCount=0;
const dispose=mountListening(host,[data,data2],{state:()=>structuredClone(state),edit:fn=>{const next=structuredClone(state);fn(next);state=validateState(next,configs[2]);editedCount++},flush:()=>new Promise(r=>pendingFlush.push(r)),play:async()=>true,stop:()=>{},message:()=>{}});
const findButton=(zh)=>walk(host).find(n=>n.tagName==='BUTTON'&&n.textContent.includes(zh));const click=button=>{for(const f of button.listeners.click??[])f()};
const staleSubmit=findButton('提交本题');const selections=walk(host).filter(n=>n.tagName==='INPUT'&&n.type==='checkbox');selections[0].checked=false;selections[0].onchange();selections[1].checked=true;selections[1].onchange();click(findButton('按当前设置'));
const activeId=state.listeningRound.queue[0];assert.ok(activeId.startsWith('hsk2-fltrp-2026:l02:'));assert.equal(walk(host).find(n=>n.tagName==='INPUT'&&n.type==='radio').name,activeId);assert.ok(!walk(host).some(n=>n.name===oldId));
click(staleSubmit);assert.equal(Object.keys(state.listeningRound.submitted).length,0);
const firstRadio=walk(host).find(n=>n.tagName==='INPUT'&&n.name===activeId);firstRadio.onchange();const submit=findButton('提交本题');click(submit);click(submit);assert.equal(state.listening[activeId+':individual'].submissions,1);assert.ok(findButton('提交本题').disabled);assert.ok(walk(host).filter(n=>n.type==='radio').every(n=>n.disabled));
for(const r of pendingFlush)r(false);for(let i=0;i<10;i++)await Promise.resolve();click(findButton('提交本题'));assert.equal(state.listening[activeId+':individual'].submissions,1);assert.equal(walk(host).find(n=>n.type==='radio').name,activeId);dispose();
// Execute the exact asynchronous load guard block from main.ts with controlled deferred input.
const source=fs.readFileSync(root+'/course-app/src/main.ts','utf8');const begin=source.indexOf('    const requestedConfig'),end=source.indexOf('    if (route.view === "courses") renderCourses();',begin);assert.ok(begin>=0&&end>begin);const block=source.slice(begin,end);
const factory=new Function('env',`let {config,route,available,loaded,generation,loadLesson,loadLexicon,loadSegments}=env;return {run:async(token)=>{${block}},switchLevel(next){config=next;generation++;loaded=[];},invalidate(){generation++},read(){return loaded}}`);
for(const mode of ['cross-level','same-level-newer-render','valid-load']){
 let resolve;const pending=new Promise(r=>resolve=r),conf=configs[2];const x=factory({config:conf,route:{view:'lesson',lesson:1},available:[1],loaded:[],generation:0,loadLesson:()=>pending,loadLexicon:async()=>{},loadSegments:async()=>{}});const running=x.run(0);if(mode==='cross-level')x.switchLevel(configs[3]);else if(mode==='same-level-newer-render')x.invalidate();resolve(data);await running;assert.equal(x.read().length,mode==='valid-load'?1:0);
}
const result={originalIndependentReviewCommit:'8c1ffbf1e2ab7241c936f8234bf07c9bf6084997',method:'Re-run of the independent minimal DOM test double and exact extracted load-guard block with controlled deferred promises; not a browser. Window event stub added by implementer for the resize listener, so this rerun is not a new independent review.',activities:results,sceneIntegerAndFallback:true,failedFlushReplacementRoundMatchesVisibleQuestion:true,staleRoundSubmitRejected:true,duplicateSubmitCount:state.listening[activeId+':individual'].submissions,asyncLoadGuard:{crossLevel:true,sameLevelNewerRender:true,validLoad:true}};
console.log(JSON.stringify(result,null,2));
