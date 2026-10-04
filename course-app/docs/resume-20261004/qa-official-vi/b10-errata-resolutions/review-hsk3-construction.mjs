import fs from 'node:fs';
import crypto from 'node:crypto';
import {viBindingsForDocument} from '../../../../src/official-vi-revisions.ts';
const root=new URL('../../../../../',import.meta.url),out=new URL('./',import.meta.url);
const json=file=>JSON.parse(fs.readFileSync(new URL(file,root),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const file='course-app/content/hsk3/lesson-10.json',raw=fs.readFileSync(new URL(file,root),'utf8');
const lesson=JSON.parse(raw),bindings=viBindingsForDocument(lesson,file,'hsk3-fltrp-2026');
const comparisonFile='course-app/docs/resume-20261004/qa-official-vi/hsk3-l10-comparison/field-comparisons.json';
const comparison=json(comparisonFile),srcBase='course-app/docs/resume-20261004/official-vi-source-prep/hsk3-l10/';
const sources=new Map(['body-vietnamese-transcription.json','appendix-lesson10-vietnamese-transcription.json'].flatMap(f=>json(srcBase+f).rows).map(r=>[r.recordId,r]));
const checks=[],reviews=[];const check=(name,passed,details={})=>checks.push({name,passed:!!passed,...details});
const fields=['/texts/1/lines/6/vi','/activities/20/title/vi','/activities/21/title/vi'];
for(const field of fields){
 const row=comparison.find(r=>r.file===file&&r.field===field),binding=bindings.find(b=>b.field===field);
 check('actual adapter registered owner and exact old baseline matched',!!row&&!!binding&&row.oldValue===binding.value&&row.itemId===binding.ownerId,{field});
 const source=sources.get(row.sourceIDs[0]);
 if(field==='/texts/1/lines/6/vi'){
  check('ellipsis is exact actual owner.zh rather than speaker label',binding.zhContext==='……'&&row.chineseContext==='旁白'&&lesson.texts[1].lines[6].speaker==='旁白',{field});
  check('ellipsis exact independently accepted source and no printed Vietnamese speaker',source.chineseAnchor==='……'&&source.printedVietnamese==='...'&&source.speakerPrintedVietnamese===null&&source.printedVietnameseIsLanguageText===false&&source.role==='printed-ellipsis',{field});
  check('new punctuation consumes complete exact source unit',row.newValue===source.printedVietnamese&&row.oldValue==='…',{field});
  reviews.push({recordId:row.targetRecordId,file,field,decision:'accepted-explicit-construction-mapping-repair',ownerId:binding.ownerId,component:binding.component,lesson:binding.lesson,expectedOldValue:binding.value,newValue:row.newValue,actualChineseGuard:binding.zhContext,comparisonContextWas:'旁白',contextRepairReason:'Inventory nearest Chinese label selected the speaker 旁白, but the field owner has exact zh ……. Source printed-ellipsis shares that same zh; use actual owner.zh for the runtime guard. Do not rewrite sealed speaker metadata.',sourceID:source.recordId,sourceAnchorKind:'directOfficial',officialViText:source.printedVietnamese,officialZhText:source.chineseAnchor,nonLanguagePunctuation:true,notSpeechOrTranslatedSentence:true,scope:'author construction opinion only; source/comparison freeze unmodified; trusted manifest/activation acceptance separate'});
 }else{
  const index=Number(field.split('/')[2]),suffix=index===20?' (1–5)':' (6–10)',sourceText=source.printedVietnamese;
  check('official instruction exact known string and final single full stop',sourceText==='Chọn từ thích hợp điền vào chỗ trống.'&&sourceText.endsWith('.'),{field});
  const selected=sourceText.slice(0,-1),start=0,end=sourceText.length-1;
  check('reviewed exact contiguous source selection plus unchanged original range constructs full new value',row.oldValue.endsWith(suffix)&&row.newValue===selected+suffix&&sourceText.slice(start,end)===selected,{field});
  check('actual owner Chinese range preserved and agrees with original activity navigation group',binding.zhContext===(index===20?'选词填空（1—5）':'选词填空（6—10）')&&lesson.activities[index].fields.length===5,{field});
  reviews.push({recordId:row.targetRecordId,file,field,decision:'accepted-explicit-selected-source-span-composition',ownerId:binding.ownerId,component:binding.component,lesson:binding.lesson,expectedOldValue:binding.value,newValue:row.newValue,actualChineseGuard:binding.zhContext,sourceID:source.recordId,sourceAnchorKind:'terminologyDerived',notVerbatim:true,officialWholeInstruction:sourceText,sourceFragment:{sourceId:source.recordId,sourceField:'printedVietnamese',sourceStartUTF16:start,sourceEndUTF16:end,targetStartUTF16:0,targetEndUTF16:selected.length,text:selected},sourceSelectionReason:'Use all instruction wording before its final literal period in a heading, then append the existing navigation range. The period omission is this explicitly reviewed contiguous span, never a fuzzy translation or unrestricted trim rule.',uncitedGlue:{text:suffix,targetStartUTF16:selected.length,targetEndUTF16:row.newValue.length,role:'existing editor-provided navigation range, not printed Vietnamese source wording',preservation:'exact unchanged original suffix'},scope:'only these2 fields/sourceEnd positions/range values reviewed; not approval of remaining35 derived constructions or whole manifest activation'});
 }
}
check('independent119 source freeze remains exact accepted baseline',sha(fs.readFileSync(new URL('course-app/docs/resume-20261004/qa-official-vi/hsk3-l10-source/freeze-manifest.json',root)))==='50645728c3877979315bc0c50e105c2277e15913aad24a71d6ef602f97587731');
check('exact three requested constructions uniquely covered',reviews.length===3&&new Set(reviews.map(r=>r.recordId)).size===3);
const report={status:'three explicit owner/source-span construction opinions accepted; remaining derived-glue and manifest acceptance still separate',passed:checks.every(c=>c.passed),checksCount:checks.length,checks,inputs:['body-vietnamese-transcription.json','appendix-lesson10-vietnamese-transcription.json'].map(f=>({file:srcBase+f,sha256:sha(fs.readFileSync(new URL(srcBase+f,root)))})).concat([{file,sha256:sha(Buffer.from(raw))},{file:comparisonFile,sha256:sha(fs.readFileSync(new URL(comparisonFile,root)))},{file:'course-app/src/official-vi-revisions.ts',sha256:sha(fs.readFileSync(new URL('course-app/src/official-vi-revisions.ts',root)))}]),reviews,remaining35TerminologyDerivedGlueAccepted:false,manifestTrustApproved:false,sourceFreezeModified:false,comparisonFreezeModified:false,productionEdits:0,activationApproved:false};
fs.writeFileSync(new URL('hsk3-three-construction-review.json',out),JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify({passed:report.passed,checks:checks.length,reviews:reviews.map(r=>({recordId:r.recordId,field:r.field,guard:r.actualChineseGuard,span:r.sourceFragment??null}))})+'\n');
if(!report.passed)process.exitCode=1;
