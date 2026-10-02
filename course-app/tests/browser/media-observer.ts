import type {Page,TestInfo} from '@playwright/test';
export async function observeNativeMedia(page:Page):Promise<void>{
 await page.addInitScript(()=>{
  const scope=window as unknown as {__hskNativeEvents:Record<string,unknown>[]};scope.__hskNativeEvents=[];
  const seen=new WeakSet<HTMLMediaElement>();const original=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){
   if(!seen.has(this)){seen.add(this);for(const event of ['loadstart','loadedmetadata','durationchange','loadeddata','canplay','play','playing','waiting','seeking','seeked','timeupdate','ended','error','pause'])this.addEventListener(event,()=>{scope.__hskNativeEvents.push({event,time:this.currentTime,duration:this.duration,ready:this.readyState,paused:this.paused,seeking:this.seeking,source:this.currentSrc,ui:document.querySelector<HTMLElement>('.player-bar')?.dataset.state});if(scope.__hskNativeEvents.length>200)scope.__hskNativeEvents.shift()})}
   return original.call(this);
  };
 });
}
export async function attachNativeMedia(page:Page,info:TestInfo):Promise<void>{
 const events=await page.evaluate(()=>(window as unknown as {__hskNativeEvents?:Record<string,unknown>[]}).__hskNativeEvents??[]).catch(()=>[]);
 if(events.length)await info.attach('actual-native-audio-events',{body:Buffer.from(JSON.stringify(events,null,2)),contentType:'application/json'});
}
