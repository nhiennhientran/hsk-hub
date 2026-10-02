export type CourseId = 'hsk2-fltrp-2026' | 'hsk3-fltrp-2026';
export interface Copy { zh: string; vi: string }
export interface Source { pdfPage:number; printedPage:number; section:string; provenance:'textbook'|'supplemental' }
export interface Line extends Copy { id:string; speaker:string; py:string; source:Source }
export interface Word { id:string; zh:string; py:string; vi:string; pos:string; sourceText:number; audioTrack:string; source:Source }
export type Part = 'vocabGrammar'|'ordering'|'listening'|'translationChoice'|'writing';
export type Answer = number | number[] | string;
export interface Question { id:string; part:Part; prompt:Copy; stem?:string; options?:string[]; tokens?:string[]; answer?:number|number[]; audioTrack?:string; source:Source; focus:string; explanation?:Copy }
export interface Lesson {
 schemaVersion:1; courseId:CourseId; version:'2026.1'; number:number; id:string; title:Copy & {py:string};
 source:{startPdfPage:number;endPdfPage:number;startPrintedPage:number;endPrintedPage:number};
 reviewStatus:{sourceVisual:boolean;vietnamese:boolean;pinyin:boolean;reviewer:string;notes:string[]};
 objectives:(Copy & {id:string;source:Source})[];
 warmup:{id:string;title:Copy;items:Copy[];source:Source}[];
 texts:{id:string;number:number;title:Copy;context:Copy;audioTrack:string;lines:Line[];questions:(Copy & {id:string;options?:string[];answer?:number;source:Source})[];source:Source}[];
 vocabulary:Word[];
 grammar:{id:string;title:Copy;structure:string;explanation:Copy;examples:(Copy & {py:string;source:Source})[];practice:(Copy & {source:Source})[];source:Source}[];
 sections:{id:string;kind:'practice'|'activity'|'culture'|'tip'|'review'|'other';title:Copy;blocks:(Copy & {kind:string;items?:Copy[];source:Source})[];source:Source}[];
 homework:Question[];listening:Question[];
}
export interface CourseConfig {id:CourseId;level:2|3;version:'2026.1';count:number;grammarCounts:readonly number[];storageKey:string;legacyKeys:readonly string[];legacyURL:string;entry:string}
export interface Track {id:string;level:number;lesson:number;track:number;kind:'text'|'vocab';text:number;file:string;duration:number;bytes:number;sha256:string;decode:string;semanticVerification:string}
