import type {ActivityField,Source} from './types.ts';
/** A group-level citation suffices only when every field comes from that page. */
export function fieldSourcesNeedNotes(source:Source,fields:readonly Pick<ActivityField,'source'>[]):boolean {
 const pages=new Set(fields.map(field=>field.source?.pdfPage??source.pdfPage));
 return pages.size>0&&(pages.size>1||!pages.has(source.pdfPage));
}
