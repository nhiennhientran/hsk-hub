export function verifySourceGuards(lessons,guards){
 const issues=[];const map=new Map(lessons.map(l=>[l.id,l]));
 if(guards.schemaVersion!==1||!Array.isArray(guards.records)||!guards.records.length)throw Error('Missing reviewed source sentinels');
 for(const row of guards.records){const lesson=map.get(row.lessonId);if(!lesson){issues.push('Guarded source lesson missing: '+row.lessonId);continue}let value=lesson;for(const key of row.path??[])value=value?.[key];if(!value||value.zh!==row.expected.zh||value.source?.pdfPage!==row.pdfPage)issues.push('Reviewed source changed: '+row.lessonId+' / '+row.path.join('.'));for(const key of['py','vi'])if(row.expected[key]!==undefined&&value?.[key]!==row.expected[key])issues.push('Reviewed source support changed: '+row.lessonId+' / '+row.path.join('.')+' / '+key)}
 return issues;
}
