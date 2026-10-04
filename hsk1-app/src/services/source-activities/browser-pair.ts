import type { LearningSession, LearningStore } from '../learning/session.ts';
import { createHSK1Pair, type HSK1Pair } from './paired.ts';
import { getSourceSession } from './store.ts';
const instances = new WeakMap<LearningStore, HSK1Pair>();
let composing = false, bound = false;
export function browserHSK1Pair(primary: LearningSession): HSK1Pair {
  if (!bound) {
    bound = true;
    document.addEventListener('compositionstart', () => {
      composing = true;
    }, true);
    document.addEventListener('compositionend', () => {
      composing = false;
    }, true);
  }
  let pair=instances.get(primary.store);
  if (!pair) {
    const source=getSourceSession();
    pair=createHSK1Pair({
      primary:primary.store,source:source.store,       storage:{
        getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)
      },       lock:navigator.locks ? (name,task)=>navigator.locks.request(name,task) : undefined,       isComposing:()=>composing||source.isComposing()
    });
    instances.set(primary.store,pair);
  }
  return pair;
}
/** Flush both domains before constructing any preview; never hide IME or failed saves. */ export async function prepareHSK1Pair(primary:LearningSession):Promise<boolean> {
  const source=getSourceSession();
  if(composing||source.isComposing()||primary.prepareExit())return false;
  if(!(await primary.flush()).ok)return false;
  if(source.store.snapshot().hasUnsavedChanges&&!(await source.flush()).ok)return false;
  return !primary.store.snapshot().hasUnsavedChanges&&!source.store.snapshot().hasUnsavedChanges;
}
