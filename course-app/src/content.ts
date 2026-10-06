import type {Lexicon} from './lexicon.ts';
import type {CourseConfig,Lesson,Track} from './types.ts';
import {appendReviewedTranslationChoices,validateTranslationChoiceOverlay,type ReviewedDistractors} from './translation-choice-overlay.ts';
import {baselineViDisplayRevision,projectCourseIndex,projectLesson,projectLexicon,validateTrustedViRegistry,viSHA256,
 type CourseSummary,type ValidatedViRevisionRegistry} from './official-vi-revisions.ts';

const modules=import.meta.glob('../content/hsk*/lesson-*.json',{query:'?raw',import:'default'});
const lexiconModules=import.meta.glob('../content/hsk*-lexicon.json',{query:'?raw',import:'default'});
const revisionAssets=import.meta.glob(['../content/*official-vi*.json','!../content/official-vi-registry.json'],{query:'?raw',import:'default'});
const registryModules=import.meta.glob('../content/official-vi-registry.json',{query:'?raw',import:'default',eager:true});
const indexModules=import.meta.glob('../content/course-index.json',{query:'?raw',import:'default'});
const mediaModules=import.meta.glob('../content/audio-manifest.json',{eager:true,import:'default'});
const distractorModules=import.meta.glob('../content/translation-choice-distractors-20261006.json',{query:'?raw',import:'default',eager:true});
const distractorReviews=import.meta.glob('../docs/final-quality-20261006/qa/abcd-distractor-independent-review.json',{query:'?raw',import:'default',eager:true});
let reviewedDistractors:Promise<ReviewedDistractors>|undefined;
function loadReviewedDistractors(){return reviewedDistractors??=validateTranslationChoiceOverlay(String(Object.values(distractorModules)[0]),String(Object.values(distractorReviews)[0]));}
export const tracks:readonly Track[]=(Object.values(mediaModules)[0] as {tracks:Track[]}|undefined)?.tracks??[];

interface ActiveViEntry {manifestFile:string;manifestSHA256:string;reviewFile:string;reviewSHA256:string}
interface RawDocument {rawText:string;sourceSHA256:string;value:unknown}
const rawDocuments=new Map<string,Promise<RawDocument>>();
const revisionRegistries=new Map<string,Promise<ValidatedViRevisionRegistry|null>>();
const projectedLessons=new Map<string,Lesson>();
const projectedLexicons=new Map<string,Lexicon>();
const loadedLexicons=new Map<string,Lexicon>();
const readySummaries=new Map<string,CourseSummary[]>();
const object=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const sha=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const knownFile=(file:string)=>file.startsWith('course-app/content/')&&!file.includes('..')&&/^[A-Za-z0-9_./-]+\.json$/.test(file);
function registryEntry(config:CourseConfig):ActiveViEntry|null {
 const raw=Object.values(registryModules)[0];
 if(typeof raw!=='string')throw Error('Official VI active registry missing');
 const index:unknown=JSON.parse(raw);
 if(!object(index)||index.schemaVersion!==1||!object(index.courses)||Object.keys(index.courses).sort().join(',')!=='hsk2,hsk3')throw Error('Invalid official VI active registry');
 const entry=index.courses[`hsk${config.level}`];if(entry===null)return null;
 if(!object(entry)||Object.keys(entry).sort().join(',')!=='manifestFile,manifestSHA256,reviewFile,reviewSHA256'||
  typeof entry.manifestFile!=='string'||typeof entry.reviewFile!=='string'||!sha(entry.manifestSHA256)||!sha(entry.reviewSHA256))throw Error('Invalid official VI active registration');
 return entry as unknown as ActiveViEntry;
}
/** Call after prepareViCourse/loadLesson has validated the active registration. */
export function hasActiveViDisplay(config:CourseConfig):boolean {return registryEntry(config)!==null;}
async function registeredAsset(file:string):Promise<string>{
 if(!/^course-app\/content\/[A-Za-z0-9_.-]*official-vi[A-Za-z0-9_.-]*\.json$/.test(file))throw Error('Unregistered official VI asset path');
 const fn=revisionAssets[file.replace('course-app/content/','../content/')];
 if(!fn)throw Error('Active official VI asset missing: '+file);
 const text=await fn();if(typeof text!=='string')throw Error('Active official VI asset is not raw JSON');return text;
}
async function rawDocument(file:string):Promise<RawDocument>{
 if(!knownFile(file))throw Error('Unknown raw course content file');
 let pending=rawDocuments.get(file);if(pending)return pending;
 const key=file.replace('course-app/content/','../content/'),fn=modules[key]??lexiconModules[key]??indexModules[key];
 if(!fn)throw Error('Raw course source missing: '+file);
 pending=(async()=>{const rawText=await fn();if(typeof rawText!=='string')throw Error('Raw course source is not JSON text');
  return {rawText,sourceSHA256:await viSHA256(rawText),value:JSON.parse(rawText) as unknown};})();
 rawDocuments.set(file,pending);
 try{return await pending}catch(error){rawDocuments.delete(file);throw error}
}
/** Explicit null stays inactive. Active registrations must load all declared trusted bytes. */
export async function loadViRevisions(config:CourseConfig):Promise<ValidatedViRevisionRegistry|null>{
 const entry=registryEntry(config),key=config.id+'|'+(entry?JSON.stringify(entry):'inactive');
 let pending=revisionRegistries.get(key);if(pending)return pending;
 pending=(async()=>{
  if(!entry)return null;
  const [manifestText,reviewText]=await Promise.all([registeredAsset(entry.manifestFile),registeredAsset(entry.reviewFile)]);
  if(await viSHA256(manifestText)!==entry.manifestSHA256||await viSHA256(reviewText)!==entry.reviewSHA256)throw Error('Active official VI asset checksum mismatch');
  const manifest:unknown=JSON.parse(manifestText);
  if(!object(manifest)||!Array.isArray(manifest.baselineFiles))throw Error('Invalid official VI baseline registry');
  const documents=await Promise.all(manifest.baselineFiles.map(async value=>{
   if(!object(value)||typeof value.file!=='string')throw Error('Invalid official VI baseline file');
   const raw=await rawDocument(value.file);return {file:value.file,rawText:raw.rawText};
  }));
  return validateTrustedViRegistry({courseId:config.id,parentDisplayRevision:baselineViDisplayRevision(config.id),
   manifestText,manifestSHA256:entry.manifestSHA256,reviewText,reviewSHA256:entry.reviewSHA256,reviewFile:entry.reviewFile,documents});
 })();
 revisionRegistries.set(key,pending);
 try{return await pending}catch(error){revisionRegistries.delete(key);throw error}
}
export function availableLessons(config:CourseConfig):number[]{return Array.from({length:config.count},(_,i)=>i+1).filter(n=>`../content/hsk${config.level}/lesson-${String(n).padStart(2,'0')}.json` in modules)}
export async function loadLesson(config:CourseConfig,number:number):Promise<Lesson>{
 const file=`course-app/content/hsk${config.level}/lesson-${String(number).padStart(2,'0')}.json`;
 const [raw,registry,overlay]=await Promise.all([rawDocument(file),loadViRevisions(config),loadReviewedDistractors()]),l=raw.value as Lesson;
 if(l.courseId!==config.id||l.version!==config.version||l.number!==number)throw Error('课程来源不匹配 · Nguồn bài học không khớp');
 const key=config.id+'|'+raw.sourceSHA256+'|'+(registry?registry.revisionId+'|'+registry.manifestSHA256:'baseline');
 let value=projectedLessons.get(key);if(!value){value=appendReviewedTranslationChoices(projectLesson(l,{baselineFile:file,sourceSHA256:raw.sourceSHA256},registry),overlay);projectedLessons.set(key,value)}
 return structuredClone(value);
}
export function trackFor(config:CourseConfig,id:string):Track{const result=tracks.find(t=>t.level===config.level&&`${t.lesson}-${t.track}`===id);if(!result)throw Error('原音未找到 · Không tìm thấy âm thanh gốc');return result}
export async function loadLexicon(config:CourseConfig):Promise<Lexicon>{
 const file=`course-app/content/hsk${config.level}-lexicon.json`,[raw,registry]=await Promise.all([rawDocument(file),loadViRevisions(config)]),l=raw.value as Lexicon;
 if(l.courseId!==config.id||l.version!==config.version)throw Error('Canonical lexicon identity mismatch');
 const key=config.id+'|'+raw.sourceSHA256+'|'+(registry?registry.revisionId+'|'+registry.manifestSHA256:'baseline');
 let value=projectedLexicons.get(key);if(!value){value=projectLexicon(l,{baselineFile:file,sourceSHA256:raw.sourceSHA256},registry);projectedLexicons.set(key,value)}
 loadedLexicons.set(config.id,value);return structuredClone(value);
}
export function lexiconFor(config:CourseConfig):Lexicon{const value=loadedLexicons.get(config.id);if(!value)throw Error('Canonical lexicon not loaded');return structuredClone(value)}
/** Course/progress summaries are an independent actual title consumer. */
export async function prepareViCourse(config:CourseConfig):Promise<void>{
 const file='course-app/content/course-index.json',[raw,registry]=await Promise.all([rawDocument(file),loadViRevisions(config)]);
 const value=projectCourseIndex(raw.value as CourseSummary[],{baselineFile:file,sourceSHA256:raw.sourceSHA256},registry);
 readySummaries.set(config.id,value);
}
export function lessonSummaries(config:CourseConfig):CourseSummary[]{const value=readySummaries.get(config.id);if(!value)throw Error('Current course summaries not prepared');return structuredClone(value.filter(l=>l.level===config.level))}
