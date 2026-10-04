import fs from 'node:fs';
import {blankSourceData,editSourceDraft,validateSourceData} from '../../../../hsk1-app/src/services/source-activities/state.ts';
const items=JSON.parse(fs.readFileSync(new URL('./additional-activities.json',import.meta.url)));
const prior=JSON.parse(fs.readFileSync(new URL('../../../../hsk1-app/content/source-activities/lesson-04.json',import.meta.url)));
const ids=new Set(prior.activities.map(a=>a.id));const data=blankSourceData();
for(const a of items){if(ids.has(a.id))throw Error('Duplicate activity '+a.id);ids.add(a.id);if(a.fields.some(f=>f.assessment!=='ungraded'||f.answerSource||f.answer))throw Error('Invented objective answer');editSourceDraft(data,a,Object.fromEntries(a.fields.map(f=>[f.id,f.input==='select'?'done':'审核用回答'])),1791120600000)}
validateSourceData(data);console.log(JSON.stringify({newActivities:items.length,newFields:items.flatMap(a=>a.fields).length,existingActivities:prior.activities.length,newIDsDisjoint:true,actualSourceContextSchema:'passed',sourceContentReview:'awaiting-independent-root-review'},null,2));
