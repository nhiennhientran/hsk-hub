import type {Lexicon} from './lexicon.ts';
import type {CourseConfig,Lesson,Track} from './types.ts';
const modules=import.meta.glob('../content/hsk*/lesson-*.json');
const mediaModules=import.meta.glob('../content/audio-manifest.json',{eager:true,import:'default'});
export const tracks:readonly Track[]=(Object.values(mediaModules)[0] as {tracks:Track[]}|undefined)?.tracks??[];
export function availableLessons(config:CourseConfig):number[]{return Array.from({length:config.count},(_,i)=>i+1).filter(n=>`../content/hsk${config.level}/lesson-${String(n).padStart(2,'0')}.json` in modules)}
export async function loadLesson(config:CourseConfig,number:number):Promise<Lesson>{const fn=modules[`../content/hsk${config.level}/lesson-${String(number).padStart(2,'0')}.json`];if(!fn)throw new Error('本课整理中 · Bài học đang được biên soạn');const l=(await fn() as {default:Lesson}).default;if(l.courseId!==config.id||l.version!==config.version||l.number!==number)throw new Error('课程来源不匹配 · Nguồn bài học không khớp');return l}
export function trackFor(config:CourseConfig,id:string):Track{const result=tracks.find(t=>t.level===config.level&&`${t.lesson}-${t.track}`===id);if(!result)throw new Error('原音未找到 · Không tìm thấy âm thanh gốc');return result}

const lexiconModules=import.meta.glob('../content/hsk*-lexicon.json');
const lexicons=new Map<number,Lexicon>();
export async function loadLexicon(config:CourseConfig):Promise<Lexicon>{const cached=lexicons.get(config.level);if(cached)return cached;const fn=lexiconModules[`../content/hsk${config.level}-lexicon.json`];if(!fn)throw Error('Canonical lexicon missing');const l=(await fn() as {default:Lexicon}).default;if(l.courseId!==config.id||l.version!==config.version)throw Error('Canonical lexicon identity mismatch');lexicons.set(config.level,l);return l}
export function lexiconFor(config:CourseConfig):Lexicon{const l=lexicons.get(config.level);if(!l)throw Error('Canonical lexicon not loaded');return l}

import courseIndex from '../content/course-index.json';
export function lessonSummaries(config:CourseConfig){return courseIndex.filter(l=>l.level===config.level)}
