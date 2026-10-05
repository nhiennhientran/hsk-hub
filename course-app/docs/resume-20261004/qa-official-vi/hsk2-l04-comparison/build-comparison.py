#!/usr/bin/env python3
"""Private HSK2 L4 comparison authoring. No production/source mutation or acceptance."""
import collections, copy, hashlib, json, pathlib, re
OUT=pathlib.Path(__file__).resolve().parent
ROOT=OUT.parents[4]
DOC=ROOT/'course-app/docs/resume-20261004'
SOURCE=DOC/'official-vi-source-prep/hsk2-l04/source-transcription.json'
ACCEPT=DOC/'qa-official-vi/hsk2-l04-source/independent-review.json'
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(name,data): (OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
assert sha(SOURCE)=='b691d612a9ca3cb8b2421bd697c40afb99c7dca4ac0ae3fedd55e3ab81ad8ab5'
assert sha(ACCEPT)=='78a53a79b148810a276394c0f41adc89bae454e5384e9f6df2d624783086d893'
source=read(SOURCE); sources={x['sourceId']:x for x in source['records']}; assert len(sources)==98
assert read(ACCEPT)['status']=='accepted-source-transcription-only'
sections=collections.defaultdict(list)
for x in sources.values():sections[x['section']].append(x)
def s(section): assert len(sections[section])==1;return sections[section][0]
def resolve(obj,p):
 for part in p.lstrip('/').split('/'):
  part=part.replace('~1','/').replace('~0','~');obj=obj[int(part)] if isinstance(obj,list) else obj[part]
 return obj
lessonFile='course-app/content/hsk2/lesson-04.json';lexFile='course-app/content/hsk2-lexicon.json';indexFile='course-app/content/course-index.json'
documents={f:read(ROOT/f) for f in [lessonFile,lexFile,indexFile]}; lesson=documents[lessonFile]
bindings=read(OUT/'current-bindings.json');occurrences=read(OUT/'current-occurrences.json');bmap={(x['baselineFile'],x['field']):x for x in bindings}
mapping={};held={}
def add(pointer,sections_,new=None,reason='',file=lessonFile,selectedSpans=None):
 refs=[s(k) for k in sections_];binding=bmap[(file,pointer)]
 if new is None:assert len(refs)==1;new=refs[0]['viPrinted']
 assert isinstance(new,str) and new
 assert (file,pointer) not in mapping
 mapping[file,pointer]={'refs':refs,'new':new,'selectedSpans':selectedSpans or {},'reason':reason or 'Complete accepted printed unit, same Chinese task/content context.'}
def hold(pointer,sections_,reason):held[lessonFile,pointer]={'refs':[s(k) for k in sections_],'reason':reason}
import runpy
author_mapping=runpy.run_path(str(OUT/'author-mapping.py'))['author_mapping']
words=author_mapping(lesson,documents,bindings,bmap,s,add,hold,lessonFile,lexFile,indexFile)
def pages(ref):
 fragments=ref.get('sourceFragments') or ref.get('viPrintedFragments') or ref.get('fragments') or [ref]
 pairs=[]
 for f in fragments:
  pair=(f['pdfPage'],f['printedPage'])
  if pair not in pairs:pairs.append(pair)
 # A transcription may explicitly record the bilingual Chinese/Vietnamese spread scope.
 for pp,pr in zip(ref.get('pdfPages',[]),ref.get('printedPages',[])):
  if (pp,pr) not in pairs:pairs.append((pp,pr))
 pairs=sorted(pairs)
 return {'pdfPages':[p[0] for p in pairs],'printedPages':[p[1] for p in pairs]}
def anchor(ref):return {'sourceId':ref['sourceId'],'documentSourceId':'hsk2-official-vietnamese-20261004','pdfSHA256':source['officialPDFSHA256'],**pages(ref),'section':ref['section'],'zhAnchor':ref['zhAnchor'],'viPrinted':ref['viPrinted'],'originalSourceFragments':ref.get('sourceFragments',ref.get('viPrintedFragments',ref.get('fragments',[])))}
def use(row):
 p=row['pointer'];f=row['file']
 if f.endswith('.svg'):return {'producer':'src/lesson-view.ts illustration → img.src asset','role':'SVG accessible source metadata; outer HTML img ALT is separate; no native AT assertion'}
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
 if row['file'].endswith('.svg'):return 'retain-editorial-svg-no-direct-book-counterpart','Original auxiliary SVG description has no complete official Vietnamese counterpart. Retain exact XML bytes, no semantic or AT certification; outside JSON VI revision registry.'
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
   text=m.get('selectedSpans',{}).get(ref['section'],ref['viPrinted']);sourceStart=ref['viPrinted'].find(text);assert sourceStart>=0;start=new.find(text);assert start>=0,(r['pointer'],text)
   fragments.append({'sourceId':ref['sourceId'],'sourceField':'viPrinted','sourceStartUTF16':sourceStart,'sourceEndUTF16':sourceStart+len(text),'targetStartUTF16':start,'targetEndUTF16':start+len(text),'text':text})
  covered=set(i for x in fragments for i in range(x['targetStartUTF16'],x['targetEndUTF16']))
  runs=[];start=None
  for i in range(len(new)+1):
   if i<len(new) and i not in covered:
    if start is None:start=i
   elif start is not None:runs.append({'startUTF16':start,'endUTF16':i,'text':new[start:i],'inOldValue':new[start:i] in r['value'],'authorMeaningReview':'Labels/punctuation or explicit retained website topic/question/resource tail; all subject to independent reviewer.'});start=None
  row['composition']={'sourceFragments':fragments,'editorialRanges':runs,'notVerbatim':not direct,'allSourceUnitsWhole':not bool(m.get('selectedSpans'))}
 elif h:
  row.update(decision='held-whole-field-scope-or-editorial-preservation',reason=h['reason'],officialSourceIDs=[x['sourceId'] for x in h['refs']],sourceAnchors=[anchor(x) for x in h['refs']],officialCandidateWholeValues=[x['viPrinted'] for x in h['refs']],newValue=r['value'],sourceRelation='held-no-projection')
 else:
  decision,reason=fallback(r);row.update(decision=decision,reason=reason,newValue=r['value'],sourceRelation='no-projection')
  if decision=='sealed-pos-metadata' and r['chineseContext'] in words:row['officialSourceIDs']=[words[r['chineseContext']]['sourceId']];row['printedPOSRaw']=words[r['chineseContext']].get('printedPOSRaw');row['printedPOSSourceRecord']=copy.deepcopy(words[r['chineseContext']])
 if r['file'].endswith('.svg'):
  import xml.etree.ElementTree as ET
  node=ET.parse(ROOT/r['file']).getroot()
  for part in r['pointer'].strip('/').split('/')[1:]:
   tag,index=re.fullmatch(r'([^[]+)\[(\d+)\]',part).groups();node=[x for x in node if x.tag.split('}')[-1]==tag][int(index)-1]
  assert r['value']==''.join(node.itertext()).strip()
 else:assert r['value']==resolve(documents[r['file']],r['pointer'])
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
assert len(sourceLedger)==98
inputLedger=read(OUT/'current-input-ledger.json');inputLedger['acceptedSource']={'file':str(SOURCE.relative_to(ROOT)),'sha256':sha(SOURCE),'records':98,'acceptanceFile':str(ACCEPT.relative_to(ROOT)),'acceptanceSHA256':sha(ACCEPT),'officialPDFSHA256':source['officialPDFSHA256']}
summary={'schemaVersion':1,'lesson':4,'status':'author-comparison-frozen-awaiting-third-person-review','occurrences':len(rows),'registeredBindings':len(bindings),'decisions':dict(collections.Counter(x['decision'] for x in rows)),'sourceRecords':98,'sourceMapped':sum(bool(x['consumers']) for x in sourceLedger),'proposedVIChanges':len(proposals),'privateProjectionDiffs':len(diffs),'nonVIDiffs':0,'gradeAnswerAudioIdSourceMetadataDiffs':0,'canonicalLocalPairs':len(vocabPairs),'activation':0,'runtimeWrites':0,'independentAcceptedChanges':0,'fullLessonAlignmentAccepted':False,'scope':'Current lesson VI leaves and current associated sense/title/SVG inventory candidates. Every no-book editorial value remains semantically unaccepted. Shared UI is separately scoped; detected SVG VI metadata rows are classified editorial and all actual asset bytes/producers are frozen, without AT certification.'}
write('source-input-copy.json',source);write('comparison.json',rows);write('proposals.json',proposals);write('source-to-consumer-ledger.json',sourceLedger);write('canonical-local-gloss-ledger.json',vocabPairs);write('private-projection-diff.json',diffs);write('input-ledger.json',inputLedger);write('validation.json',summary)
freezeFiles=['extract-current.mjs','build-comparison.py','author-mapping.py','README.md','current-bindings.json','current-occurrences.json','current-semantic-consumers.json','current-input-ledger.json','source-input-copy.json','comparison.json','proposals.json','source-to-consumer-ledger.json','canonical-local-gloss-ledger.json','private-projection-diff.json','input-ledger.json','validation.json']
write('freeze.json',{'schemaVersion':1,'status':summary['status'],'files':[{'file':f,'sha256':sha(OUT/f),'bytes':(OUT/f).stat().st_size} for f in freezeFiles],'runtimeInputChecks':inputLedger['files'],'sourceAcceptance':inputLedger['acceptedSource'],'independentAcceptedChanges':0,'activation':0})
print(json.dumps(summary,ensure_ascii=False))
