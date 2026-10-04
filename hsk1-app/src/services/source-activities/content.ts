import raw from '../../../content/source-activities/lesson-04.json' with {type:'json'};
export interface Copy { zh: string; vi: string }
export interface Source { sourceRevision: string; textbookSHA256: string; printedPage: number; pdfPage: number; section: string; ordinal: number }
export interface SourceOption extends Copy { id: string; py: string }
export interface SourceField { id: string; label: Copy; input: 'select' | 'text' | 'textarea'; assessment: 'answer-key' | 'ungraded'; options?: SourceOption[]; answer?: string; answerSource?: { sha256: string; pdfPage: number }; reference?: Copy; feedbackNote?: Copy }
export interface SourceActivity { id: string; version: string; lesson: number; kind: string; source: Source; title: Copy; instruction: Copy; prompt: Copy; pinyin?: string; fields: SourceField[]; figure?: string; figureSHA256?: string; example?: Copy; audio?: {sceneId: string; track: string; plays: number; verifiedByListening: false} }
export interface SourceFigure { id: string; file: string; alt: Copy; source: { textbookSHA256: string; printedPage: number; pdfPage: number; cell: number }; kind: 'original-schematic'; sha256: string; note: Copy }
export interface NumberCell {number?: number; zh: string; py?: string; vi?: string}
export interface SourceLesson {schema: 1; edition: string; lesson: number; version: string; textbookSHA256: string; answerBookSHA256: string; editorialStatus: string; activities: SourceActivity[]; figures: SourceFigure[]; numberTables: { source: {printedPages:number[];pdfPages:number[]}; grid: (NumberCell|null)[][]; higher: NumberCell[]; two: NumberCell[] }; bonus: {id:string;title:Copy;printedResourceId:string;printedPage:number;pdfPage:number;availability:'unavailable';payload:null} }
// A separate sidecar: BookLesson, textbook.json, homework IDs and grades remain unchanged.
export const sourceLesson = raw as SourceLesson;
export const sourceRecordKey = (activity: Pick<SourceActivity,'id'|'version'>) => activity.id + '@' + activity.version;
