import raw from '../../../content/source-activities/lesson-04.json' with {type:'json'};
import l09 from '../../../content/source-activities/lesson-09.json' with {type:'json'};
import l10 from '../../../content/source-activities/lesson-10.json' with {type:'json'};
import l11 from '../../../content/source-activities/lesson-11.json' with {type:'json'};
import l12 from '../../../content/source-activities/lesson-12.json' with {type:'json'};
import l13 from '../../../content/source-activities/lesson-13.json' with {type:'json'};
import l14 from '../../../content/source-activities/lesson-14.json' with {type:'json'};
import l15 from '../../../content/source-activities/lesson-15.json' with {type:'json'};
export interface Copy { zh: string; vi: string }
export interface Source { sourceRevision: string; textbookSHA256: string; printedPage: number; pdfPage: number; section: string; ordinal: number; endOrdinal?: number; printedPages?: number[]; pdfPages?: number[] }
export interface SourceOption extends Copy { id: string; py: string }
export interface SourceField { id: string; label: Copy; input: 'select' | 'text' | 'textarea'; assessment: 'answer-key' | 'ungraded'; options?: SourceOption[]; answer?: string; answerSource?: { sha256: string; pdfPage: number; section?: string; ordinal?: number }; reference?: Copy; feedbackNote?: Copy; required?: false; source?: Source; referenceProvenance?: string }
export interface SourceTable { caption?: Copy; headerless?: true; columns: Copy[]; rows: {id: string; cells: {text?: Copy; fieldId?: string}[]; source?:Source}[] }
export interface SourceActivity { id: string; version: string; lesson: number; kind: string; source: Source; title: Copy; instruction: Copy; prompt: Copy; pinyin?: string; fields: SourceField[]; figure?: string; figureSHA256?: string; figures?: string[]; figureSHA256s?: Record<string,string>; table?: SourceTable; example?: Copy; audio?: {sceneId: string; track: string; plays: number; verifiedByListening: false} }
export interface SourceFigure { id: string; file: string; alt: Copy; source: { textbookSHA256: string; printedPage: number; pdfPage: number; cell: number|string; cropPdfPoints?: [number,number,number,number] }; kind: 'original-schematic'|'original-crop'; sha256: string; note: Copy }
export interface NumberCell {number?: number; zh: string; py?: string; vi?: string}
export interface SourceLesson {schema: 1; edition: string; lesson: number; version: string; textbookSHA256: string; answerBookSHA256: string; editorialStatus: string; activities: SourceActivity[]; figures: SourceFigure[]; numberTables?: { source: {printedPages:number[];pdfPages:number[]}; grid: (NumberCell|null)[][]; higher: NumberCell[]; two: NumberCell[] }; bonus?: {id:string;title:Copy;printedResourceId:string;printedPage:number;pdfPage:number;availability:'unavailable';payload:null} }
// A separate sidecar: BookLesson, textbook.json, homework IDs and grades remain unchanged.
export const sourceLesson = raw as SourceLesson;
/** Source-versioned static catalogue. Editorial acceptance is recorded separately. */
export const sourceLessons: readonly SourceLesson[] = [sourceLesson,l09,l10,l11,l12,l13,l14,l15] as SourceLesson[];
export const getSourceLesson = (lessonId:number):SourceLesson|undefined => sourceLessons.find(lesson=>lesson.lesson===lessonId);
export const sourceRecordKey = (activity: Pick<SourceActivity,'id'|'version'>) => activity.id + '@' + activity.version;
export const incompleteSourceFields = (activity:Pick<SourceActivity,'fields'>,values:Record<string,string>) => activity.fields.some(field=>field.required!==false&&!values[field.id]?.trim());
/** Crops have a fixed public directory. Imported records never provide asset paths. */
export function sourceFigureAssetPath(figure:SourceFigure):string|undefined {
  return figure.kind==='original-crop'&&/^figures\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:png|webp|jpg|jpeg)$/.test(figure.file)?'./source-activities/'+figure.file:undefined;
}
