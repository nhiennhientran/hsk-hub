import { createStore, type StoragePort } from '../storage/index.ts';
import { blankSourceData, validateSourceData, editSourceDraft } from './state.ts';
import type { SourceActivity } from './content.ts';
export const SOURCE_STORAGE_KEY='ran_hsk1_textbook_source_v1';
export const SOURCE_WRITE_LOCK='ran-hsk1-textbook-source-write';
export const SOURCE_APP_ID='hsk1-textbook-source';
export const SOURCE_BACKUP_ID='hsk1-textbook-source-backup';
export const SOURCE_JOURNAL_KEY='ran_hsk1_source_pair_journal_v1';
export function createSourceStore(options:{storage:StoragePort;lock?:<R>(task:()=>R|Promise<R>)=>Promise<R>;now?:()=>number}) {
  // Fail closed before source mutations whenever a paired recovery is unresolved.
  const guarded=options.lock ? <R>(task:()=>R|Promise<R>)=>options.lock!(async()=>{
    if(options.storage.getItem(SOURCE_JOURNAL_KEY)!==null)throw Error('待恢复的双域操作 · Có thao tác hai miền cần khôi phục');
    return task();
  }) : undefined;
  const store=createStore({storage:options.storage,lock:guarded,now:options.now,storageKey:SOURCE_STORAGE_KEY,appId:SOURCE_APP_ID,backupAppId:SOURCE_BACKUP_ID,blank:blankSourceData,validate:validateSourceData});
  return {...store,pendingRecovery(): 'none'|'pending'|'unreadable' {try{return options.storage.getItem(SOURCE_JOURNAL_KEY)===null?'none':'pending';}catch{return 'unreadable';}}};
}
export type SourceStore=ReturnType<typeof createSourceStore>;
export function createSourceSession(store:SourceStore,now:()=>number=Date.now){
  let timer:ReturnType<typeof setTimeout>|undefined;
  const composing=new Set<string>();
  const flush=async()=>{if(timer)clearTimeout(timer);timer=undefined;return store.save();};
  return {store,flush,
    setComposing(id:string,value:boolean){if(value)composing.add(id);else composing.delete(id);},
    isComposing:()=>composing.size>0,
    edit(activity:SourceActivity,values:Record<string,string>,composing=false){store.edit(data=>editSourceDraft(data,activity,values,now()));if(timer)clearTimeout(timer);timer=undefined;if(!composing)timer=setTimeout(()=>{timer=undefined;void store.save();},350);},
    async submit(activity:SourceActivity,values:Record<string,string>,signal?:AbortSignal){
      if(activity.fields.some(f=>!values[f.id]?.trim()))return {ok:false,code:'incomplete',submissionId:null};
      if(timer)clearTimeout(timer);timer=undefined;
      const at=now(),previous=store.snapshot().data.records[activity.id+'@'+activity.version],id=`submission-${at}-${(previous?.history.length??0)+1}`;
      store.edit(data=>editSourceDraft(data,activity,values,at));
      const candidate=store.snapshot().data;candidate.records[activity.id+'@'+activity.version].history.push({id,at,values:{...values}});
      const result=await store.saveCandidate(candidate,signal);return {...result,submissionId:result.ok?id:null};
    },
    dispose(){if(timer)clearTimeout(timer);timer=undefined;store.dispose();},
  };
}
export type SourceSession=ReturnType<typeof createSourceSession>;
let browserSession:SourceSession|undefined;
/** One page-lifetime session: navigating away cannot discard a failed/queued source draft. */
export function getSourceSession():SourceSession {
  if(!browserSession){
    const storage:StoragePort={getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)};
    const lock=navigator.locks ? <R>(task:()=>R|Promise<R>)=>navigator.locks.request(SOURCE_WRITE_LOCK,task) : undefined;
    browserSession=createSourceSession(createSourceStore({storage,lock}));
    window.addEventListener('storage',e=>{if(e.key===SOURCE_STORAGE_KEY||e.key===null)browserSession?.store.observeExternalChange();});
    window.addEventListener('beforeunload',e=>{if(browserSession?.store.snapshot().hasUnsavedChanges){e.preventDefault();e.returnValue='';}});
  }
  return browserSession;
}
