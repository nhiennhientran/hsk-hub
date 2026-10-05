"""Independent read-only review guards. Write only this diagnostic directory."""
from pathlib import Path
import collections, copy, gzip, hashlib, json, re, xml.etree.ElementTree as ET

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[4]
AUTHOR=HERE.parent/'hsk2-l02-comparison'
SOURCE=ROOT/'course-app/docs/resume-20261004/official-vi-source-prep/hsk2-l02/source-transcription.json'
ACCEPT=ROOT/'course-app/docs/resume-20261004/official-vi-source-prep/hsk2-l02-independent/final-source-acceptance.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):
 b=p.read_bytes();return json.loads(gzip.decompress(b) if p.suffix=='.gz' else b)
def emit(name,obj):(HERE/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def at(obj,pointer):
 for key in pointer.split('/')[1:]:
  key=key.replace('~1','/').replace('~0','~');obj=obj[int(key)] if isinstance(obj,list) else obj[key]
 return obj
def put(obj,pointer,value):
 parts=pointer.split('/')[1:];parent=obj
 for k in parts[:-1]:
  k=k.replace('~1','/').replace('~0','~');parent=parent[int(k)] if isinstance(parent,list) else parent[k]
 k=parts[-1].replace('~1','/').replace('~0','~');parent[int(k) if isinstance(parent,list) else k]=value
def nonvi(obj):
 if isinstance(obj,dict):return {k:nonvi(v)for k,v in obj.items() if k!='vi'}
 if isinstance(obj,list):return [nonvi(v)for v in obj]
 return obj
def normzh(s):return re.sub(r'[\s。，？！：；、,.!?;:“”\"\'‘’（）()…—–]+','',s or '')
checks=[]
def check(name,passed,**details):checks.append({'check':name,'passed':bool(passed),**details})
source=load(SOURCE);sources={r['sourceId']:r for r in source['records']};accept=load(ACCEPT)
rows=load(AUTHOR/'comparison.json')['records'];proposals=load(AUTHOR/'proposals.json')['proposals']
inv=load(ROOT/'course-app/docs/resume-20261004/vi-inventory/inventory.json.gz');invmap={r['recordId']:r for r in inv}
freeze=load(AUTHOR/'freeze-manifest.json');source_scope=load(ACCEPT)
check('exact accepted104 source transcription and acceptance identity',sha(SOURCE)=='6c911ccfa8bc58ba8e4d16f03f285a9c1c29ec34572450a1fccf70f9ad3c1d8d' and sha(ACCEPT)=='77ec01a82293897b208cffd843d70d215ba2a4f5eac931826903ab0bb641181b' and len(sources)==104)
check('accepted source decision ID set exact104 and all accepted',len(accept['acceptedSourceIds'])==104 and set(accept['acceptedSourceIds'])==set(sources) and accept['coverage']['sourceIdsRequiringSourceRepair']==0)
for f in freeze['artifacts']:
 p=ROOT/f['path'];check('frozen author artifact actual SHA and bytes',sha(p)==f['sha256'] and p.stat().st_size==f['bytes'],file=f['path'])
author_input_status=[]
for r in load(AUTHOR/'input-ledger.json')['inputs']:
 p=ROOT/r['path'];current=sha(p);author_input_status.append({'file':r['path'],'authorSHA256':r['sha256'],'currentSHA256':current,'same':current==r['sha256']})
drift=[r for r in author_input_status if not r['same']]
check('author input drift limited to known current root loader change',len(drift)==1 and drift[0]['file']=='course-app/src/content.ts')
jsons={r['file']:load(ROOT/r['file'])for r in rows if r['file'].endswith('.json')}
bindings=load(AUTHOR/'semantic-bindings-input.json');binding_ids={r['semanticId']for r in bindings}
check('exact524 current comparison records and150 proposal occurrence IDs unique',len(rows)==len({r['recordId']for r in rows})==524 and len(proposals)==len({r['recordId']for r in proposals})==150)
rowmap={r['recordId']:r for r in rows}
for r in rows:
 original=invmap[r['recordId']]
 check('actual stable occurrence ID, semantic key, file and pointer match source inventory',r['semanticKey']==original['semanticKey'] and (r['file'],r['pointer'],r['oldExpected'])==(original['file'],original['pointer'],original['value']),recordId=r['recordId'])
 if r['file'].endswith('.json'):value=at(jsons[r['file']],r['pointer'])
 else:
  x=ET.parse(ROOT/r['file']).getroot();desc=next(n for n in x.iter()if n.tag.rsplit('}',1)[-1]=='desc');value=''.join(desc.itertext()).strip()
 check('actual full JSON or XML old baseline value and original file SHA',value==r['oldExpected'] and sha(ROOT/r['file'])==r['rawFileSHA256'],recordId=r['recordId'])
 check('actual related consumer semantic IDs exist',all(i in binding_ids for i in r['relatedSemanticBindingIds']),recordId=r['recordId'])
 for ref in r['officialReferences']:
  s=sources[ref['sourceId']]
  check('source reference text and actual independent accepted page identity',ref['viPrinted']==s['viPrinted'] and ref['zhAnchor']==s['zhAnchor'] and (ref['pdfPage'],ref['printedPage'])==(s['pdfPage'],s['printedPage']),recordId=r['recordId'],sourceID=ref['sourceId'])

lessonfile='course-app/content/hsk2/lesson-02.json';lexfile='course-app/content/hsk2-lexicon.json'
lesson=jsons[lessonfile];lexicon=jsons[lexfile]
leaves=[]
def vi_leaves(v,p=''):
 if isinstance(v,dict):
  for k,x in v.items():
   q=p+'/'+k.replace('~','~0').replace('/','~1')
   if k=='vi' and isinstance(x,str):leaves.append(q)
   else:vi_leaves(x,q)
 elif isinstance(v,list):
  for i,x in enumerate(v):vi_leaves(x,p+'/'+str(i))
vi_leaves(lesson)
check('all451 real lesson vi leaves represented once within476 candidate rows',len(leaves)==451 and all(sum(r['file']==lessonfile and r['pointer']==q for r in rows)==1 for q in leaves))
check('476 lesson rows have451vi+17POS+8editorial focus/structure, not476VN sentences',collections.Counter(r['pointer'].split('/')[-1]for r in rows if r['file']==lessonfile)=={'vi':451,'pos':17,'focus':5,'structure':3})
held_fields={'/grammar/0/explanation/vi','/grammar/1/explanation/vi','/grammar/2/explanation/vi','/sections/0/blocks/0/vi','/sections/1/blocks/0/vi'}
repair_fields={'/sections/4/blocks/0/vi','/activities/25/fields/0/prompt/vi'}
direct_relations={'direct-official-unit','same-Chinese-official-translation-reuse','same-printed-vocabulary-unit','canonical-single-source-vocabulary-reuse','same-headword-option-gloss-reuse','same-lesson-title-reuse'}
decisions=[]
for i,r in enumerate(proposals,1):
 rid=r['recordId'];sids=r['officialSourceIds'];source_values=[sources[s]['viPrinted']for s in sids]
 check('proposal is identical to frozen classified row and actual guarded old baseline',r==rowmap[rid] and at(jsons[r['file']],r['pointer'])==r['oldExpected'],recordId=rid)
 check('proposal changes an existing complete VI string only, never IDs/source/answers/order',r['pointer'].endswith('/vi') and isinstance(r['newVietnamese'],str) and r['newVietnamese']!=r['oldExpected'],recordId=rid)
 check('all proposal sourceIDs are real unique accepted104 loci',bool(sids) and len(sids)==len(set(sids)) and all(s in sources for s in sids),recordId=rid)
 if r['sourceRelation'] in direct_relations:
  check('direct/reused source proposal preserves full exact source unit',len(source_values)==1 and r['newVietnamese']==source_values[0],recordId=rid)
  if r['sourceRelation']=='direct-official-unit':
   sourcezh=normzh(sources[sids[0]]['zhAnchor']);actualzh=normzh(r['chineseContext'])
   check('direct Chinese anchor exact, allowing separate printed example marker only for held grammar body',sourcezh==actualzh or r['pointer'] in held_fields and sourcezh==actualzh+'例如',recordId=rid)
 verdict='accepted-proposal';effective=r['newVietnamese'];why='Independently read full old/new/source wording and actual consumer identity. This accepts the bounded proposal, not activation, global source completion or native-language certification.'
 note='exact full source unit' if r['sourceRelation'] in direct_relations else 'explicit editorial composition/restricted terminology replacement; full sentence is not a literal publisher quote'
 extra={}
 if r['pointer'] in held_fields:
  verdict='held-preserve-editorial-extension';effective=r['oldExpected']
  why='Whole-field source replacement drops an existing useful editorial explanation/example/qualification. Do not activate before a reviewed separate source-versus-editorial presentation preserves the old full value and labels its origin.'
  extra={'preservationPlan':{'officialSourceText':r['newVietnamese'],'editorialFullBaselineToPreserve':r['oldExpected'],'editorialLabel':'Nội dung bổ trợ (không phải nguyên văn bản dịch trong SGK)','requiresReviewedSeparatePresentation':True},'productionCandidateApproved':False}
 if r['pointer'] in repair_fields:
  verdict='repair-publisher-erratum';effective=r['oldExpected'];replacement=r['newVietnamese'].replace('có bến xe buýt đến rạp','có xe buýt đến rạp',1)
  why='OriginalPDF32/printed018 prints bến xe buýt in the first question, but its Chinese asks whether a bus goes to the cinema, and the printed A example asks 公交车. The subsequent station-distance question correctly concerns bến xe buýt. Do not inject the first-question target shift.'
  extra={'sourceFaithfulnessAccepted':True,'bookSemanticDecision':'publisher-translation-error candidate; root final erratum resolution pending','recommendedRepairedFullNewValue':replacement,'repairOnlyFirstOccurrence':True,'printedSourceWordingRetained':r['newVietnamese'],'originalPageEvidence':'pdf032-original-page-3x.png','productionCandidateApproved':False}
  check('erratum repair changes exactly first station-to-cinema occurrence, keeps second station-distance query',replacement!=r['newVietnamese'] and 'có xe buýt đến rạp' in replacement and 'bến xe buýt có xa không' in replacement,recordId=rid)
 decisions.append({'ordinal':i,'recordId':rid,'file':r['file'],'pointer':r['pointer'],'oldValue':r['oldExpected'],'oldValueRole':'actual immutable baseline; replacement guard only uses this value','authorNewValue':r['newVietnamese'],'expectedSourceWordings':source_values,'officialSourceIDs':sids,'sourceRelation':r['sourceRelation'],'chineseContext':r['chineseContext'],'consumerBindings':r['relatedSemanticBindingIds'],'independentDecision':verdict,'proposedEffectiveValue':effective,'semanticReview':why,'sourceLiteralBoundary':note,'activationApproved':False,**extra})
check('150 proposals exactly143accepted+5held+2repair with no omitted ID',collections.Counter(r['independentDecision']for r in decisions)=={'accepted-proposal':143,'held-preserve-editorial-extension':5,'repair-publisher-erratum':2})

local_by={w['id']:w for w in lesson['vocabulary']};proposal_by={(r['file'],r['pointer']):r for r in proposals};pairs=[]
for i,sense in enumerate(lexicon['senses']):
 refs=[r for r in sense['sources']if r['lessonId']==lesson['id']]
 if not refs:continue
 check('canonical sense binds exactly one actual local word without cross-lesson source',len(refs)==1 and len(sense['sources'])==1,senseId=sense['id'])
 word=local_by[refs[0]['wordId']];localidx=next(i for i,w in enumerate(lesson['vocabulary'])if w['id']==word['id'])
 local=proposal_by.get((lessonfile,f'/vocabulary/{localidx}/vi'));canonical=proposal_by.get((lexfile,f'/senses/{i}/vi'))
 check('paired canonical/local baseline, immutable Chinese/PY/POS and proposed full VI agree',sense['vi']==word['vi'] and sense['zh']==word['zh'] and sense['pos']==word['pos'] and bool(local)==bool(canonical) and (not local or local['newVietnamese']==canonical['newVietnamese'] and local['officialSourceIds']==canonical['officialSourceIds']),senseId=sense['id'])
 pairs.append({'senseId':sense['id'],'wordId':word['id'],'localPointer':f'/vocabulary/{localidx}/vi','canonicalPointer':f'/senses/{i}/vi','localRecordID':local['recordId']if local else None,'canonicalRecordID':canonical['recordId']if canonical else None,'unchangedZh':word['zh'],'unchangedPOS':word['pos'],'approvedPairedProposal':bool(local)})
check('all17 canonical senses represented; exactly9changing sense pairs',len(pairs)==17 and sum(p['approvedPairedProposal']for p in pairs)==9)

simulated={f:copy.deepcopy(v)for f,v in jsons.items()}
for r in proposals:put(simulated[r['file']],r['pointer'],r['newVietnamese'])
seal=[]
for f,baseline in jsons.items():
 before=nonvi(baseline);after=nonvi(simulated[f]);equal=before==after
 check('entire actual nonVI document projection unchanged by all150 simulated author proposals',equal,file=f)
 seal.append({'file':f,'nonVIEqual':equal,'canonicalJSONSHA256':hashlib.sha256(json.dumps(before,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest(),'scope':'entire document, including all Chinese, PY, IDs, option order, answers, assessment, source, media metadata, POS and existing structural arrays; only literal vi properties removed'})
def choices(v,path=''):
 result=[]
 if isinstance(v,dict):
  for k,x in v.items():
   if k=='options' and isinstance(x,list) and x and all(isinstance(a,dict)and isinstance(a.get('vi'),str)for a in x):result.append((path+'/'+k,[a['vi']for a in x]))
   result+=choices(x,path+'/'+k)
 elif isinstance(v,list):
  for i,x in enumerate(v):result+=choices(x,path+'/'+str(i))
 return result
before_options=dict(choices(lesson));after_options=dict(choices(simulated[lessonfile]));collision=[]
for pointer,values in after_options.items():
 old=before_options[pointer];new_pairs={(i,j)for i in range(len(values))for j in range(i+1,len(values))if values[i]==values[j]and old[i]!=old[j]}
 if new_pairs:collision.append({'pointer':pointer,'newCollisions':sorted(new_pairs)})
check('all changed visible VI option labels introduce no new collisions or scoring ambiguity',not collision,optionArrays=len(after_options))

outside=[r for r in rows if r['decision']=='pending-official-source-outside-pilot']
check('18 star/appendix metadata remain outside source and outside150 activation proposals',len(outside)==18 and all(r['recordId']not in {p['recordId']for p in proposals}for r in outside))
svg=[r for r in rows if r['file'].endswith('.svg')]
check('13 full SVG source desc kept editorial with no source-translation acceptance',len(svg)==13 and all(r['decision']=='keep-editorial-no-complete-printed-counterpart'for r in svg))
registry=load(ROOT/'course-app/content/official-vi-registry.json')
check('current HSK2 registration explicitly null; proposed revision is not active',registry['courses']['hsk2'] is None)
coverage={'status':'accepted bounded524 raw baseline classifications, not524officialtranslations or global UI completeness','explicitVILeaves':451,'lessonCandidateRows':476,'canonicalVIPlusPOS':34,'indexTitle':1,'SVGFullDesc':13,'pendingAppendix18':[{'recordId':r['recordId'],'file':r['file'],'pointer':r['pointer'],'oldValue':r['oldExpected'],'status':'held-outside-accepted104source'}for r in outside],'SVG13':[{'recordId':r['recordId'],'file':r['file'],'pointer':r['pointer'],'status':'editorial-accessibility-source-metadata; no native accessibility or source counterpart acceptance'}for r in svg],'globalUI':'B14 required; hardcoded heading consumers separate from524 raw records; known Property.value inventory defect and current main source drift preclude global coverage inference'}
emit('proposal-decisions.json',decisions);emit('canonical-pairs.json',pairs);emit('non-vi-seal.json',{'passed':all(r['nonVIEqual']for r in seal),'documents':seal,'introducedOptionCollisions':collision,'simulationOnly':True,'runtimeWrites':0})
emit('scope-coverage.json',coverage);emit('author-input-status.json',author_input_status)
emit('verification.json',{'passed':all(r['passed']for r in checks),'checksCount':len(checks),'checks':checks,'productionChanges':0,'fullInventoryExecuted':False,'nativeTestsPerformed':False})
print(json.dumps({'passed':all(r['passed']for r in checks),'checks':len(checks),'failed':[r for r in checks if not r['passed']],'decisions':collections.Counter(r['independentDecision']for r in decisions)},ensure_ascii=False))
assert all(r['passed']for r in checks)
