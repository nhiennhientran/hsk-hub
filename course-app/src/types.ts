export type CourseId = 'hsk2-fltrp-2026' | 'hsk3-fltrp-2026';
export interface Copy { zh: string; vi: string }
export interface Source { pdfPage:number; printedPage:number; section:string; provenance:'textbook'|'supplemental' }
export interface Line extends Copy { id:string; speaker:string; py:string; source:Source }
export interface Word { supplementarySyllabus?:boolean;appendixSource?:Source;id:string; zh:string; py:string; vi:string; pos:string; sourceText:number; audioTrack:string; source:Source }
export type Part = 'vocabGrammar'|'ordering'|'listening'|'translationChoice'|'writing';
export type Answer = number | number[] | string;
export interface Question { id:string; part:Part; prompt:Copy; stem?:string; options?:string[]; tokens?:string[]; answer?:number|number[]; audioTrack?:string; source:Source; focus:string; explanation?:Copy }
export interface Lesson {
 schemaVersion:1; courseId:CourseId; version:'2026.1'; number:number; id:string; title:Copy & {py:string};
 source:{startPdfPage:number;endPdfPage:number;startPrintedPage:number;endPrintedPage:number};
 reviewStatus:{sourceVisual:boolean;vietnamese:boolean;pinyin:boolean;reviewer:string;notes:string[]};
 objectives:(Copy & {id:string;source:Source})[];
 warmup:{id:string;title:Copy;items:(Copy & {source?:Source})[];source:Source}[];
 texts:{id:string;number:number;title:Copy;context:Copy;contextSource?:Source;audioTrack:string;lines:Line[];questions:(Copy & {id:string;options?:string[];answer?:number;editorialNote?:Copy & {source:Source};source:Source})[];source:Source}[];
 vocabulary:Word[];
 grammar:{id:string;title:Copy;structure:string;explanation:Copy;examples:(Copy & {py:string;source:Source})[];practice:(Copy & {source:Source})[];source:Source}[];
 sections:{id:string;kind:'practice'|'activity'|'culture'|'tip'|'review'|'other';title:Copy;blocks:(Copy & {kind:string;items?:Copy[];source:Source})[];source:Source}[];
 activities?:TextbookActivity[];illustrationManifest?:Illustration[];
 homework:Question[];listening:Question[];
}
export interface CourseConfig {id:CourseId;level:2|3;version:'2026.1';count:number;grammarCounts:readonly number[];storageKey:string;legacyKeys:readonly string[];legacyURL:string;entry:string}
export interface Track {id:string;level:number;lesson:number;track:number;kind:'text'|'vocab';text:number;file:string;duration:number;bytes:number;sha256:string;decode:string;semanticVerification:string}

export interface ActivityField {source?:Source;id:string;prompt:Copy;input:'text'|'textarea'|'select'|'checkbox';options?:Copy[];answer?:string|string[];assessment:'official'|'reference'|'open';answerSource?:{document:string;pdfPage:number;item:string};referenceAnswer?:Copy;illustrationId?:string}
export interface ActivityMatrix {rowHeading?:Copy;contextHeaders?:Copy[];columns:Copy[];rows:{prompt:Copy;contextCells?:Copy[];fieldIds:string[];cellLabels?:Copy[]}[]}
export interface TextbookActivity {matrix?:ActivityMatrix;audioTrack?:string;recommendedPlays?:number;id:string;kind:'choice'|'matching'|'fill'|'open'|'survey'|'self-assessment';title:Copy;source:Source;origin:'textbook';targetRef:string;fields:ActivityField[];illustrationIds?:string[];note?:Copy}
export interface Illustration {textbookRelation?:{owner:string;position?:number};id:string;kind:'original-crop'|'original-illustration';source:Source;alt:Copy;description:Copy;file?:string;publicationStatus:string;sceneKey?:string;originalTextbookImage?:boolean}
