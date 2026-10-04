import {createAudioService} from '../../../../hsk1-app/src/services/audio/index.ts';
class Audio extends EventTarget {
 src='';duration=NaN;readyState=0;playbackRate=1;defaultPlaybackRate=1;preservesPitch=false;muted=false;paused=true;seeking=false;mediaTime=0;
 get currentTime(){return this.mediaTime}
 set currentTime(v){this.mediaTime=v;this.seeking=true}
 emit(type){this.dispatchEvent(new Event(type))}
 play(){this.paused=false;return Promise.resolve()}
 pause(){this.paused=true;this.emit('pause')}
 load(){this.readyState=0;this.mediaTime=0;this.duration=NaN;this.seeking=false}
 removeAttribute(name){if(name==='src')this.src=''}
}
const results=[];
for(const duration of [NaN,Infinity,0,16.296]) {
 const audio=new Audio();const service=createAudioService({audio});
 const p=service.play({url:'3-7.mp3',label:'bounded original',start:.718,end:9.825,sourceKind:'segment'});
 audio.duration=duration;audio.readyState=2;audio.emit('loadedmetadata');audio.emit('playing');audio.seeking=false;audio.emit('seeked');
 const observation={duration:String(duration),status:service.snapshot().status,muted:audio.muted,time:audio.currentTime};
 service.stop();observation.result=await p;results.push(observation);service.dispose();
}
console.log(JSON.stringify({test:'bounded metadata usability',results},null,2));
