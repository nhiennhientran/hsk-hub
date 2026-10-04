"""Checks the candidate snapshot against independently visually transcribed HSK1 L5-8 keys.
No claim of language certification, listening, browser, or new official-Vietnamese review.
Run from the repository root. Does not modify candidates.
"""
from pathlib import Path
import hashlib,json,fitz
ROOT=Path(__file__).resolve().parents[4]
BASE=ROOT/'course-app/docs/resume-20261004/content-05-08'
BOOK=Path('/workspace/scratch/67c4ddcee7f7/upload/新HSK教程1(HSK3.0) (郭风岚、汤旭编著) (z-library.sk, 1lib.sk, z-lib.sk) (1)(3).pdf')
ANSWER=Path('/workspace/scratch/67c4ddcee7f7/upload/《新HSK教程1》客观题答案(5).pdf')
TH='25d1aad102e4179307b5bc4f932927bbd244b3f4dd53edeb6cfd4dbbb8d4f2ba'
AH='9e783c9deb889231a778d6776b65dbc04fc734eeca0fdfda1c9d99eb793104e5'
RANGES={5:(27,34),6:(35,44),7:(45,53),8:(54,60)}
KEYS={
 5:{'warmup':['A','E','F','C','D','B'],'listen-text2':['A','C'],'listen-text3':['B','C'],'cloze':['C','D','A','EB']},
 6:{'warmup':['C','A','D','F','E','B'],'listen-text2':['C','B'],'listen-text3':['C','B'],'cloze':['EB','D','C','A']},
 7:{'warmup':['C','E','D','B','F','A'],'listen-text2':['B','A'],'listen-text3':['C','C'],'cloze':['C','BE','D','A']},
 8:{'warmup':['C','F','B','A','D','E'],'listen-text2':['C','A'],'listen-text3':['B','B'],'cloze':['B','E','AC','D']}
}
ANSWER_PAGES={5:{'warmup':2,'listen-text2':2,'listen-text3':2,'cloze':3},6:{'warmup':3,'listen-text2':3,'listen-text3':3,'cloze':4},7:{'warmup':4,'listen-text2':4,'listen-text3':4,'cloze':5},8:{'warmup':5,'listen-text2':5,'listen-text3':5,'cloze':6}}
def sha(b):return hashlib.sha256(b).hexdigest()
assert sha(BOOK.read_bytes())==TH
assert sha(ANSWER.read_bytes())==AH
book=fitz.open(BOOK)
textbook=json.loads((ROOT/'hsk1-app/content/textbook.json').read_text())
scene_ids={s['id'] for l in textbook['lessons'] for s in l['scenes']}
report={'schema':1,'sourceSHA256':TH,'answerSHA256':AH,'scope':'Original Chinese HSK1 L5-8 source/answer/crop review; official Vietnamese textbook alignment is deferred.','lessons':[],'failures':[]}
for n,(start,end) in RANGES.items():
 path=BASE/f'lesson-{n:02}.json';d=json.loads(path.read_text());assert d['textbookSHA256']==TH and d['answerBookSHA256']==AH
 lr={'lesson':n,'candidatePath':str(path.relative_to(ROOT)),'candidateSHA256':sha(path.read_bytes()),'activitiesSHA256':sha(json.dumps(d['activities'],ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()),'printedPages':list(range(start,end+1)),'pdfPages':list(range(start+15,end+16)),'visualReview':'all source pages inspected','activities':len(d['activities']),'fields':sum(len(a['fields']) for a in d['activities']),'figures':len(d['figures']),'answerFields':0,'ungradedFields':0,'optionalFields':0,'answerChecks':[],'cropChecks':[],'canonicalCorrections':d['textbookCorrections'],'limitations':['No native browser execution by this reviewer.','No human listening or physical-device testing.','Not a full audit against newly uploaded official Vietnamese textbooks.','Canonical main-bank corrections are approved suggestions, not proof they have been applied to display.']}
 assert sorted(c['printedPage'] for c in d['coverage'])==list(range(start,end+1))
 figures={f['id']:f for f in d['figures']}
 for a in d['activities']:
  s=a['source'];assert start<=s['printedPage']<=end and s['pdfPage']==s['printedPage']+15
  if 'printedPages' in s:assert s['pdfPages']==[p+15 for p in s['printedPages']]
  if 'figure' in a:assert a['figure'] in figures and a['figureSHA256']==figures[a['figure']]['sha256']
  if 'audio' in a:assert a['audio']['sceneId'] in scene_ids and a['audio']['verifiedByListening'] is False
  for f in a['fields']:
   if f.get('required') is False:lr['optionalFields']+=1
   if f['assessment']=='ungraded':lr['ungradedFields']+=1;assert 'answer' not in f and 'answerSource' not in f
   if a['kind']=='pair-work':assert f.get('required') is False
  if s['section'] in KEYS[n]:
   expected=KEYS[n][s['section']][s['ordinal']-1];assert ''.join(f['answer'] for f in a['fields'])==expected
   assert len(expected)==len(a['fields'])
   for f in a['fields']:
    assert f['assessment']=='answer-key' and f['answerSource']['sha256']==AH and f['answerSource']['pdfPage']==ANSWER_PAGES[n][s['section']]
    assert f['answer'] in [o['id'] for o in f['options']]
    lr['answerFields']+=1;lr['answerChecks'].append({'activityId':a['id'],'fieldId':f['id'],'answer':f['answer'],'answerPdfPage':f['answerSource']['pdfPage'],'status':'matches independently read source key'})
  if 'table' in a:
   columns=a['table']['columns'];assert all(('zh' in c and 'vi' in c) for c in columns)
   fields={f['id'] for f in a['fields']}
   for r in a['table']['rows']:
    assert len(r['cells'])==len(columns)
    if 'source' in r:assert r['source']['pdfPage']==r['source']['printedPage']+15
    for c in r['cells']:
     if 'fieldId' in c:assert c['fieldId'] in fields
 for f in d['figures']:
  b=(BASE/f['file']).read_bytes();assert sha(b)==f['sha256'];s=f['source'];assert s['pdfPage']==s['printedPage']+15 and s['textbookSHA256']==TH
  regenerated=book[s['pdfPage']-1].get_pixmap(matrix=fitz.Matrix(2,2),clip=fitz.Rect(s['cropPdfPoints'])).tobytes('png');assert sha(regenerated)==sha(b)
  lr['cropChecks'].append({'figureId':f['id'],'sha256':sha(b),'printedPage':s['printedPage'],'pdfPage':s['pdfPage'],'status':'exact reconstruction from source rectangle and visually inspected'})
 assert lr['answerFields']==15
 lr['status']='independent-source-review-passed'
 report['lessons'].append(lr)
report['totals']={k:sum(l[k] for l in report['lessons']) for k in ['activities','fields','figures','answerFields','ungradedFields','optionalFields']}
report['all34SourcePagesVisuallyInspected']=True
report['additionalFrozenMainPinyinReview']={'titleCount':4,'dialogueLineCount':56,'method':'All titles and dialogue lines visually compared with original printed pinyin; differences in whitespace, capitalization and separators alone were not treated as pronunciation errors.','vocabularyMethod':'Source vocabulary pronunciation compared with corresponding frozen entries; confirmed 那边 nàbian -> nàbiān at printed40.'}
report['adaptations']=['L7 classroom three-person input expands the single original answer row into clearly labelled three-person records; original item columns and original example are retained.','Read-only vocabulary tables add explicit source-English and Vietnamese columns while preserving source order.']
report['all5RelevantAnswerPDFPagesVisuallyInspected']=True
report['status']='independent-source-review-passed'
report['metadataOnlyCanonicalCorrections']=sum(len(l['canonicalCorrections']) for l in report['lessons'])
(Path(__file__).parent/'review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
for l in report['lessons']: print(l['lesson'],l['candidateSHA256'],l['status'])
print(report['totals'])
