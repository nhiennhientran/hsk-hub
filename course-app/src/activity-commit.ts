import type {createLearningStore,ActivityRecord} from './state.ts';
type Store=Pick<ReturnType<typeof createLearningStore>,'snapshot'|'saveCandidate'>;
/** Never place an unconfirmed submission marker in the live draft. */
export async function commitCourseActivity(store:Store,id:string,values:ActivityRecord['values'],checkedAt:number,signal:AbortSignal,isComposing:()=>boolean=()=>false):Promise<boolean>{
 if(signal.aborted||isComposing())return false;
 const candidate=store.snapshot().data,current=candidate.activities[id];
 const previous=current?.values??{};
 if(Object.keys(previous).length!==Object.keys(values).length||Object.entries(values).some(([key,value])=>previous[key]!==value))return false;
 candidate.activities[id]={values:{...values},checkedAt,updatedAt:checkedAt};
 try{return (await store.saveCandidate(candidate,signal)).ok;}catch{return false;}
}
