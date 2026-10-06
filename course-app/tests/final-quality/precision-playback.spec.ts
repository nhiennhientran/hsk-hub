import {test,expect,type Page,type Locator} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {canonicalPrecisionTrack,type PrecisionManifest,type PrecisionRow,type PrecisionAuthority} from '../../src/precision-contract.ts';
import {allReadingCompletedFixture} from './unlocked-fixtures.ts';

const repo=new URL('../../../',import.meta.url);
const read=(file:string)=>readFileSync(new URL(file,repo),'utf8');
const completed=allReadingCompletedFixture();
const h1=JSON.parse(read('hsk1-app/content/textbook.json')).lessons;
const lessons=[...Array.from({length:15},(_,i)=>[1,i+1]),...Array.from({length:15},(_,i)=>[2,i+1]),...Array.from({length:18},(_,i)=>[3,i+1])];
function manifest():PrecisionManifest {
  const text=read('course-app/content/audio-precision-20261006.json');
  const value=JSON.parse(text) as PrecisionManifest;
  const authority=JSON.parse(read('course-app/content/audio-precision-authority-20261006.json')) as PrecisionAuthority;
  expect(authority.status).toBe('accepted');expect(value.status).toBe('accepted');
  expect(createHash('sha256').update(text).digest('hex')).toBe(authority.manifestSHA256);
  return value;
}

test.beforeEach(async({page})=>{
  // Observe real native media elements. No fake play result, clock, media event,
  // duration or audio body is supplied by this observer.
  await page.addInitScript(values=>{
    sessionStorage.setItem('hsk_portal_unlocked_v2','1');
    for(const [key,value] of Object.entries(values))if(localStorage.getItem(key)===null)localStorage.setItem(key,value);
    const nativeAudio=window.Audio;
    const observed:{element:HTMLAudioElement;events:unknown[]}[]=[];
    (window as any).__finalQaNativeAudio=observed;
    window.Audio=new Proxy(nativeAudio,{construct(target,args){
      const element=Reflect.construct(target,args,target) as HTMLAudioElement;
      const record={element,events:[] as unknown[]};observed.push(record);
      for(const type of ['loadstart','loadedmetadata','seeking','seeked','playing','pause','ended','ratechange','timeupdate','error']){
        element.addEventListener(type,()=>{
          record.events.push({type,src:element.currentSrc||element.src,time:element.currentTime,duration:element.duration,paused:element.paused,muted:element.muted,rate:element.playbackRate});
          if(record.events.length>400)record.events.shift();
        });
      }
      return element;
    }});
  },completed);
});
async function ready(page:Page,level:number){
  await expect(page.locator('main h1').first()).toBeVisible();
  if(level===1)await expect(page.locator('main')).toHaveAttribute('data-module-state','ready');
  else {await expect(page.locator('.save-status')).toHaveAttribute('data-status',/^(empty|saved)$/);await expect(page.locator('.save-status')).toHaveAttribute('data-problem','false');}
}
function controls(page:Page,level:number){
  const panel=page.locator(level===1?'#audio-player':'.player-bar');
  return {panel,seek:panel.locator('input[type=range]'),rate:panel.locator('select'),
    pause:level===1?page.locator('#audio-pause'):panel.getByRole('button',{name:/^暂停/}),
    resume:level===1?page.locator('#audio-resume'):panel.getByRole('button',{name:/^继续/}),
    replay:level===1?page.locator('#audio-replay'):panel.getByRole('button',{name:/^重播/}),
    stop:level===1?page.locator('#audio-stop'):panel.getByRole('button',{name:/^停止/})};
}
function sourcePath(row:PrecisionRow){return '/'+canonicalPrecisionTrack(row.sourceTrack);}
async function native(page:Page){
  return page.evaluate(()=>((window as any).__finalQaNativeAudio??[]).map((r:any)=>({
    src:r.element.currentSrc||r.element.src,hasSource:r.element.hasAttribute('src'),
    time:r.element.currentTime,duration:Number.isFinite(r.element.duration)?r.element.duration:null,
    paused:r.element.paused,muted:r.element.muted,seeking:r.element.seeking,
    rate:r.element.playbackRate,defaultRate:r.element.defaultPlaybackRate,preservesPitch:r.element.preservesPitch,
    error:r.element.error?.code??null,events:r.events
  })));
}
function picks(level:number,lesson:number){
  const rows=manifest().records.filter(r=>r.level===level&&r.lesson===lesson);
  const book=level===1?h1.find((l:any)=>l.id===lesson):undefined;
  const wordRows=rows.filter(r=>r.unit==='word'&&(level!==1||book.vocab.some((w:any)=>w.catalogIds[0]===r.id)));
  const long=(a:PrecisionRow,b:PrecisionRow)=>(b.sourceSampleRange16k[1]-b.sourceSampleRange16k[0])-(a.sourceSampleRange16k[1]-a.sourceSampleRange16k[0]);
  const word=[...wordRows].sort(long)[0];
  const sentences=rows.filter(r=>r.unit==='sentence');
  // HSK1 exposes separate sentence controls on multi-sentence source lines;
  // its single-sentence line control has the independently accepted line row.
  const separate=sentences.filter(r=>level!==1||sentences.filter(s=>s.parentLineId===r.parentLineId).length>1);
  const sentence=[...(separate.length?separate:sentences)].sort(long)[0];
  expect(word,'Accepted visible word row').toBeTruthy();expect(sentence,'Accepted sentence row').toBeTruthy();
  return {rows,book,word,sentence};
}
async function openWord(page:Page,row:PrecisionRow,book:any):Promise<Locator>{
  await page.goto(`./#view=lesson&level=${row.level}&lesson=${row.lesson}&section=vocab`);await ready(page,row.level);
  if(row.level===1){
    const word=book.vocab.find((w:any)=>w.catalogIds[0]===row.id);
    return page.locator(`[data-vocab-audio="${word.id}"]`).first();
  }
  await page.locator(`.vocabulary-item[data-word-id="${row.id}"] .word-open`).click();
  const dialog=page.locator('.word-dialog');await expect(dialog).toBeVisible();
  return dialog.locator(`[data-audio-segment="${row.id}"]`);
}
async function openSentence(page:Page,row:PrecisionRow,rows:PrecisionRow[],book:any):Promise<{button:Locator;played:PrecisionRow}>{
  let scene:number;
  if(row.level===1)scene=book.scenes.findIndex((s:any)=>s.lines.some((l:any)=>l.id===row.parentLineId))+1;
  else {const raw=JSON.parse(read(`course-app/content/hsk${row.level}/lesson-${String(row.lesson).padStart(2,'0')}.json`));scene=raw.texts.find((t:any)=>t.lines.some((l:any)=>l.id===(row.parentLineId??row.id))).number;}
  await page.goto(`./#view=lesson&level=${row.level}&lesson=${row.lesson}&section=text&scene=${scene}`);await ready(page,row.level);
  const separate=row.level!==1||rows.filter(r=>r.unit==='sentence'&&r.parentLineId===row.parentLineId).length>1;
  const played=separate?row:rows.find(r=>r.unit==='line'&&r.id===row.parentLineId)!;expect(played).toBeTruthy();
  return {button:page.locator(separate?`[data-audio-segment="${row.id}"]`:`[data-line-audio="${row.parentLineId}"]`),played};
}
async function playBound(page:Page,button:Locator,row:PrecisionRow){
  await expect(button).toBeVisible();await expect(button).toBeEnabled();await button.click();
  const player=controls(page,row.level),start=row.sourceSampleRange16k[0]/16000,end=row.sourceSampleRange16k[1]/16000;
  await expect(player.panel).toHaveAttribute('data-state','playing',{timeout:15000});
  expect(Number(await player.seek.getAttribute('min'))).toBeCloseTo(start,7);
  expect(Number(await player.seek.getAttribute('max'))).toBeCloseTo(end,7);
  await expect.poll(async()=>{
    const rows=await native(page),active=rows.filter((x:any)=>!x.paused&&x.hasSource);
    return active.length===1&&new URL(active[0].src).pathname.endsWith(sourcePath(row))&&!active[0].muted&&!active[0].seeking&&active[0].time>=start-.025&&active[0].time<=end+.08&&active[0].error===null;
  },{timeout:10000,intervals:[20,40,80]}).toBe(true);
  return player;
}

for(const [level,lesson]of lessons)test(`HSK${level} L${lesson} actual native word and sentence buttons use accepted precision frames`,async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const {rows,book,word,sentence}=picks(level,lesson);
  const wordButton=await openWord(page,word,book);const first=await playBound(page,wordButton,word);
  // The shared player is outside the native modal. Close the detail normally
  // before using it, as a student must; closing detail preserves playback.
  if(level!==1)await page.locator('.word-dialog').getByRole('button',{name:/^关闭/}).click();
  await first.stop.click();
  await expect.poll(async()=>(await native(page)).every((a:any)=>a.paused&&!a.hasSource)).toBe(true);
  const next=await openSentence(page,sentence,rows,book);const second=await playBound(page,next.button,next.played);await second.stop.click();
  await expect.poll(async()=>(await native(page)).every((a:any)=>a.paused&&!a.hasSource)).toBe(true);
  expect(errors).toEqual([]);
  await info.attach('native-precision-button-evidence.json',{body:JSON.stringify({level,lesson,word:{id:word.id,sourceSampleRange16k:word.sourceSampleRange16k},sentence:{id:next.played.id,sourceSampleRange16k:next.played.sourceSampleRange16k},nativeAudio:await native(page),errors,samplingBoundary:'One visible word and one sentence/line control per lesson; all row source/frame completeness is independently verified by the precision authority.'}),contentType:'application/json'});
});

for(const level of [1,2,3])test(`HSK${level} native precision controls preserve rate, bounded seek, replay and navigation cancellation`,async({page},info)=>{
  const {rows,book,sentence}=picks(level,1),opened=await openSentence(page,sentence,rows,book),row=opened.played;
  const player=await playBound(page,opened.button,row);await player.pause.click();await expect(player.panel).toHaveAttribute('data-state','paused');
  for(const value of [.65,.75,1,1.25,1.5]){
    await player.rate.selectOption(String(value));
    const active=(await native(page)).find((a:any)=>a.hasSource);expect(active.rate).toBe(value);expect(active.defaultRate).toBe(value);expect(active.preservesPitch).toBe(true);expect(active.paused).toBe(true);
  }
  const start=row.sourceSampleRange16k[0]/16000,end=row.sourceSampleRange16k[1]/16000;
  await player.seek.focus();await player.seek.press('End');
  await expect.poll(async()=>{const a=(await native(page)).find((x:any)=>x.hasSource);return !a.seeking&&a.time<=end+.025&&a.time>=end-.11;}).toBe(true);
  await player.seek.press('Home');
  await expect.poll(async()=>{const a=(await native(page)).find((x:any)=>x.hasSource);return !a.seeking&&Math.abs(a.time-start)<.025;}).toBe(true);
  await player.seek.press('ArrowRight');
  await expect.poll(async()=>{const a=(await native(page)).find((x:any)=>x.hasSource);return !a.seeking&&a.time>=start+.075&&a.time<=start+.125;}).toBe(true);
  await player.rate.selectOption('0.65');await player.resume.click();await expect(player.panel).toHaveAttribute('data-state','playing');
  await player.pause.click();await expect(player.panel).toHaveAttribute('data-state','paused');await player.replay.click();
  await expect(player.panel).toHaveAttribute('data-state','playing');
  await expect.poll(async()=>{const a=(await native(page)).find((x:any)=>x.hasSource);return !a.paused&&!a.muted&&a.time>=start-.025&&a.time<start+.5;},{intervals:[20,40,80]}).toBe(true);
  await player.rate.selectOption('1.5');await player.seek.focus();await player.seek.press('End');
  await expect(player.panel).toHaveAttribute('data-state','ended');
  const ended=(await native(page)).find((a:any)=>a.hasSource);expect(ended.paused).toBe(true);expect(ended.time).toBeLessThanOrEqual(end+.15);
  await player.replay.click();await expect(player.panel).toHaveAttribute('data-state','playing');
  await page.goto(`./#view=courses&level=${level}`);await ready(page,level);
  await expect.poll(async()=>(await native(page)).every((a:any)=>a.paused&&!a.hasSource)).toBe(true);
  await info.attach('native-controls-and-cancel.json',{body:JSON.stringify({level,row:row.id,range:[start,end],rates:[.65,.75,1,1.25,1.5],keyboardSeek:true,pauseResumeReplay:true,boundedEndPaused:true,navigationCancelled:true,nativeAudio:await native(page)}),contentType:'application/json'});
});
