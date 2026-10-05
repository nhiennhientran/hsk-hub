#!/usr/bin/env python3
"""Private HSK2 L1 comparison authoring. No production/source mutation or acceptance."""
import collections, copy, hashlib, json, pathlib, re
OUT=pathlib.Path(__file__).resolve().parent
ROOT=OUT.parents[4]
DOC=ROOT/'course-app/docs/resume-20261004'
SOURCE=DOC/'official-vi-source-prep/hsk2-l01/source-transcription.json'
ACCEPT=DOC/'qa-official-vi/hsk2-l01-source/final-source-acceptance.json'
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(name,data): (OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
assert sha(SOURCE)=='91f838340ea6bb2eb5a10a90eaff62f5da440cb4f5920287f11249149e2829dc'
assert sha(ACCEPT)=='01d4c4e1321fbfb9cb4ecb95dff2ce2513aa4db3a983846a544dc60b3b8a5539'
source=read(SOURCE); sources={x['sourceId']:x for x in source['records']}; assert len(sources)==103
assert read(ACCEPT)['status']=='independently-accepted-source-transcription-only'
sections=collections.defaultdict(list)
for x in sources.values():sections[x['section']].append(x)
def s(section): assert len(sections[section])==1;return sections[section][0]
def resolve(obj,p):
 for part in p.lstrip('/').split('/'):
  part=part.replace('~1','/').replace('~0','~');obj=obj[int(part)] if isinstance(obj,list) else obj[part]
 return obj
lessonFile='course-app/content/hsk2/lesson-01.json';lexFile='course-app/content/hsk2-lexicon.json';indexFile='course-app/content/course-index.json'
documents={f:read(ROOT/f) for f in [lessonFile,lexFile,indexFile]}; lesson=documents[lessonFile]
bindings=read(OUT/'current-bindings.json');occurrences=read(OUT/'current-occurrences.json');bmap={(x['baselineFile'],x['field']):x for x in bindings}
mapping={};held={}
def add(pointer,sections_,new=None,reason='',file=lessonFile):
 refs=[s(k) for k in sections_];binding=bmap[(file,pointer)]
 if new is None:assert len(refs)==1;new=refs[0]['viPrinted']
 assert isinstance(new,str) and new
 assert (file,pointer) not in mapping
 mapping[file,pointer]={'refs':refs,'new':new,'reason':reason or 'Complete accepted printed unit, same Chinese task/content context.'}
def hold(pointer,sections_,reason):held[lessonFile,pointer]={'refs':[s(k) for k in sections_],'reason':reason}
add('/title/vi',['lesson-title'])
idx=next(i for i,x in enumerate(documents[indexFile]) if x['id']==lesson['id']);add(f'/{idx}/title/vi',['lesson-title'],file=indexFile)
for i in range(4):
 for p in [f'/objectives/{i}/vi',f'/activities/0/fields/{i}/prompt/vi']:add(p,[f'goal{i+1}'])
for i in range(2):
 for p in [f'/warmup/{i}/title/vi',f'/activities/{i+1}/title/vi']:add(p,[f'warmup{i+1}-instruction'])
for p,k in [('/activities/2/matrix/rowHeading/vi','survey-col1'),('/activities/2/matrix/contextHeaders/0/vi','survey-col2'),('/activities/2/matrix/columns/0/vi','survey-col3')]:add(p,[k])
for i in range(3):
 add(f'/activities/2/matrix/rows/{i}/prompt/vi',[f'survey-row{i+1}'])
 for p in [f'/warmup/1/items/{i}/vi',f'/activities/2/fields/{i}/prompt/vi']:
  old=bmap[lessonFile,p]['value'];tail=old[old.index(':'):];add(p,[f'survey-row{i+1}'],s(f'survey-row{i+1}')['viPrinted']+tail,'Accepted printed row label plus unchanged website question tail; the question tail is editorial, not an official translation.')
words={x['zhAnchor']:x for x in sources.values() if re.fullmatch('word\\d+|proper-name\\d+',x['section'])}
for i,w in enumerate(lesson['vocabulary']):
 ref=words[w['zh']]
 # Printed dictionary wording replaces the gloss; pre-existing useful explanatory parentheticals survive verbatim.
 tail={'给':' (giới thiệu người tiếp nhận hành động)','次':' (lượng từ chỉ số lần)','不好意思':' (cách nói lịch sự)'}.get(w['zh'],'')
 if tail:assert w['vi'].endswith(tail)
 new=ref['viPrinted']+tail
 add(f'/vocabulary/{i}/vi',[ref['section']],new,reason='Exact printed headword/gloss and local stable sense; any existing explanatory parenthetical is retained verbatim and labelled in composition as editorial. POS/pinyin/star/source metadata remain sealed.')
 senseIndex=next(i for i,x in enumerate(documents[lexFile]['senses']) if any(z['wordId']==w['id'] for z in x['sources']))
 assert documents[lexFile]['senses'][senseIndex]['zh']==w['zh']
 if tail:assert documents[lexFile]['senses'][senseIndex]['vi'].endswith(tail)
 add(f'/senses/{senseIndex}/vi',[ref['section']],new,file=lexFile,reason='Same canonical/local sense by actual wordId; identical source anchor/gloss and exact retained editorial parenthetical. No merge or category edit.')
for b in bindings:
 if b['baselineFile']==lessonFile and re.fullmatch(r'/activities/\d+/fields/\d+/options/\d+/vi',b['field']) and b['zhContext'] in words:
  ref=words[b['zhContext']];add(b['field'],[ref['section']],reason='Full lesson-dictionary gloss reused as the translated lexical option; original Chinese option, option index and scoring stay fixed. This is a lexical gloss, not a full sentence translation.')
p='/warmup/0/items/0/vi';refs=[words[x] for x in ['不好意思','旅游','介绍','帮忙']]
add(p,[x['section'] for x in refs],'; '.join(f'{letter} '+ref['viPrinted'] for letter,ref in zip('ABCD',refs)),'Four printed lexical glosses joined with editorial unchanged A–D labels; no printed full Vietnamese word-list sentence exists.')
for i,t in enumerate(lesson['texts']):
 num=i+1
 add(f'/texts/{i}/title/vi',[f'text{num}-header']);add(f'/texts/{i}/context/vi',[f'text{num}-context'])
 for k,l in enumerate(t['lines']):
  sect=f'text{num}-line{k+1}' if num<4 else 'text4-whole-paragraph'
  assert l['zh']==s(sect)['zhAnchor']
  if num<4:assert l['speaker']==s(sect)['printedRoleZh']
  add(f'/texts/{i}/lines/{k}/vi',[sect],reason='Full printed dialogue turn; role metadata checked without inventing Vietnamese speaker labels.' if num<4 else 'Complete unlabelled printed paragraph equals the actual one whole runtime Chinese line. Source prints no speaker label; current Chinese speaker is sealed and no official Vietnamese speaker is invented.')
 for aIndex in [3+2*i,4+2*i]:
  p=f'/activities/{aIndex}/title/vi';old=bmap[lessonFile,p]['value'];add(p,[f'text{num}-header'],s(f'text{num}-header')['viPrinted']+old[old.index(':'):],'Printed text heading plus unchanged course exercise-mode suffix, not a verbatim official instruction.')
 p=f'/activities/{4+2*i}/note/vi'
 if num<4:add(p,[f'text{num}-role-reading-instruction'])
 else:hold(p,['text4-read-instruction'],'Website Chinese note says answer questions; accepted source says select correct answers. Current choice activity is compatible, but Chinese scope and the whole note must be independently reconciled rather than replacing only VI and claiming exact translation.')
for i in range(3):add(f'/grammar/{i}/title/vi',[f'grammar{i+1}-header'])
hold('/grammar/0/explanation/vi',['grammar1-rule'],'Whole website explanation adds listener confirmation and nhỉ/phải không equivalence. Retain its exact old text; full-source replacement would silently delete this extension. An explicit separated/preserved-tail construction requires independent review.')
hold('/grammar/1/explanation/vi',['grammar2-rule'],'Website adds already-known-event context. Printed rule ends with Ví dụ and includes all main restrictions. Do not delete the valid editorial context by whole-field replacement; source candidate and entire old text are retained pending an explicit construction.')
add('/grammar/2/explanation/vi',['grammar3-rule'],reason='Complete printed grammar3 explanation, including printed structure and example-introducing label; website has no extra semantic restriction beyond this accepted full source. Other structure/examples leaves remain unchanged.')
add('/sections/0/title/vi',['comprehensive-header'],s('comprehensive-header')['viPrinted']+': chọn từ điền chỗ trống','Official section heading plus exact existing topic tail.')
add('/activities/20/title/vi',['comprehensive-header'],s('comprehensive-header')['viPrinted']+': chọn từ điền chỗ trống','Same section heading/unchanged topic tail in mapped activity.')
refList=[words[x] for x in ['帮忙','已经','意思','介绍','有时']]
add('/sections/0/blocks/0/vi',['comprehensive1-instruction']+[x['section'] for x in refList],s('comprehensive1-instruction')['viPrinted']+' '+ '; '.join(f'{letter} '+ref['viPrinted'] for letter,ref in zip('ABCDE',refList))+'.','Complete printed instruction plus full printed dictionary glosses and editorial A–E labels. The source word choices are Chinese only; this combined Vietnamese list is explicitly derived.')
add('/sections/1/title/vi',['helper-header'],s('helper-header')['viPrinted']+': nghe nhiều, nói nhiều','Official helper heading plus exact retained existing topic label; not a printed full heading.')
add('/sections/1/blocks/0/vi',['helper-multiple-repeat'])
add('/sections/2/title/vi',['comprehensive-header'],s('comprehensive-header')['viPrinted']+': mô tả tranh','Official section heading plus exact retained existing topic tail.')
add('/sections/2/blocks/0/vi',['comprehensive2-instruction'])
combined=s('classroom-header')['viPrinted']+': '+s('classroom-roleplay-label')['viPrinted']
for p in ['/sections/3/title/vi','/activities/25/title/vi']:add(p,['classroom-header','classroom-roleplay-label'],combined,'Two complete printed labels joined by editorial colon; no implied full printed unit.')
for p in ['/sections/3/blocks/0/vi','/activities/25/fields/0/prompt/vi']:add(p,['classroom-roleplay-instruction'])
add('/sections/4/title/vi',['bonus-header','bonus-video-title'],s('bonus-header')['viPrinted']+': '+s('bonus-video-title')['viPrinted'],'Two printed labels joined by editorial colon; video metadata remains intact.')
add('/sections/4/blocks/0/vi',['bonus-video-title'],s('bonus-video-title')['viPrinted']+' (video 1-1).','Printed caption plus exact retained existing resource-number suffix. This does not claim that a video file is available.')

def pages(ref):
 fragments=ref.get('sourceFragments') or ref.get('fragments') or [ref]
 pairs=[]
 for f in fragments:
  pair=(f['pdfPage'],f['printedPage'])
  if pair not in pairs:pairs.append(pair)
 # A transcription may explicitly record the bilingual Chinese/Vietnamese spread scope.
 for pp,pr in zip(ref.get('pdfPages',[]),ref.get('printedPages',[])):
  if (pp,pr) not in pairs:pairs.append((pp,pr))
 return {'pdfPages':[p[0] for p in pairs],'printedPages':[p[1] for p in pairs]}
def anchor(ref):return {'sourceId':ref['sourceId'],'documentSourceId':'hsk2-official-vietnamese-20261004','pdfSHA256':source['officialPDFSHA256'],**pages(ref),'section':ref['section'],'zhAnchor':ref['zhAnchor'],'viPrinted':ref['viPrinted'],'originalSourceFragments':ref.get('sourceFragments',ref.get('fragments',[]))}
def use(row):
 p=row['pointer'];f=row['file']
 if f==lexFile:return {'producer':'src/content.ts → projectLexicon → src/lexicon.ts senseMap/canonicalWordPool','role':'canonical stable-sense identity/gloss; mixed queue keeps local Word object/ID, so local and canonical are paired'}
 if f==indexFile:return {'producer':'src/content.ts → projectCourseIndex → course summaries/navigation','role':'lesson summary/title'}
 if p.startswith('/illustrationManifest/'):
  role='outer img ALT + zoom img ALT' if '/alt/' in p else 'zoom paragraph or no-file description' if '/description/' in p else 'figure caption' if '/label/' in p else 'loaded auxiliary metadata; current figure does not render title'
  return {'producer':'src/lesson-view.ts illustration','role':role}
 if p.startswith('/warmup/'):return {'producer':'src/lesson-view.ts intro mapped(warm.id)','role':'fallback warmup; mapped activity is current primary display'}
 if p.startswith('/texts/') and '/questions/' in p:return {'producer':'src/lesson-view.ts questions(text)','role':'raw question fallback/history; mapped activity takes precedence'}
 if p.startswith('/grammar/') and '/practice/' in p:return {'producer':'src/lesson-view.ts grammar mapped(g.id)','role':'raw manual-practice fallback/history; mapped activity takes precedence'}
 if p.startswith('/activities/'):return {'producer':'src/lesson-view.ts activity/field/matrix','role':'active mapped worksheet; metadata and reference hints remain ungraded where authored'}
 if p.startswith('/homework/') or p.startswith('/listening/'):return {'producer':'src/main.ts renderHomework + src/listening-view.ts','role':'course-authored assessed/manual prompt and explanation; original IDs/answers/scoring sealed'}
 return {'producer':'src/content.ts projectLesson → src/lesson-view.ts','role':'loaded lesson source field/display or retained fallback'}
def fallback(row):
 p=row['pointer']
 if p.endswith('/pos'):return 'sealed-pos-metadata','Printed POS is kept as source evidence separately; current expanded category is not a VI-gloss target and no POS/ID/sense/audio metadata can change.'
 if 'appendixMetadata' in p or p.startswith('/coverageReview/'):return 'held-official-source-outside-body','Accepted body transcription has no new-edition appendix star legend. Retain old provenance and do not certify an unseen official appendix.'
 if not p.endswith('/vi'):return 'held-editorial-language-outside-registry','Detected Vietnamese structure/focus string is outside explicit VI-leaf revision contract. Retained, not semantically certified by absence of a book counterpart.'
 if p.startswith('/illustrationManifest/'):return 'retain-editorial-no-direct-book-counterpart','Auxiliary code-authored diagram description/ALT/title/caption has no complete printed Vietnamese equivalent. Retain and separately review Chinese/visual meaning; this classification is not semantic approval.'
 if p.startswith('/homework/') or p.startswith('/listening/'):return 'retain-editorial-assessment-no-direct-book-counterpart','Original course-authored assessed/manual task or explanation has no complete printed Vietnamese counterpart. Keep answer/scoring semantics and original expected value; a body-source match does not certify its custom meaning.'
 if p.startswith('/grammar/'):return 'retain-editorial-chinese-only-example-or-practice','The book prints this example/practice in Chinese without a complete Vietnamese translation. Do not borrow a dialogue translation with different pronouns or context and label it official.'
 return 'retain-editorial-no-direct-book-counterpart','No complete accepted printed Vietnamese unit corresponds to this custom/question/reference/interface field. Explicitly retained and still pending semantic editorial review; no automatic correctness inference.'
rows=[]
for r in occurrences:
 row={k:copy.deepcopy(r.get(k)) for k in ['recordId','semanticKey','file','pointer','itemId','ownerKey','chineseContext','sourceKind','visibility','value','rawFileSHA256']}
 row['oldValue']=row.pop('value');row['field']=row['pointer'];row['newValue']=None;row['officialSourceIDs']=[];row['sourceAnchors']=[];row['actualBinding']=r['actualBinding'];row['runtimeConsumer']=use(r);row['status']='author-proposal-awaiting-independent-comparison-review-no-activation';row['semanticEditorialAccepted']=False
 row['authorReview']={'author':'/root/qa_hsk1_05_08','status':'content-authored-and-checked-awaiting-independent-comparison-review'}
 k=r['file'],r['pointer'];m=mapping.get(k);h=held.get(k)
 if m:
  refs=m['refs'];new=m['new'];row.update(newValue=new,officialSourceIDs=[x['sourceId'] for x in refs],sourceAnchors=[anchor(x) for x in refs],reason=m['reason'],decision='match-exact' if new==r['value'] else 'propose-official-alignment',classification='none' if new==r['value'] else 'official-wording-variant')
  direct=len(refs)==1 and new==refs[0]['viPrinted'];row['sourceRelation']='direct-whole-printed-unit' if direct else 'derived-exact-source-spans-and-explicit-glue'
  row['roleEvidence']=[{k:v for k,v in ref.items() if 'role' in k.lower()} for ref in refs if any('role' in k.lower() for k in ref)]
  # Every source-backed literal must be visible in the new whole field; all remaining ranges are explicitly editorial.
  fragments=[]
  for ref in refs:
   text=ref['viPrinted'];start=new.find(text);assert start>=0,(r['pointer'],text)
   fragments.append({'sourceId':ref['sourceId'],'sourceField':'viPrinted','sourceStartUTF16':0,'sourceEndUTF16':len(text),'targetStartUTF16':start,'targetEndUTF16':start+len(text),'text':text})
  covered=set(i for x in fragments for i in range(x['targetStartUTF16'],x['targetEndUTF16']))
  runs=[];start=None
  for i in range(len(new)+1):
   if i<len(new) and i not in covered:
    if start is None:start=i
   elif start is not None:runs.append({'startUTF16':start,'endUTF16':i,'text':new[start:i],'inOldValue':new[start:i] in r['value'],'authorMeaningReview':'Labels/punctuation or explicit retained website topic/question/resource tail; all subject to independent reviewer.'});start=None
  row['composition']={'sourceFragments':fragments,'editorialRanges':runs,'notVerbatim':not direct,'allSourceUnitsWhole':True}
 elif h:
  row.update(decision='held-whole-field-scope-or-editorial-preservation',reason=h['reason'],officialSourceIDs=[x['sourceId'] for x in h['refs']],sourceAnchors=[anchor(x) for x in h['refs']],officialCandidateWholeValues=[x['viPrinted'] for x in h['refs']],newValue=r['value'],sourceRelation='held-no-projection')
 else:
  decision,reason=fallback(r);row.update(decision=decision,reason=reason,newValue=r['value'],sourceRelation='no-projection')
  if decision=='sealed-pos-metadata' and r['chineseContext'] in words:row['officialSourceIDs']=[words[r['chineseContext']]['sourceId']];row['printedPOSRaw']=words[r['chineseContext']].get('printedPOSRaw');row['printedPOSSourceRecord']=copy.deepcopy(words[r['chineseContext']])
 assert r['value']==resolve(documents[r['file']],r['pointer'])
 rows.append(row)
proposals=[x for x in rows if x['decision']=='propose-official-alignment']
for x in proposals:assert x['actualBinding'] and x['oldValue']==x['actualBinding']['value'] and x['field'].endswith('/vi')
projected=copy.deepcopy(documents)
for x in proposals:
 parts=x['field'][1:].split('/');v=projected[x['file']]
 for part in parts[:-1]:v=v[int(part)] if isinstance(v,list) else v[part.replace('~1','/').replace('~0','~')]
 v[parts[-1]]=x['newValue']
diffs=[]
def diff(a,b,path='',file=''):
 assert type(a)==type(b)
 if isinstance(a,dict):
  assert a.keys()==b.keys()
  for k in a:diff(a[k],b[k],path+'/'+k.replace('~','~0').replace('/','~1'),file)
 elif isinstance(a,list):
  assert len(a)==len(b)
  for i,(x,y) in enumerate(zip(a,b)):diff(x,y,path+'/'+str(i),file)
 elif a!=b:diffs.append({'file':file,'field':path,'oldValue':a,'newValue':b})
for f in documents:diff(documents[f],projected[f],file=f)
assert len(diffs)==len(proposals) and all(x['field'].endswith('/vi') for x in diffs)
vocabPairs=[]
for i,w in enumerate(lesson['vocabulary']):
 ci=next(i for i,x in enumerate(documents[lexFile]['senses']) if any(z['wordId']==w['id'] for z in x['sources']))
 local=mapping[lessonFile,f'/vocabulary/{i}/vi'];canon=mapping[lexFile,f'/senses/{ci}/vi'];assert local['new']==canon['new'] and [x['sourceId'] for x in local['refs']]==[x['sourceId'] for x in canon['refs']]
 vocabPairs.append({'wordId':w['id'],'senseId':documents[lexFile]['senses'][ci]['id'],'localField':f'/vocabulary/{i}/vi','canonicalField':f'/senses/{ci}/vi','sourceIds':[x['sourceId'] for x in local['refs']],'newValue':local['new'],'POS':w['pos'],'allNonViMetadataSealed':True})
for ai,a in enumerate(projected[lessonFile]['activities']):
 for fi,f in enumerate(a.get('fields',[])):
  options=f.get('options',[]);norm=[x['vi'].lower().strip() for x in options]
  assert len(norm)==len(set(norm)),('ambiguous translated option',ai,fi)
sourceLedger=[]
for ref in sources.values():
 consumers=[{'recordId':x['recordId'],'file':x['file'],'field':x['field'],'actualOwnerId':x['actualBinding']['ownerId'] if x['actualBinding'] else x['itemId'],'decision':x['decision'],'sourceRelation':x['sourceRelation']} for x in rows if ref['sourceId'] in x['officialSourceIDs']]
 role={k:v for k,v in ref.items() if 'role' in k.lower()}
 sourceLedger.append({'source':copy.deepcopy(ref),'completePageScope':pages(ref),'consumers':consumers,'printedRoleMetadata':role,'decision':'mapped-one-or-more-real-consumers' if consumers else 'source-only-no-complete-current-VI-consumer','sourceOnlyReason':None if consumers else 'Printed running/header/label/instruction or untranslated example context has no complete corresponding per-lesson VI field; shared UI copy is separately scoped, and no consumer is invented.'})
assert len(sourceLedger)==103
inputLedger=read(OUT/'current-input-ledger.json');inputLedger['acceptedSource']={'file':str(SOURCE.relative_to(ROOT)),'sha256':sha(SOURCE),'records':103,'acceptanceFile':str(ACCEPT.relative_to(ROOT)),'acceptanceSHA256':sha(ACCEPT),'officialPDFSHA256':source['officialPDFSHA256']}
summary={'schemaVersion':1,'lesson':1,'status':'author-comparison-frozen-awaiting-third-person-review','occurrences':len(rows),'registeredBindings':len(bindings),'decisions':dict(collections.Counter(x['decision'] for x in rows)),'sourceRecords':103,'sourceMapped':sum(bool(x['consumers']) for x in sourceLedger),'proposedVIChanges':len(proposals),'privateProjectionDiffs':len(diffs),'nonVIDiffs':0,'gradeAnswerAudioIdSourceMetadataDiffs':0,'canonicalLocalPairs':len(vocabPairs),'activation':0,'runtimeWrites':0,'independentAcceptedChanges':0,'fullLessonAlignmentAccepted':False,'scope':'Current lesson VI leaves and current associated sense/title inventory candidates; absence of a printed counterpart never certifies custom translation correctness. Shared UI and SVG English-only source metadata are separately frozen by producer/asset SHA.'}
write('source-input-copy.json',source);write('comparison.json',rows);write('proposals.json',proposals);write('source-to-consumer-ledger.json',sourceLedger);write('canonical-local-gloss-ledger.json',vocabPairs);write('private-projection-diff.json',diffs);write('input-ledger.json',inputLedger);write('validation.json',summary)
freezeFiles=['extract-current.mjs','build-comparison.py','README.md','current-bindings.json','current-occurrences.json','current-semantic-consumers.json','current-input-ledger.json','source-input-copy.json','comparison.json','proposals.json','source-to-consumer-ledger.json','canonical-local-gloss-ledger.json','private-projection-diff.json','input-ledger.json','validation.json']
write('freeze.json',{'schemaVersion':1,'status':summary['status'],'files':[{'file':f,'sha256':sha(OUT/f),'bytes':(OUT/f).stat().st_size} for f in freezeFiles],'runtimeInputChecks':inputLedger['files'],'sourceAcceptance':inputLedger['acceptedSource'],'independentAcceptedChanges':0,'activation':0})
print(json.dumps(summary,ensure_ascii=False))
