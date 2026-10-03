import type {ActivityField,Source} from './types.ts';
/** A group-level citation suffices only when every field comes from that page. */
export function fieldSourcesNeedNotes(source:Source,fields:readonly Pick<ActivityField,'source'>[]):boolean {
 const pages=new Set(fields.map(field=>field.source?.pdfPage??source.pdfPage));
 return pages.size>0&&(pages.size>1||!pages.has(source.pdfPage));
}

/** Consolidate only genuinely identical row provenance; keep data and mixed-source cells intact. */
export function sharedRowSource(source:Source,fields:readonly Pick<ActivityField,'source'>[]):Source|null {
 if(fields.length<2)return null;
 const first=fields[0].source??source;
 return fields.every(field=>{const other=field.source??source;return other.pdfPage===first.pdfPage&&other.printedPage===first.printedPage&&other.section===first.section&&other.provenance===first.provenance})?first:null;
}
