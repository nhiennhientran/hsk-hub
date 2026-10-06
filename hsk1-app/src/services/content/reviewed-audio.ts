import type {TextbookAudio} from './textbook.ts';

export interface ReviewedSentenceAudio {
 readonly id:string;
 readonly sourceText:string;
 readonly sentenceNumber:number;
 readonly audio:TextbookAudio;
}
export interface ReviewedTextbookAudioResolver {
 word(catalogId:string):TextbookAudio|undefined;
 line(lineId:string):TextbookAudio|undefined;
 sentences(lineId:string):readonly ReviewedSentenceAudio[];
}
let resolver:ReviewedTextbookAudioResolver|undefined;
/** The unified source-bound gate registers only independently accepted rows. */
export function registerReviewedTextbookAudio(value:ReviewedTextbookAudioResolver):void{resolver=value;}
export function reviewedTextbookAudio():ReviewedTextbookAudioResolver|undefined{return resolver;}
