/** Checked independently from runtime, including exact source-to-sense coverage. */
export function verifyLexicon(lessons,catalogue,{requireReview=false}={}){
 const errors=[],check=(ok,msg)=>{if(!ok)errors.push(msg)},id=catalogue?.courseId;
 check(catalogue?.schemaVersion===1&&catalogue.version==='2026.1'&&/^hsk[23]-fltrp-2026$/.test(id),'Invalid lexicon identity');
 if(!Array.isArray(catalogue?.senses))return errors.concat('Missing lexicon senses');
 const words=new Map(lessons.filter(l=>l.courseId===id).flatMap(l=>l.vocabulary.map(w=>[w.id,{lesson:l,word:w}]))),seen=new Set(),senseIds=new Set(),forms=new Map();
 for(const s of catalogue.senses){
  check(typeof s.id==='string'&&s.id.startsWith(id+':sense:')&&!senseIds.has(s.id),'Repeated or invalid sense identity');senseIds.add(s.id);
  check(['zh','py','vi','pos'].every(k=>typeof s[k]==='string'&&s[k].trim()),'Empty canonical copy');
  check(Array.isArray(s.sources)&&s.sources.length>0,'Missing sense source references');
  for(const ref of s.sources??[]){const found=words.get(ref.wordId);check(!!found&&!seen.has(ref.wordId),'Missing or repeated source word: '+ref.wordId);seen.add(ref.wordId);if(!found)continue;
   const {word:w,lesson:l}=found;
   check(ref.lesson===l.number&&ref.lessonId===l.id&&ref.sourceText===w.sourceText&&ref.audioTrack===w.audioTrack&&JSON.stringify(ref.source)===JSON.stringify(w.source),'Stale source binding: '+ref.wordId);
   check(s.zh===w.zh&&s.py===w.py&&s.pos===w.pos,'Incompatible spelling, pronunciation or POS merge: '+ref.wordId);
   if(s.sources.length===1)check(s.vi===w.vi,'Stale canonical Vietnamese: '+ref.wordId);
  }
  const group=forms.get(s.zh)??[];group.push(s.id);forms.set(s.zh,group);
 }
 for(const wordId of words.keys())check(seen.has(wordId),'Unmapped source word: '+wordId);
 const decisions=new Map((catalogue.sameFormDecisions??[]).map(d=>[d.zh,d]));
 for(const [zh,ids]of forms)if(ids.length>1){const d=decisions.get(zh);check(d?.action==='keep-distinct'&&typeof d.reason==='string'&&d.reason.trim()&&JSON.stringify([...d.senseIds].sort())===JSON.stringify([...ids].sort()),'Missing explicit homograph decision: '+zh);if(requireReview)check(d?.reviewed===true,'Unreviewed homograph decision: '+zh)}
 const merged=catalogue.senses.filter(s=>s.sources.length>1);
 check(Array.isArray(catalogue.merges)&&merged.length===catalogue.merges.length,'Merge ledger mismatch');
 for(const s of merged){const d=catalogue.merges.find(m=>m.senseId===s.id);check(d&&d.reviewed===true&&typeof d.reason==='string'&&d.reason.trim(),'Unreviewed lexical merge: '+s.id)}
 check(catalogue.counts?.sourceRecords===words.size&&catalogue.counts?.senses===senseIds.size&&catalogue.counts?.chineseForms===forms.size&&catalogue.counts?.verifiedMerges===merged.length,'Incorrect lexicon counts');
 if(requireReview)check(catalogue.reviewStatus?.independent===true&&typeof catalogue.reviewStatus?.reviewer==='string'&&!catalogue.reviewStatus.reviewer.includes('pending'),'Lexicon independent review pending');
 return errors;
}
