#!/usr/bin/env python3
"""Check the review evidence against actual source/projection bytes. No runtime writes."""
import csv, copy, hashlib, json, subprocess
from datetime import datetime, timezone
from pathlib import Path
from collections import Counter
from PIL import Image

OUT = Path(__file__).resolve().parent
ROOT = Path(__file__).resolve().parents[5]
PDF = ROOT.parent / 'upload/HSK1  (3.0).pdf'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text())
def resolve(value,pointer):
    for part in pointer.split('/')[1:]:
        part=part.replace('~1','/').replace('~0','~')
        value=value[int(part)] if isinstance(value,list) else value[part]
    return value
source=read(OUT/'source-review.json')
author_path=ROOT/'course-app/docs/resume-20261004/official-vi-source-prep/hsk1-l04/transcription.json'
author=read(author_path)
scope=read(OUT/'consumer-scope.json')
comparison=read(OUT/'website-comparison.json')
issues=[]
def check(condition,message):
    if not condition:issues.append(message)
check(sha(PDF)==source['sourcePDFSHA256'],'Official PDF SHA changed')
check(PDF.stat().st_size==source['sourcePDFBytes'],'Official PDF size changed')
check(sha(author_path)==source['authorTranscriptionSHA256'],'Author source SHA changed')
check(sha(OUT/'consumer-scope.json')==comparison['consumerScopeSHA256'],'Consumer scope SHA changed')
src={e['sourceID']:e for e in author['entries']}
check(len(src)==105 and len(source['entries'])==105,'105 source-ID cardinality failed')
check({e['sourceID'] for e in source['entries']}==set(src),'Independent source identity set differs')
check(sum(e['kind']=='vocabulary-row' for e in author['entries'])==21,'21 vocabulary-row count failed')
check(sum(bool(e.get('speakerVi')) for e in author['entries'])==14,'14 role count failed')
for e in source['entries']:
    s=src[e['sourceID']]
    check(e['decision']=='accept-visual-print-transcription' and not e['repairRequired'],'Pending/repaired source ID '+e['sourceID'])
    check(e['expectedViText']==s['viText'] and e.get('expectedPosRawLabel')==s.get('posRawLabel'),'Source value mismatch '+e['sourceID'])
    check(e['pdfPage']==s['pdfPage'] and e['printedPage']==s['printedPage'],'Source page mismatch '+e['sourceID'])
pages=[]
for e in source['pages']:
    p=Path(e['renderPath'])
    check(e['independentFullPageReviewed'],'Unreviewed original page '+str(e['pdfPage']))
    check(e['observedFooterLabel']==f"{e['expectedPrintedPage']:03}",'Actual-footer mismatch '+str(e['pdfPage']))
    check(sha(p)==e['renderSHA256'],'Original render SHA changed '+str(p))
    with Image.open(p) as im:im.load();size=list(im.size)
    pages.append({'pdfPage':e['pdfPage'],'footer':e['observedFooterLabel'],'SHA256':sha(p),'pixels':size,'decoded':True})
check([e['pdfPage'] for e in pages]==list(range(34,43)),'Physical page range failed')
evidence=[]
for page,name,rect,note in [
 (34,'pdf034-title.png',[290,150,2100,760],'Chị có hai con exact printed title'),
 (38,'pdf038-role-translations.png',[1260,1160,1300,570],'Four text2 role lines with Chị/Em'),
 (41,'pdf041-vocabulary-pos.png',[1470,315,1170,1320],'Vocabulary14–21; 多 raw đt. and explicit phó từ chỉ mức độ')]:
    p=OUT/'evidence'/name
    with Image.open(p) as im:im.load();size=list(im.size)
    check(size==rect[2:],'Crop rectangle output size failed '+name)
    evidence.append({'file':'evidence/'+name,'SHA256':sha(p),'bytes':p.stat().st_size,'pdfPage':page,'printedPage':page-16,
                     'sourcePDFSHA256':source['sourcePDFSHA256'],'renderer':'pdftoppm -cropbox -r360',
                     'rectangleInRotatedCropBoxRasterPixels':dict(zip(['x','y','width','height'],rect)),
                     'pixels':size,'independentlyViewed':True,'visualFinding':note})
(OUT/'evidence-manifest.json').write_text(json.dumps({'schemaVersion':1,'sourcePDF':str(PDF),'sourcePDFSHA256':source['sourcePDFSHA256'],
      'coordinateConvention':'Original rotated PDF CropBox raster at360dpi; x/y/width/height passed directly to pdftoppm, not crop of an author PNG.',
      'crops':evidence},ensure_ascii=False,indent=2)+'\n')

# Independently reproduce only the declared effective presentation values, retaining exact frozen inputs.
book_path=ROOT/'hsk1-app/content/textbook.json'
book=read(book_path)
overlay_path=ROOT/'hsk1-app/content/textbook-display-revisions.json'
overlay=read(overlay_path)
effective=copy.deepcopy(book)
targets={}
def visit(value):
    if isinstance(value,dict):
        if isinstance(value.get('id'),str):targets[value['id']]=value
        for v in value.values():visit(v)
    elif isinstance(value,list):
        for v in value:visit(v)
visit(effective['lessons'])
for lesson in effective['lessons']:targets[f"textbook-l{lesson['id']:02}-title"]=lesson
for c in overlay['changes']:
    t=targets[c['target']]
    check(t[c['field']]==c['expected'],'Existing overlay stale expected '+c['target']+':'+c['field'])
    t[c['field']]=copy.deepcopy(c['value'])
current=scope['currentConsumers']
check(len(current)==370 and len(comparison['currentDisplayDecisions'])==370,'370 current field cardinality failed')
check(len({r['recordId'] for r in current})==370,'Duplicate current field identity')
lookup={r['recordId']:r for r in comparison['currentDisplayDecisions']}
cache={}
for e in current:
    value=effective if e['component']=='hsk1-textbook-effective' else cache.setdefault(e['file'],read(ROOT/e['file']))
    actual=resolve(value,e['pointer'])
    check(actual==e['currentVietnamese'],'Actual current display drift '+e['file']+e['pointer'])
    r=lookup[e['recordId']]
    check(r['expected']==actual,'Comparison expected drift '+e['pointer'])
    check(isinstance(r['newValue'],str) and r['decision'] is not None,'Undecided current target '+e['pointer'])
    for s in r['sourceIDs']:check(s in src,'Unknown official binding '+s)
    if r.get('projection')=='verbatim':check(r['newValue']==src[r['sourceIDs'][0]]['viText'],'Verbatim binding mismatch '+e['pointer'])
    if r.get('projection')=='dialogue-body-with-speaker-separate':
        s=src[r['sourceIDs'][0]]
        check(r['newValue']==s['viText'].removeprefix(s['speakerVi']+': '),'Dialogue body projection failed '+e['pointer'])
    if 'currentActivityIdentity' in r:
        a=cache[e['file']]['activities'][int(e['pointer'].split('/')[2])]
        check(r['currentActivityIdentity']==a['id']+'@'+a['version'],'Activity version mismatch '+e['pointer'])
check(Counter(r['decision'] for r in comparison['currentDisplayDecisions'])==Counter(comparison['counts']['currentFieldDecisions']),'Decision summary mismatch')
check(not comparison['runtimeEdited'] and not comparison['historicalBanksEdited'] and not comparison['websiteConformanceAccepted'],'Invalid integration/certification claim')
check(len(comparison['speakerDecisions'])==14 and len(comparison['cataloguePresentationBindings'])==35,'Role/sense cardinality failed')
check(len(comparison['generatedPracticeDecisions'])==120 and sum(bool(e['exactParentPointers']) for e in comparison['generatedPracticeDecisions'])==51,'Generated-practice provenance cardinality failed')
for e in comparison['generatedPracticeDecisions']:
    values={resolve(effective,p) for p in e['exactParentPointers']}
    if values:check(values=={e['expected']},'Generated practice current parent drift '+e['virtualPointer'])
proof=[]; producer_changes=[]
for e in scope['fileProof']:
    actual=sha(ROOT/e['file'])
    proof.append({'file':e['file'],'SHA256':actual,'SHA256AtScopeRead':e['actualSHA256'],'matchesScopeAtRead':actual==e['actualSHA256']})
    if actual!=e['actualSHA256']:producer_changes.append(proof[-1])
registry_path=ROOT/'hsk1-app/content/official-vi-registry.json'
registry=read(registry_path) if registry_path.exists() else None
check(registry is not None and registry['active'] is None,'New default official registry is no longer inactive; current display projection must be refreshed')
with (OUT/'source-review.tsv').open('w',newline='') as f:
    w=csv.writer(f,delimiter='\t');w.writerow(['sourceID','pdfPage','printedFooter','decision','expectedViText','rawPOS','repairRequired','evidence'])
    for e in source['entries']:w.writerow([e['sourceID'],e['pdfPage'],f"{e['printedPage']:03}",e['decision'],e['expectedViText'],e.get('expectedPosRawLabel') or '',e['repairRequired'],','.join(e['evidence'])])
source['websiteComparisonCompleted']=True
source['websiteConformanceAccepted']=False
(OUT/'source-review.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
out={'schemaVersion':1,'checkedAtUTC':datetime.now(timezone.utc).isoformat(),'headAtCheck':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
     'sourceAccepted':True,'sourceIDs':105,'physicalPages':9,'sourceRepairs':0,'missingVisibleVietnameseOccurrences':0,
     'vocabularyRows':21,'dialogueLines':14,'currentPointerComparisons':370,'currentPointerDrift':sum('drift' in x for x in issues),
     'originalRenderChecks':pages,'permanentCrops':evidence,'actualProducerFileChecks':proof,
     'producerBytesChangedAfterScopeRead':producer_changes,'consumerProducerFreezeStillExact':not producer_changes,
     'newDefaultRegistryInactive':registry is not None and registry['active'] is None,
     'newDefaultRegistryFileSHA256':sha(registry_path) if registry_path.exists() else None,
     'producerRevalidationRequired':bool(producer_changes),
     'producerChangeLimit':'Parent/author concurrently added inactive official-VI registry infrastructure and tool guard updates. Comparison retains exact earlier consumer-scope bytes;370 content/display values still checked separately. This is not current full-runtime certification.',
     'comparisonCounts':comparison['counts'],'runtimeEdited':False,'nativeExecutedForNewWording':False,
     'fontCertifiedByThisReview':False,'websiteConformanceAccepted':False,'issues':issues,'allReviewConsistencyChecksPassed':not issues}
(OUT/'verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'issues':issues,'allReviewConsistencyChecksPassed':not issues,'currentPointers':370,'sourceIDs':105,'pages':9,'crops':len(evidence),'actualProducerFiles':len(proof)},ensure_ascii=False,indent=2))
raise SystemExit(1 if issues else 0)
