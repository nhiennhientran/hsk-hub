import w1 from '../../../content/source-activities/figures/warmup-01.svg?url';
import w2 from '../../../content/source-activities/figures/warmup-02.svg?url';
import w3 from '../../../content/source-activities/figures/warmup-03.svg?url';
import w4 from '../../../content/source-activities/figures/warmup-04.svg?url';
import w5 from '../../../content/source-activities/figures/warmup-05.svg?url';
import w6 from '../../../content/source-activities/figures/warmup-06.svg?url';
import p1 from '../../../content/source-activities/figures/picture-01.svg?url';
import p2 from '../../../content/source-activities/figures/picture-02.svg?url';
import p3 from '../../../content/source-activities/figures/picture-03.svg?url';
import p4 from '../../../content/source-activities/figures/picture-04.svg?url';
import {getSourceLesson,sourceFigureAssetPath} from '../../services/source-activities/content.ts';
import type {OfficialViRegistry} from '../../services/content/official-vi-revisions.ts';
export const figureURLs:Readonly<Record<string,string>>={'warmup-01':w1,'warmup-02':w2,'warmup-03':w3,'warmup-04':w4,'warmup-05':w5,'warmup-06':w6,'picture-01':p1,'picture-02':p2,'picture-03':p3,'picture-04':p4};
/** Read only from the trusted catalogue, and never reinterpret a changed image. */
export function resolveSourceFigure(lessonId:number,id:string,sha256?:string,registry?:OfficialViRegistry){
  const figure=getSourceLesson(lessonId,registry)?.figures.find(figure=>figure.id===id);
  if(!figure||(sha256!==undefined&&figure.sha256!==sha256))return undefined;
  const url=figure.kind==='original-schematic'?figureURLs[figure.id]:sourceFigureAssetPath(figure);
  return url?{figure,url}:undefined;
}
