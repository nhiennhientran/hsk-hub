import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudioService} from '../src/services/audio/index.ts';
class Audio extends EventTarget {
 src='';duration=NaN;readyState=0;playbackRate=1;defaultPlaybackRate=1;preservesPitch=false;muted=false;paused=true;seeking=false;mediaTime=0;seekAssignments=[];pending=[];
 get currentTime(){return this.mediaTime}
 set currentTime(value){this.mediaTime=value;this.seekAssignments.push(value);this.seeking=true}
 emit(type){this.dispatchEvent(new Event(type))}
 play(){this.paused=false;return new Promise(resolve=>this.pending.push(resolve))}
 pause(){this.paused=true;this.emit('pause')}
 load(){this.readyState=0;this.mediaTime=0;this.duration=NaN;this.seeking=false}
 removeAttribute(name){if(name==='src')this.src=''}
}
function timers(){let now=0,id=0;const entries=new Map();return {entries,setTimer(fn,ms){const key=++id;entries.set(key,{fn,at:now+ms});return key},clearTimer(key){entries.delete(key)},advance(ms){const until=now+ms;let count=0;while(true){const next=[...entries].filter(([,x])=>x.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;if(++count>100)throw Error('Timer spin');now=next[1].at;entries.delete(next[0]);next[1].fn()}now=until}}}
const request={url:'original-3-7.mp3',label:'Source sentence1',start:.718,end:9.825,sourceKind:'segment'};
function setup(){const audio=new Audio(),clock=timers(),service=createAudioService({audio,setTimer:clock.setTimer,clearTimer:clock.clearTimer});return{audio,clock,service}}
test('bounded audio waits for usable duration and then validates the complete requested range',async()=>{
 for(const duration of [NaN,Infinity,-1]){
  const{audio,service}=setup();const pending=service.play(request);let settled=false;pending.then(()=>settled=true);
  audio.duration=duration;audio.readyState=2;audio.emit('loadedmetadata');audio.emit('playing');audio.seeking=false;audio.mediaTime=request.start;audio.emit('seeked');audio.emit('timeupdate');await Promise.resolve();
  assert.equal(audio.muted,true);assert.equal(service.snapshot().status,'loading');assert.equal(settled,false);
  audio.duration=16.296;audio.emit('durationchange');audio.mediaTime=request.start;audio.seeking=false;audio.emit('seeked');assert.equal((await pending).ok,true);assert.equal(audio.muted,false);service.dispose();
 }
 const{audio,service}=setup();const pending=service.play(request);audio.duration=Infinity;audio.readyState=2;audio.emit('playing');audio.duration=5;audio.emit('durationchange');assert.equal((await pending).ok,false);assert.equal(audio.muted,true);assert.equal(service.snapshot().status,'error');service.dispose();
});
test('bounded startup cannot unmute when usable duration disappears during its initial seek',async()=>{
 const{audio,service}=setup();const pending=service.play(request);audio.duration=16.296;audio.readyState=2;audio.emit('loadedmetadata');audio.emit('playing');audio.duration=NaN;audio.mediaTime=request.start;audio.seeking=false;audio.emit('seeked');
 assert.equal(audio.muted,true);assert.equal(service.snapshot().status,'loading');audio.duration=16.296;audio.emit('durationchange');assert.equal((await pending).ok,true);assert.equal(audio.muted,false);service.dispose();
});
test('initial unmute revalidates a silently refined duration at the settled seek',async()=>{
 for(const duration of [.5,5,9.8]){
  const{audio,service}=setup();const pending=service.play(request);audio.duration=16.296;audio.readyState=2;audio.emit('loadedmetadata');audio.emit('playing');audio.duration=duration;audio.mediaTime=request.start;audio.seeking=false;audio.emit('seeked');
  const result=await pending;assert.equal(result.ok,duration===9.8);assert.equal(audio.muted,duration!==9.8);assert.equal(service.snapshot().status,duration===9.8?'playing':'error');service.dispose();
 }
});
function realTracePrefix(a){
 // Replay native state observations 0..10 from WebKit CI 37196725810.
 a.readyState=4;a.duration=16.296;a.emit('durationchange');a.emit('loadedmetadata');a.emit('loadeddata');a.emit('canplay');a.emit('playing');a.pending.splice(0).forEach(resolve=>resolve());
 a.mediaTime=.003951848;a.readyState=2;a.seeking=false;a.emit('seeking');a.emit('waiting');a.emit('timeupdate');
}
test('observed WebKit seeked rollback cannot unmute or certify the file head',async()=>{
 const{audio,clock,service}=setup();const pending=service.play(request);let resolved=false;pending.then(()=>resolved=true);realTracePrefix(audio);audio.emit('seeked');
 assert.equal(audio.muted,true,'must remain muted when actual seeked clock is below requested start');assert.equal(service.snapshot().status,'loading');await Promise.resolve();assert.equal(resolved,false);
 // Native getter stabilizes on the next task without another seeked/playing event.
 audio.mediaTime=.719718416;clock.advance(0);assert.equal(audio.muted,false);assert.equal(service.snapshot().status,'playing');assert.equal((await pending).ok,true);service.dispose();
});
test('a still-wrong clock is re-seeked silently rather than waiting for a 250ms update',async()=>{
 const{audio,clock,service}=setup();const pending=service.play(request);realTracePrefix(audio);audio.emit('seeked');clock.advance(0);
 assert.equal(audio.muted,true);assert.equal(service.snapshot().status,'loading');assert.equal(audio.seekAssignments.at(-1),request.start);assert.equal(audio.seeking,true);
 audio.seeking=false;audio.mediaTime=request.start;audio.emit('seeked');assert.equal((await pending).ok,true);assert.equal(audio.muted,false);service.dispose();
});
test('a delayed recovery probe rewinds instead of silently dropping the first 250ms',async()=>{
 const{audio,clock,service}=setup();const pending=service.play(request);realTracePrefix(audio);audio.emit('seeked');audio.mediaTime=request.start+.25;clock.advance(0);
 assert.equal(audio.muted,true);assert.equal(audio.seekAssignments.at(-1),request.start);assert.equal(service.snapshot().status,'loading');audio.seeking=false;audio.mediaTime=request.start;audio.emit('seeked');assert.equal((await pending).ok,true);service.dispose();
});
test('stop and request replacement retire the pending position probe',async()=>{
 const{audio,clock,service}=setup();const old=service.play(request);realTracePrefix(audio);audio.emit('seeked');const callbacks=[...clock.entries.values()].map(x=>x.fn);service.stop();assert.equal((await old).code,'cancelled');const whole=service.play({url:'whole.mp3',label:'Whole original'});const seeks=audio.seekAssignments.length;callbacks.forEach(fn=>fn());assert.equal(audio.src,'whole.mp3');assert.equal(audio.muted,false);assert.equal(audio.seekAssignments.length,seeks);audio.duration=12;audio.readyState=4;audio.emit('loadedmetadata');audio.emit('playing');assert.equal((await whole).ok,true);service.dispose();
});
test('a paused startup cannot be revived by its queued position probe',async()=>{
 const{audio,clock,service}=setup();const pending=service.play(request);realTracePrefix(audio);audio.emit('seeked');service.pause();assert.equal((await pending).code,'cancelled');audio.mediaTime=.719;clock.advance(0);assert.equal(service.snapshot().status,'paused');assert.equal(audio.muted,true);service.dispose();
});
test('an out-of-range high clock stays silent and does not finish a never-started clip',async()=>{
 const{audio,clock,service}=setup();const pending=service.play(request);realTracePrefix(audio);audio.mediaTime=12;audio.emit('seeked');assert.equal(audio.muted,true);assert.equal(service.snapshot().status,'loading');clock.advance(0);assert.equal(audio.seekAssignments.at(-1),request.start);service.stop();assert.equal((await pending).code,'cancelled');service.dispose();
});
test('a corrective seek exception is a retryable failure, never unmuted playback',async()=>{
 const{audio,clock,service}=setup();const pending=service.play(request);realTracePrefix(audio);audio.emit('seeked');Object.defineProperty(audio,'currentTime',{get(){return .004},set(){throw new DOMException('Seek unavailable','InvalidStateError')}});clock.advance(0);const result=await pending;assert.equal(result.ok,false);assert.equal(result.code,'error');assert.equal(service.snapshot().status,'error');assert.equal(audio.muted,true);assert.equal(audio.paused,true);service.dispose();
});
test('persistent bad seek acknowledgments stop safely instead of a zero-delay spin',async()=>{
 const{audio,clock,service}=setup();const pending=service.play(request);realTracePrefix(audio);
 for(let i=0;i<3;i++){audio.mediaTime=.004;audio.seeking=false;audio.emit('seeked');clock.advance(0)}
 const result=await pending;assert.equal(result.ok,false);assert.equal(service.snapshot().status,'error');assert.equal(audio.muted,true);assert.equal(audio.paused,true);assert.equal(audio.seekAssignments.filter(x=>x===request.start).length,3);assert.equal(clock.entries.size,0);service.dispose();
});
test('the first seeked clock directly 250ms too high also remains silent and rewinds',async()=>{
 const{audio,clock,service}=setup();const pending=service.play(request);audio.readyState=4;audio.duration=16.296;audio.emit('loadedmetadata');audio.emit('playing');audio.mediaTime=request.start+.25;audio.seeking=false;audio.emit('seeked');assert.equal(audio.muted,true);assert.equal(service.snapshot().status,'loading');clock.advance(0);assert.equal(audio.seekAssignments.at(-1),request.start);audio.seeking=false;audio.mediaTime=request.start;audio.emit('seeked');assert.equal((await pending).ok,true);service.dispose();
});
test('five playback rates retain a genuinely started pause/resume clock without rewinding',async()=>{
 for(const rate of [.65,.75,1,1.25,1.5]){const{audio,service}=setup();service.setRate(rate);const pending=service.play(request);audio.readyState=4;audio.duration=16.296;audio.emit('loadedmetadata');audio.emit('playing');audio.seeking=false;audio.emit('seeked');assert.equal((await pending).ok,true);audio.mediaTime=3;audio.emit('timeupdate');service.pause();const seeks=audio.seekAssignments.length;const resumed=service.resume();audio.emit('playing');assert.equal((await resumed).ok,true);assert.equal(audio.currentTime,3);assert.equal(audio.seekAssignments.length,seeks);assert.equal(audio.playbackRate,rate);assert.equal(audio.preservesPitch,true);service.dispose()}
});
test('a retired probe cannot reposition the next track in the same playlist',async()=>{
 const{audio,clock,service}=setup();const pending=service.playSequence([request,{...request,start:12,end:15,label:'Second'}]);realTracePrefix(audio);audio.emit('seeked');const oldProbes=[...clock.entries.values()].filter(x=>x.at===0).map(x=>x.fn);audio.mediaTime=request.start;audio.emit('seeked');assert.equal((await pending).ok,true);audio.mediaTime=request.end;audio.emit('timeupdate');const seeks=audio.seekAssignments.length;oldProbes.forEach(fn=>fn());assert.equal(audio.seekAssignments.length,seeks);assert.equal(service.snapshot().index,2);assert.equal(service.snapshot().status,'loading');assert.equal(audio.muted,true);audio.emit('seeked');assert.equal(service.snapshot().status,'loading');audio.readyState=4;audio.duration=16.296;audio.emit('loadedmetadata');audio.emit('playing');audio.mediaTime=12;audio.seeking=false;audio.emit('seeked');assert.equal(service.snapshot().status,'playing');assert.equal(service.snapshot().currentTime,12);service.dispose();
});
test('corrective seek with no subsequent native events ends at the existing startup timeout',async()=>{
 const{audio,clock,service}=setup();const pending=service.play(request);realTracePrefix(audio);audio.emit('seeked');clock.advance(0);assert.equal(audio.muted,true);clock.advance(15000);assert.equal((await pending).ok,false);assert.equal(service.snapshot().status,'error');assert.equal(audio.paused,true);assert.equal(audio.muted,true);assert.equal(clock.entries.size,0);service.dispose();
});

test('explicit start 0 without end preserves whole-original zero-duration recovery',async()=>{const{audio,service}=setup();const pending=service.play({url:'whole.mp3',label:'Whole',start:0,sourceKind:'original'});audio.duration=0;audio.readyState=2;audio.emit('loadedmetadata');audio.emit('playing');audio.seeking=false;audio.mediaTime=.2;audio.emit('timeupdate');audio.mediaTime=.4;audio.emit('timeupdate');assert.equal(service.snapshot().status,'playing');assert.equal(audio.muted,false);assert.equal((await pending).ok,true);service.dispose()});
test('start 0 with a finite end is still bounded and cannot bypass usable metadata',async()=>{const{audio,service}=setup();const pending=service.play({url:'segment.mp3',label:'Bounded zero',start:0,end:2,sourceKind:'segment'});audio.duration=0;audio.readyState=2;audio.emit('playing');audio.seeking=false;audio.mediaTime=.2;audio.emit('timeupdate');audio.mediaTime=.4;audio.emit('timeupdate');assert.equal(audio.muted,true);assert.equal(service.snapshot().status,'loading');service.stop();assert.equal((await pending).code,'cancelled');service.dispose()});
test('explicit start 0 whole original keeps an already advancing clock when positive duration arrives',async()=>{
 const{audio,service}=setup();const pending=service.play({url:'whole.mp3',label:'Whole',start:0,sourceKind:'original'});audio.readyState=2;audio.duration=0;audio.emit('playing');audio.mediaTime=.2;audio.seeking=false;const seeks=audio.seekAssignments.length;audio.duration=12;audio.emit('durationchange');assert.equal((await pending).ok,true);assert.equal(audio.currentTime,.2);assert.equal(audio.seekAssignments.length,seeks);assert.equal(audio.muted,false);service.dispose();
});
